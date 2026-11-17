/**
 * KING PLAST | الكينج بلاست
 * 4-Tier Administrative Hierarchy & Role-Based Access Control (RBAC)
 */

export type RoleLevel = 'owner' | 'super_admin' | 'staff' | 'customer';

export type AdminPermission = 
  | 'manage_products'
  | 'manage_categories'
  | 'manage_quotations'
  | 'manage_inventory'
  | 'view_inquiries'
  | 'manage_admins'
  | 'manage_settings'
  | 'view_audit_logs';

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  role: RoleLevel;
  permissions: AdminPermission[];
  status: 'active' | 'suspended';
  isOwner: boolean;
  createdAt: string;
}

export interface BootstrapState {
  isInitialized: boolean;
  ownerId?: string;
  ownerEmail?: string;
  initializedAt?: string;
}

export const OWNER_PERMISSIONS: AdminPermission[] = [
  'manage_products',
  'manage_categories',
  'manage_quotations',
  'manage_inventory',
  'view_inquiries',
  'manage_admins',
  'manage_settings',
  'view_audit_logs'
];

export const MAX_SUPER_ADMINS = 3;

/**
 * Checks whether an actor has authority to perform a specific action
 */
export function hasPermission(user: UserAccount | null | undefined, permission: AdminPermission): boolean {
  if (!user || user.status === 'suspended') return false;
  if (user.role === 'owner' || user.isOwner) return true;
  return user.permissions.includes(permission);
}

/**
 * Validates whether an actor can mutate another user's role or status
 * INVARIANT: No one can demote, revoke, or delete the Owner.
 * INVARIANT: Only the Owner can manage Super Admins.
 */
export function canManageTargetUser(actor: UserAccount, target: UserAccount): { allowed: boolean; reason?: string } {
  if (actor.status === 'suspended') {
    return { allowed: false, reason: 'حساب المستخدم معلق' };
  }

  // Owner cannot be modified by anyone other than themselves (and even then cannot remove their own ownership)
  if (target.isOwner || target.role === 'owner') {
    return { allowed: false, reason: 'لا يمكن تعديل أو عزل حساب المالك الرئيسي (Owner)' };
  }

  // Only the owner can manage Super Admins or assign Super Admin role
  if (target.role === 'super_admin') {
    if (actor.role !== 'owner') {
      return { allowed: false, reason: 'فقط المالك الرئيسي مصرح له بإدارة وتعديل صلاحيات المديرين المميزين (Super Admins)' };
    }
  }

  // Super admins cannot manage other super admins or owners
  if (actor.role === 'super_admin') {
    if (target.role === 'staff' || target.role === 'customer') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'ليس لديك صلاحية لإدارة هذا الحساب' };
  }

  // Owner can manage anyone except other owners (which cannot exist)
  if (actor.role === 'owner') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'غير مصرح بالوصول الإداري' };
}

/**
 * Validates addition of a new Super Admin under the max limit of 3
 */
export function validateSuperAdminQuota(currentSuperAdminCount: number): { allowed: boolean; reason?: string } {
  if (currentSuperAdminCount >= MAX_SUPER_ADMINS) {
    return {
      allowed: false,
      reason: `تم الوصول للحد الأقصى للمديرين المميزين المعتمدين (${MAX_SUPER_ADMINS} حسابات)`
    };
  }
  return { allowed: true };
}

/**
 * Secure Owner Bootstrap logic
 * Enforces that only ONE owner can ever be initialized.
 */
export function executeOwnerBootstrap(
  currentState: BootstrapState,
  ownerCredentials: { email: string; displayName: string }
): { success: boolean; newState?: BootstrapState; user?: UserAccount; error?: string } {
  if (currentState.isInitialized) {
    return {
      success: false,
      error: 'النظام مهيأ بالفعل ولا يمكن إنشاء مالك رئيسي ثانٍ (Singleton Invariant)'
    };
  }

  if (!ownerCredentials.email || !ownerCredentials.email.includes('@')) {
    return {
      success: false,
      error: 'يرجى إدخال بريد إلكتروني صالح للمالك الرئيسي'
    };
  }

  const now = new Date().toISOString();
  const ownerId = 'owner_001';

  const newState: BootstrapState = {
    isInitialized: true,
    ownerId,
    ownerEmail: ownerCredentials.email.toLowerCase(),
    initializedAt: now
  };

  const ownerUser: UserAccount = {
    id: ownerId,
    email: ownerCredentials.email.toLowerCase(),
    displayName: ownerCredentials.displayName || 'المالك الرئيسي | KING PLAST',
    role: 'owner',
    permissions: [...OWNER_PERMISSIONS],
    status: 'active',
    isOwner: true,
    createdAt: now
  };

  return {
    success: true,
    newState,
    user: ownerUser
  };
}
