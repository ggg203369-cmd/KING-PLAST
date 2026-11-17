import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { eq, sql } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import {
  auditLogs,
  profiles,
  roleAssignments,
  websiteSettings,
  type AdminPermissions,
  type UserRole,
} from '../db/schema.ts';

export type ProfileRow = typeof profiles.$inferSelect;

export interface AuthRequest extends Request {
  firebaseUser?: DecodedIdToken;
  profile?: ProfileRow;
}

const SUPER_ADMIN_PERMS: AdminPermissions = {
  manageProducts: true,
  manageCategories: true,
  managePrices: true,
  manageOrders: true,
  manageUsers: true,
  manageContent: true,
  manageInquiries: true,
  viewAnalytics: true,
  manageAdmins: true,
};

const DEFAULT_ADMIN_PERMS: AdminPermissions = {
  manageProducts: true,
  manageCategories: true,
  managePrices: true,
  manageOrders: true,
  manageUsers: true,
  manageContent: true,
  manageInquiries: true,
  viewAnalytics: true,
  manageAdmins: false,
};

const NORMAL_USER_PERMS: AdminPermissions = {
  manageProducts: false,
  manageCategories: false,
  managePrices: false,
  manageOrders: false,
  manageUsers: false,
  manageContent: false,
  manageInquiries: false,
  viewAnalytics: false,
  manageAdmins: false,
};

/**
 * Atomic PostgreSQL transaction for first-4-account hierarchical registration:
 * - Account #1 -> SUPER_ADMIN
 * - Accounts #2, #3, #4 -> ADMIN
 * - Account #5+ -> NORMAL_USER
 * Uses pg_advisory_xact_lock to guarantee zero race conditions under concurrent signups.
 */
export async function getOrCreateProfileAtomic(decoded: DecodedIdToken): Promise<ProfileRow> {
  const uid = decoded.uid;
  const email = (decoded.email || '').toLowerCase();
  const displayName = decoded.name || (email ? email.split('@')[0] : 'King Plast User');

  // Fast read path when profile already exists
  const existing = await db.select().from(profiles).where(eq(profiles.uid, uid)).limit(1);
  if (existing.length > 0) {
    if (existing[0].email !== email && email) {
      const [updated] = await db
        .update(profiles)
        .set({ email, updatedAt: new Date() })
        .where(eq(profiles.uid, uid))
        .returning();
      return updated;
    }
    return existing[0];
  }

  return await db.transaction(async (tx) => {
    // Transaction-scoped advisory lock prevents concurrent registration race conditions
    await tx.execute(sql`SELECT pg_advisory_xact_lock(92847103)`);

    // Re-check inside lock
    const insideExisting = await tx.select().from(profiles).where(eq(profiles.uid, uid)).limit(1);
    if (insideExisting.length > 0) {
      return insideExisting[0];
    }

    const countRes = await tx.execute(sql`SELECT COUNT(*)::int AS cnt FROM profiles`);
    const currentCount = Number((countRes.rows[0] as { cnt: number })?.cnt ?? 0);
    const registrationOrder = currentCount + 1;

    // Respect public registration lock after the initial 4 setup accounts
    if (registrationOrder > 4) {
      const [settings] = await tx
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.key, 'default'))
        .limit(1);
      if (settings && settings.allowPublicRegistration === false) {
        throw new Error('PUBLIC_REGISTRATION_DISABLED');
      }
    }

    let assignedRole: UserRole = 'NORMAL_USER';
    let permissions: AdminPermissions = NORMAL_USER_PERMS;
    let reason = `Public user registration (#${registrationOrder})`;

    if (registrationOrder === 1) {
      assignedRole = 'SUPER_ADMIN';
      permissions = SUPER_ADMIN_PERMS;
      reason = 'Initial setup #1 — Primary Super Admin';
    } else if (registrationOrder >= 2 && registrationOrder <= 4) {
      assignedRole = 'ADMIN';
      permissions = DEFAULT_ADMIN_PERMS;
      reason = `Initial setup #${registrationOrder} — Founding Admin`;
    }

    const [created] = await tx
      .insert(profiles)
      .values({
        uid,
        email,
        fullName: displayName,
        role: assignedRole,
        registrationOrder,
        status: 'active',
        permissions,
      })
      .returning();

    await tx.insert(roleAssignments).values({
      targetUid: uid,
      targetEmail: email,
      assignedRole,
      assignedByUid: 'SYSTEM_ATOMIC_BOOTSTRAP',
      reason,
    });

    await tx.insert(auditLogs).values({
      actorUid: uid,
      actorEmail: email,
      actorRole: assignedRole,
      action: 'INITIAL_ROLE_ALLOCATED',
      targetType: 'profile',
      targetId: uid,
      details: { registrationOrder, assignedRole, reason },
    });

    return created;
  });
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.firebaseUser = decoded;
    const profile = await getOrCreateProfileAtomic(decoded);

    if (profile.status === 'blocked' || profile.status === 'suspended') {
      return res.status(403).json({
        error:
          profile.status === 'blocked'
            ? 'هذا الحساب محظور من قبل الإدارة / Account blocked'
            : 'تم إيقاف هذا الحساب مؤقتاً / Account suspended',
        status: profile.status,
      });
    }

    req.profile = profile;
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    if (message === 'PUBLIC_REGISTRATION_DISABLED') {
      return res.status(403).json({
        error: 'التسجيل العام مغلق حالياً من قبل الإدارة / Public registration is disabled',
      });
    }
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.firebaseUser = decoded;
    const existing = await db.select().from(profiles).where(eq(profiles.uid, decoded.uid)).limit(1);
    if (existing.length > 0 && existing[0].status !== 'blocked' && existing[0].status !== 'suspended') {
      req.profile = existing[0];
    }
  } catch {
    // Ignore invalid optional token for public reads
  }
  next();
};

export const requireAdminOrSuper = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.profile) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.profile.role !== 'SUPER_ADMIN' && req.profile.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Administrator access required' });
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.profile) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.profile.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
  }
  next();
};

export const requirePermission = (perm: keyof AdminPermissions) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.profile) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.profile.role === 'SUPER_ADMIN') {
      return next();
    }
    if (req.profile.role === 'ADMIN' && req.profile.permissions?.[perm]) {
      return next();
    }
    return res.status(403).json({
      error: `Forbidden: Missing required permission (${String(perm)})`,
    });
  };
};
