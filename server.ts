import crypto from 'crypto';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  aiSettings,
  auditLogs,
  banners,
  cartItems,
  categories,
  inquiries,
  notifications,
  orderItems,
  orders,
  productImages,
  products,
  profiles,
  roleAssignments,
  uploadedMedia,
  websiteSections,
  websiteSettings,
  wishlists,
  type AdminPermissions,
  type UserRole,
  type UserStatus,
} from './src/db/schema.ts';
import { ensureSeeded } from './src/db/seed.ts';
import {
  optionalAuth,
  requireAdminOrSuper,
  requireAuth,
  requirePermission,
  requireSuperAdmin,
  type AuthRequest,
} from './src/middleware/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function writeAuditLog(
  actor: { uid: string; email: string; role: string },
  action: string,
  targetType: string,
  targetId: string | null,
  details?: Record<string, unknown>
) {
  try {
    await db.insert(auditLogs).values({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action,
      targetType,
      targetId,
      details: details || {},
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}

function csvCell(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  return `"${s.replace(/"/g, '""')}"`;
}

async function getOrInitAiSettings() {
  const rows = await db.select().from(aiSettings).where(eq(aiSettings.key, 'default')).limit(1);
  if (rows[0]) return rows[0];
  const [inserted] = await db
    .insert(aiSettings)
    .values({
      key: 'default',
      aiEnabled: true,
      assistantNameAr: 'ليلي',
      assistantNameEn: 'Laila',
      avatarUrl: '/src/assets/images/laila_ai_avatar_1794909558706.jpg',
    })
    .onConflictDoNothing()
    .returning();
  if (inserted) return inserted;
  const fallback = await db.select().from(aiSettings).where(eq(aiSettings.key, 'default')).limit(1);
  return fallback[0];
}

function maskApiKey(key?: string | null): string | null {
  if (!key || !key.trim()) return null;
  const k = key.trim();
  if (k.length <= 8) return '••••••••';
  return `${k.slice(0, 4)}••••••••${k.slice(-4)}`;
}

function resolveRealKey(key?: string | null): string | null {
  const k = key?.trim();
  if (!k || k === 'MY_GEMINI_API_KEY' || k.startsWith('MY_GEMINI')) return null;
  return k;
}

const GEMINI_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4.1-mini'] as const;

type SupportedAiProvider = 'gemini' | 'openai';

function normalizeAiProvider(val: unknown): SupportedAiProvider {
  return val === 'openai' ? 'openai' : 'gemini';
}

function normalizeAiModel(provider: SupportedAiProvider, val: unknown): string {
  const s = typeof val === 'string' ? val.trim() : '';
  if (provider === 'openai') {
    return (OPENAI_MODELS as readonly string[]).includes(s) ? s : 'gpt-4o-mini';
  }
  return (GEMINI_MODELS as readonly string[]).includes(s) ? s : 'gemini-4-hydrogen';
}

function getAiVaultKey(): Buffer {
  const secret =
    process.env.AI_VAULT_SECRET ||
    process.env.SQL_PASSWORD ||
    'kingplast-ai-vault-2070';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptSecret(plain: string): string {
  const trimmed = plain.trim();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getAiVaultKey(), iv);
  const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(stored?: string | null): string | null {
  if (!stored || !stored.trim()) return null;
  const raw = stored.trim();
  if (!raw.startsWith('enc:v1:')) {
    return raw;
  }
  try {
    const parts = raw.split(':');
    if (parts.length !== 5) return null;
    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const ciphertext = Buffer.from(parts[4], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getAiVaultKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8').trim() || null;
  } catch (err) {
    console.error('Secret decryption warning:', err);
    return null;
  }
}

function serializeAiAdminSettings(aiRow: typeof aiSettings.$inferSelect) {
  const provider = normalizeAiProvider(aiRow.aiProvider);
  const modelName = normalizeAiModel(provider, aiRow.modelName);
  const geminiKey = resolveRealKey(decryptSecret(aiRow.customApiKey));
  const openaiKey = resolveRealKey(decryptSecret(aiRow.openaiApiKey));

  return {
    aiEnabled: aiRow.aiEnabled,
    aiProvider: provider,
    modelName,
    assistantNameAr: aiRow.assistantNameAr,
    assistantNameEn: aiRow.assistantNameEn,
    avatarUrl: aiRow.avatarUrl,
    greetingAr: aiRow.greetingAr,
    greetingEn: aiRow.greetingEn,
    personalityPrompt: aiRow.personalityPrompt,
    hasCustomKey: Boolean(geminiKey),
    maskedKeyHint: maskApiKey(geminiKey),
    hasOpenaiKey: Boolean(openaiKey),
    maskedOpenaiKeyHint: maskApiKey(openaiKey),
    hasServerEnvKey: Boolean(resolveRealKey(process.env.GEMINI_API_KEY)),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'king-plast-marketplace' });
  });

  // Serve uploaded media images stored in PostgreSQL
  app.get('/api/media/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid media id' });
      }
      const [media] = await db
        .select()
        .from(uploadedMedia)
        .where(eq(uploadedMedia.id, id))
        .limit(1);
      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }
      const buffer = Buffer.from(media.dataBase64, 'base64');
      res.setHeader('Content-Type', media.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (error) {
      console.error('Media serve error:', error);
      res.status(500).json({ error: 'Failed to serve media' });
    }
  });

  // Upload image to PostgreSQL media store (Admin / Super Admin)
  app.post(
    '/api/media/upload',
    requireAuth,
    requireAdminOrSuper,
    async (req: AuthRequest, res: Response) => {
      try {
        const { filename, mimeType, base64Data } = req.body || {};
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!mimeType || !allowedTypes.includes(mimeType)) {
          return res.status(400).json({ error: 'Only JPG, PNG, WEBP, GIF images are permitted' });
        }
        if (typeof base64Data !== 'string' || base64Data.length < 10) {
          return res.status(400).json({ error: 'Missing image payload' });
        }
        const cleanedBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanedBase64, 'base64');
        if (buffer.length > 5 * 1024 * 1024) {
          return res.status(400).json({ error: 'Image size exceeds 5MB limit' });
        }

        const safeFilename = String(filename || 'upload.png')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(0, 100);

        const [inserted] = await db
          .insert(uploadedMedia)
          .values({
            filename: safeFilename,
            mimeType,
            dataBase64: cleanedBase64,
            sizeBytes: buffer.length,
            uploadedByUid: req.profile!.uid,
          })
          .returning({ id: uploadedMedia.id, filename: uploadedMedia.filename, sizeBytes: uploadedMedia.sizeBytes });

        await writeAuditLog(req.profile!, 'UPLOAD_MEDIA', 'media', String(inserted.id), {
          filename: safeFilename,
          sizeBytes: inserted.sizeBytes,
        });

        res.json({
          id: inserted.id,
          url: `/api/media/${inserted.id}`,
          filename: inserted.filename,
          sizeBytes: inserted.sizeBytes,
        });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
      }
    }
  );

  // ==================== AUTH & PROFILE ====================
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      await ensureSeeded();
      const profile = req.profile!;
      const isAdmin = profile.role === 'SUPER_ADMIN' || profile.role === 'ADMIN';

      const unreadRes = await db.execute(
        isAdmin
          ? sql`SELECT COUNT(*)::int AS cnt FROM notifications WHERE (target_uid = ${profile.uid} OR target_uid = 'ALL_ADMINS') AND is_read = false`
          : sql`SELECT COUNT(*)::int AS cnt FROM notifications WHERE target_uid = ${profile.uid} AND is_read = false`
      );

      res.json({
        profile,
        unreadNotifications: Number((unreadRes.rows[0] as { cnt: number })?.cnt ?? 0),
      });
    } catch (error) {
      console.error('Auth me error:', error);
      res.status(500).json({ error: 'Failed to load profile' });
    }
  });

  app.patch('/api/auth/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { fullName, companyName, phone, city } = req.body || {};
      if (typeof fullName === 'string' && fullName.trim().length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters' });
      }

      const [updated] = await db
        .update(profiles)
        .set({
          ...(typeof fullName === 'string' ? { fullName: fullName.trim().slice(0, 120) } : {}),
          ...(typeof companyName === 'string' ? { companyName: companyName.trim().slice(0, 120) } : {}),
          ...(typeof phone === 'string' ? { phone: phone.trim().slice(0, 40) } : {}),
          ...(typeof city === 'string' ? { city: city.trim().slice(0, 80) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.uid, req.profile!.uid))
        .returning();

      res.json({ profile: updated });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // ==================== PUBLIC STOREFRONT & CATALOG ====================
  app.get('/api/storefront', async (_req: Request, res: Response) => {
    try {
      await ensureSeeded();

      const [settingsRows, catRows, bannerRows, sectionRows, prodRows, imageRows, countRows, aiRow] =
        await Promise.all([
          db.select().from(websiteSettings).where(eq(websiteSettings.key, 'default')).limit(1),
          db
            .select()
            .from(categories)
            .where(eq(categories.isVisible, true))
            .orderBy(asc(categories.sortOrder), asc(categories.id)),
          db
            .select()
            .from(banners)
            .where(eq(banners.isActive, true))
            .orderBy(asc(banners.sortOrder), asc(banners.id)),
          db
            .select()
            .from(websiteSections)
            .where(eq(websiteSections.isVisible, true))
            .orderBy(asc(websiteSections.sortOrder), asc(websiteSections.id)),
          db
            .select()
            .from(products)
            .where(eq(products.isPublished, true))
            .orderBy(desc(products.isFeatured), desc(products.createdAt)),
          db.select().from(productImages).orderBy(asc(productImages.sortOrder)),
          db.execute(
            sql`SELECT category_id, COUNT(*)::int AS cnt FROM products WHERE is_published = true GROUP BY category_id`
          ),
          getOrInitAiSettings(),
        ]);

      const countMap = new Map<number, number>();
      for (const r of countRows.rows as Array<{ category_id: number | null; cnt: number }>) {
        if (r.category_id !== null) countMap.set(Number(r.category_id), Number(r.cnt));
      }

      const imagesByProd = new Map<number, typeof imageRows>();
      for (const img of imageRows) {
        const list = imagesByProd.get(img.productId) || [];
        list.push(img);
        imagesByProd.set(img.productId, list);
      }

      const categoriesWithCount = catRows.map((c) => ({
        ...c,
        productsCount: countMap.get(c.id) || 0,
      }));

      const enrichedProducts = prodRows.map((p) => ({
        ...p,
        images: imagesByProd.get(p.id) || [],
      }));

      const activeProvider = normalizeAiProvider(aiRow?.aiProvider);
      const hasActiveAiKey =
        activeProvider === 'openai'
          ? Boolean(resolveRealKey(decryptSecret(aiRow?.openaiApiKey)))
          : Boolean(
              resolveRealKey(decryptSecret(aiRow?.customApiKey)) ||
                resolveRealKey(process.env.GEMINI_API_KEY)
            );

      res.json({
        settings: settingsRows[0] || null,
        categories: categoriesWithCount,
        banners: bannerRows,
        sections: sectionRows,
        products: enrichedProducts,
        totalProductsCount: enrichedProducts.length,
        aiAssistant: aiRow
          ? {
              enabled: aiRow.aiEnabled,
              configured: hasActiveAiKey,
              provider: activeProvider,
              nameAr: aiRow.assistantNameAr,
              nameEn: aiRow.assistantNameEn,
              avatarUrl: aiRow.avatarUrl,
              greetingAr: aiRow.greetingAr,
              greetingEn: aiRow.greetingEn,
            }
          : null,
      });
    } catch (error) {
      console.error('Storefront error:', error);
      res.status(500).json({ error: 'Failed to load marketplace data' });
    }
  });

  app.get('/api/products', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      await ensureSeeded();
      const {
        q,
        categoryId,
        materialType,
        grade,
        color,
        availability,
        minPrice,
        maxPrice,
        sort = 'featured',
        includeUnpublished,
      } = req.query as Record<string, string>;

      const isAdmin = req.profile?.role === 'SUPER_ADMIN' || req.profile?.role === 'ADMIN';
      const conditions = [];

      if (!(includeUnpublished === 'true' && isAdmin)) {
        conditions.push(eq(products.isPublished, true));
      }

      if (q && q.trim()) {
        const pattern = `%${q.trim()}%`;
        conditions.push(
          or(
            ilike(products.nameAr, pattern),
            ilike(products.nameEn, pattern),
            ilike(products.sku, pattern),
            ilike(products.materialType, pattern),
            ilike(products.grade, pattern),
            ilike(products.color, pattern),
            ilike(products.descriptionAr, pattern),
            ilike(products.descriptionEn, pattern)
          )
        );
      }

      if (categoryId && categoryId !== 'all') {
        const cid = Number(categoryId);
        if (Number.isInteger(cid)) conditions.push(eq(products.categoryId, cid));
      }

      if (materialType && materialType !== 'all') {
        conditions.push(eq(products.materialType, materialType));
      }

      if (grade && grade.trim()) {
        conditions.push(ilike(products.grade, `%${grade.trim()}%`));
      }

      if (color && color.trim()) {
        conditions.push(ilike(products.color, `%${color.trim()}%`));
      }

      if (availability && availability !== 'all') {
        conditions.push(eq(products.availabilityStatus, availability));
      }

      if (minPrice && !Number.isNaN(Number(minPrice))) {
        conditions.push(gte(products.price, Number(minPrice)));
      }

      if (maxPrice && !Number.isNaN(Number(maxPrice))) {
        conditions.push(lte(products.price, Number(maxPrice)));
      }

      let orderClause = [desc(products.isFeatured), desc(products.createdAt)];
      if (sort === 'newest') orderClause = [desc(products.createdAt)];
      if (sort === 'best_selling') orderClause = [desc(products.isBestSeller), desc(products.salesCount)];
      if (sort === 'price_asc') orderClause = [asc(products.price), desc(products.createdAt)];
      if (sort === 'price_desc') orderClause = [desc(products.price), desc(products.createdAt)];

      const rows = await db
        .select()
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(...orderClause);

      const allImgs = await db.select().from(productImages).orderBy(asc(productImages.sortOrder));
      const imgMap = new Map<number, typeof allImgs>();
      for (const img of allImgs) {
        const list = imgMap.get(img.productId) || [];
        list.push(img);
        imgMap.set(img.productId, list);
      }

      res.json({
        products: rows.map((p) => ({ ...p, images: imgMap.get(p.id) || [] })),
      });
    } catch (error) {
      console.error('Products query error:', error);
      res.status(500).json({ error: 'Failed to search products' });
    }
  });

  app.get('/api/products/suggestions', async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || '').trim();
      if (!q) return res.json({ suggestions: [] });
      const pattern = `%${q}%`;
      const rows = await db
        .select({
          id: products.id,
          nameAr: products.nameAr,
          nameEn: products.nameEn,
          materialType: products.materialType,
          grade: products.grade,
          sku: products.sku,
          mainImageUrl: products.mainImageUrl,
        })
        .from(products)
        .where(
          and(
            eq(products.isPublished, true),
            or(
              ilike(products.nameAr, pattern),
              ilike(products.nameEn, pattern),
              ilike(products.materialType, pattern),
              ilike(products.grade, pattern),
              ilike(products.sku, pattern)
            )
          )
        )
        .limit(7);

      res.json({ suggestions: rows });
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
  });

  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid product id' });
      }
      const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!prod) {
        return res.status(404).json({ error: 'Product not found' });
      }
      const imgs = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(asc(productImages.sortOrder));

      res.json({ product: { ...prod, images: imgs } });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to load product' });
    }
  });

  // ==================== CART, WISHLIST & ORDERS ====================
  app.get('/api/cart', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const rows = await db
        .select({
          id: cartItems.id,
          quantity: cartItems.quantity,
          unitNote: cartItems.unitNote,
          product: products,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userUid, req.profile!.uid))
        .orderBy(desc(cartItems.createdAt));

      res.json({ items: rows });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ error: 'Failed to load cart' });
    }
  });

  app.post('/api/cart', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { productId, quantity = 1, unitNote } = req.body || {};
      const pid = Number(productId);
      const qty = Math.max(1, Math.min(100000, Number(quantity) || 1));
      if (!Number.isInteger(pid) || pid <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }

      const [prod] = await db.select().from(products).where(eq(products.id, pid)).limit(1);
      if (!prod || !prod.isPublished) {
        return res.status(404).json({ error: 'Product unavailable' });
      }

      const existing = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.userUid, req.profile!.uid), eq(cartItems.productId, pid)))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(cartItems)
          .set({
            quantity: existing[0].quantity + qty,
            unitNote: typeof unitNote === 'string' ? unitNote.slice(0, 200) : existing[0].unitNote,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existing[0].id))
          .returning();
        return res.json({ item: updated });
      }

      const [created] = await db
        .insert(cartItems)
        .values({
          userUid: req.profile!.uid,
          productId: pid,
          quantity: Math.max(qty, prod.minOrderQuantity || 1),
          unitNote: typeof unitNote === 'string' ? unitNote.slice(0, 200) : null,
        })
        .returning();

      res.json({ item: created });
    } catch (error) {
      console.error('Add cart error:', error);
      res.status(500).json({ error: 'Failed to add to cart' });
    }
  });

  app.patch('/api/cart/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const qty = Math.max(1, Math.min(100000, Number(req.body?.quantity) || 1));
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: qty, updatedAt: new Date() })
        .where(and(eq(cartItems.id, id), eq(cartItems.userUid, req.profile!.uid)))
        .returning();
      if (!updated) return res.status(404).json({ error: 'Cart item not found' });
      res.json({ item: updated });
    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({ error: 'Failed to update quantity' });
    }
  });

  app.delete('/api/cart/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, id), eq(cartItems.userUid, req.profile!.uid)));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete cart item error:', error);
      res.status(500).json({ error: 'Failed to remove cart item' });
    }
  });

  app.get('/api/wishlist', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const rows = await db
        .select({ id: wishlists.id, productId: wishlists.productId, product: products })
        .from(wishlists)
        .innerJoin(products, eq(wishlists.productId, products.id))
        .where(eq(wishlists.userUid, req.profile!.uid))
        .orderBy(desc(wishlists.createdAt));

      res.json({ items: rows });
    } catch (error) {
      console.error('Wishlist get error:', error);
      res.status(500).json({ error: 'Failed to load wishlist' });
    }
  });

  app.post('/api/wishlist/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const pid = Number(req.body?.productId);
      if (!Number.isInteger(pid) || pid <= 0) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }
      const existing = await db
        .select()
        .from(wishlists)
        .where(and(eq(wishlists.userUid, req.profile!.uid), eq(wishlists.productId, pid)))
        .limit(1);

      if (existing.length > 0) {
        await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
        return res.json({ saved: false });
      }
      await db.insert(wishlists).values({ userUid: req.profile!.uid, productId: pid });
      res.json({ saved: true });
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      res.status(500).json({ error: 'Failed to toggle wishlist' });
    }
  });

  // Orders & Quotation Submission
  app.get('/api/orders/my', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const myOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userUid, req.profile!.uid))
        .orderBy(desc(orders.createdAt));

      const itemsList =
        myOrders.length > 0
          ? await db.select().from(orderItems).orderBy(asc(orderItems.id))
          : [];
      const itemsMap = new Map<number, typeof itemsList>();
      for (const item of itemsList) {
        const list = itemsMap.get(item.orderId) || [];
        list.push(item);
        itemsMap.set(item.orderId, list);
      }

      res.json({
        orders: myOrders.map((o) => ({ ...o, items: itemsMap.get(o.id) || [] })),
      });
    } catch (error) {
      console.error('My orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.post('/api/orders', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const {
        customerName,
        customerPhone,
        companyName,
        shippingAddress,
        orderType = 'quotation',
        notes,
        fromCart = true,
        directItem,
      } = req.body || {};

      if (!customerName || String(customerName).trim().length < 2) {
        return res.status(400).json({ error: 'Customer name is required' });
      }
      if (!customerPhone || String(customerPhone).trim().length < 6) {
        return res.status(400).json({ error: 'Phone number is required' });
      }
      if (!shippingAddress || String(shippingAddress).trim().length < 5) {
        return res.status(400).json({ error: 'Delivery address is required' });
      }

      const createdOrder = await db.transaction(async (tx) => {
        let lineProducts: Array<{ product: typeof products.$inferSelect; quantity: number }> = [];

        if (fromCart) {
          const rows = await tx
            .select({ quantity: cartItems.quantity, product: products })
            .from(cartItems)
            .innerJoin(products, eq(cartItems.productId, products.id))
            .where(eq(cartItems.userUid, req.profile!.uid));
          lineProducts = rows;
        } else if (directItem?.productId) {
          const [prod] = await tx
            .select()
            .from(products)
            .where(eq(products.id, Number(directItem.productId)))
            .limit(1);
          if (prod) {
            lineProducts = [
              { product: prod, quantity: Math.max(1, Number(directItem.quantity) || 1) },
            ];
          }
        }

        if (lineProducts.length === 0) {
          throw new Error('EMPTY_CART');
        }

        let hasAnyPricedItem = false;
        let hasContactPriceItem = false;
        let computedTotal = 0;

        const preparedItems = lineProducts.map(({ product, quantity }) => {
          const activePrice =
            product.priceUnit !== 'contact'
              ? product.discountPrice ?? product.price
              : null;

          if (activePrice !== null && activePrice !== undefined) {
            hasAnyPricedItem = true;
            computedTotal += activePrice * quantity;
          } else {
            hasContactPriceItem = true;
          }

          return {
            productId: product.id,
            productNameAr: product.nameAr,
            productNameEn: product.nameEn,
            quantity,
            unitPrice: activePrice,
            priceUnit: product.priceUnit,
            subtotal: activePrice !== null && activePrice !== undefined ? activePrice * quantity : null,
          };
        });

        const orderNumber = `KP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const resolvedType =
          hasContactPriceItem || orderType === 'quotation' ? 'quotation' : 'purchase';

        const [order] = await tx
          .insert(orders)
          .values({
            orderNumber,
            userUid: req.profile!.uid,
            customerName: String(customerName).trim().slice(0, 120),
            customerEmail: req.profile!.email,
            customerPhone: String(customerPhone).trim().slice(0, 40),
            companyName: companyName ? String(companyName).trim().slice(0, 120) : null,
            shippingAddress: String(shippingAddress).trim().slice(0, 300),
            orderType: resolvedType,
            status: 'pending',
            currency: lineProducts[0].product.currency || 'EGP',
            totalAmount: hasAnyPricedItem && !hasContactPriceItem ? computedTotal : null,
            notes: notes ? String(notes).trim().slice(0, 1000) : null,
          })
          .returning();

        await tx.insert(orderItems).values(
          preparedItems.map((it) => ({
            ...it,
            orderId: order.id,
          }))
        );

        if (fromCart) {
          await tx.delete(cartItems).where(eq(cartItems.userUid, req.profile!.uid));
        }

        await tx.insert(notifications).values([
          {
            targetUid: req.profile!.uid,
            titleAr: `تم استلام طلبك رقم ${orderNumber}`,
            titleEn: `Order ${orderNumber} Received`,
            bodyAr: 'فريق المبيعات يقوم بمراجعة طلبك وتجهيز عرض السعر واللوجستيات.',
            bodyEn: 'Our sales team is reviewing your order and preparing confirmation.',
            type: 'order',
          },
          {
            targetUid: 'ALL_ADMINS',
            titleAr: `طلب جديد رقم ${orderNumber}`,
            titleEn: `New Order ${orderNumber}`,
            bodyAr: `عميل: ${order.customerName} — ${resolvedType === 'quotation' ? 'طلب عرض سعر' : 'طلب شراء'}`,
            bodyEn: `Customer: ${order.customerName} (${resolvedType})`,
            type: 'order',
          },
        ]);

        return { ...order, items: preparedItems };
      });

      res.json({ order: createdOrder });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'EMPTY_CART') {
        return res.status(400).json({ error: 'السلة فارغة / Cart is empty' });
      }
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to submit order' });
    }
  });

  // ==================== INQUIRIES & NOTIFICATIONS ====================
  app.post('/api/inquiries', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { name, email, phone, company, subject, message, type = 'inquiry', productId } =
        req.body || {};

      if (!name || String(name).trim().length < 2) {
        return res.status(400).json({ error: 'Name is required' });
      }
      if (!email || !String(email).includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      if (!message || String(message).trim().length < 5) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;
      const [created] = await db
        .insert(inquiries)
        .values({
          ticketNumber,
          userUid: req.profile?.uid || null,
          name: String(name).trim().slice(0, 120),
          email: String(email).trim().slice(0, 150),
          phone: phone ? String(phone).trim().slice(0, 40) : null,
          company: company ? String(company).trim().slice(0, 120) : null,
          subject: String(subject || 'استفسار تجاري / Commercial Inquiry').trim().slice(0, 200),
          message: String(message).trim().slice(0, 2500),
          type: ['inquiry', 'support', 'report'].includes(type) ? type : 'inquiry',
          productId: productId ? Number(productId) : null,
          status: 'open',
        })
        .returning();

      await db.insert(notifications).values({
        targetUid: 'ALL_ADMINS',
        titleAr: `رسالة / تذكرة دعم جديدة ${ticketNumber}`,
        titleEn: `New Support Ticket ${ticketNumber}`,
        bodyAr: `${created.name}: ${created.subject}`,
        bodyEn: `${created.name}: ${created.subject}`,
        type: 'inquiry',
      });

      res.json({ inquiry: created });
    } catch (error) {
      console.error('Inquiry submit error:', error);
      res.status(500).json({ error: 'Failed to submit inquiry' });
    }
  });

  app.get('/api/inquiries/my', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.userUid, req.profile!.uid))
        .orderBy(desc(inquiries.createdAt));
      res.json({ inquiries: rows });
    } catch (error) {
      console.error('My inquiries error:', error);
      res.status(500).json({ error: 'Failed to load inquiries' });
    }
  });

  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.profile!.role === 'SUPER_ADMIN' || req.profile!.role === 'ADMIN';
      const rows = await db
        .select()
        .from(notifications)
        .where(
          isAdmin
            ? or(
                eq(notifications.targetUid, req.profile!.uid),
                eq(notifications.targetUid, 'ALL_ADMINS')
              )
            : eq(notifications.targetUid, req.profile!.uid)
        )
        .orderBy(desc(notifications.createdAt))
        .limit(40);
      res.json({ notifications: rows });
    } catch (error) {
      console.error('Notifications error:', error);
      res.status(500).json({ error: 'Failed to load notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  });

  // ==================== ADMIN & SUPER ADMIN MANAGEMENT ====================
  app.get(
    '/api/admin/overview',
    requireAuth,
    requireAdminOrSuper,
    async (_req: AuthRequest, res: Response) => {
      try {
        const [
          usersCnt,
          productsCnt,
          publishedCnt,
          catsCnt,
          ordersCnt,
          pendingOrdersCnt,
          openInquiriesCnt,
          recentOrders,
          recentInquiries,
          recentLogs,
        ] = await Promise.all([
          db.execute(sql`SELECT COUNT(*)::int AS cnt FROM profiles`),
          db.execute(sql`SELECT COUNT(*)::int AS cnt FROM products`),
          db.execute(sql`SELECT COUNT(*)::int AS cnt FROM products WHERE is_published = true`),
          db.execute(sql`SELECT COUNT(*)::int AS cnt FROM categories`),
          db.execute(sql`SELECT COUNT(*)::int AS cnt FROM orders`),
          db.execute(sql`SELECT COUNT(*)::int AS cnt FROM orders WHERE status = 'pending'`),
          db.execute(sql`SELECT COUNT(*)::int AS cnt FROM inquiries WHERE status IN ('open', 'in_progress')`),
          db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
          db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(6),
          db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10),
        ]);

        res.json({
          stats: {
            totalUsers: Number((usersCnt.rows[0] as { cnt: number })?.cnt ?? 0),
            totalProducts: Number((productsCnt.rows[0] as { cnt: number })?.cnt ?? 0),
            publishedProducts: Number((publishedCnt.rows[0] as { cnt: number })?.cnt ?? 0),
            totalCategories: Number((catsCnt.rows[0] as { cnt: number })?.cnt ?? 0),
            totalOrders: Number((ordersCnt.rows[0] as { cnt: number })?.cnt ?? 0),
            pendingOrders: Number((pendingOrdersCnt.rows[0] as { cnt: number })?.cnt ?? 0),
            openInquiries: Number((openInquiriesCnt.rows[0] as { cnt: number })?.cnt ?? 0),
          },
          recentOrders,
          recentInquiries,
          recentLogs,
        });
      } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: 'Failed to load dashboard overview' });
      }
    }
  );

  // Admin Products CRUD
  app.post(
    '/api/admin/products',
    requireAuth,
    requirePermission('manageProducts'),
    async (req: AuthRequest, res: Response) => {
      try {
        const b = req.body || {};
        if (!b.nameAr || !b.nameEn || !b.materialType) {
          return res.status(400).json({ error: 'Product Arabic name, English name, and material type are required' });
        }

        const sku =
          b.sku && String(b.sku).trim()
            ? String(b.sku).trim().toUpperCase()
            : `KP-${String(b.materialType).toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`;

        const parsedPrice =
          b.price !== undefined && b.price !== null && b.price !== '' && !Number.isNaN(Number(b.price))
            ? Number(b.price)
            : null;
        const parsedDiscount =
          b.discountPrice !== undefined &&
          b.discountPrice !== null &&
          b.discountPrice !== '' &&
          !Number.isNaN(Number(b.discountPrice))
            ? Number(b.discountPrice)
            : null;
        const parsedStock =
          b.availableQuantity !== undefined &&
          b.availableQuantity !== null &&
          b.availableQuantity !== '' &&
          !Number.isNaN(Number(b.availableQuantity))
            ? Number(b.availableQuantity)
            : null;

        // Enforce permission check for setting prices
        if (parsedPrice !== null && req.profile!.role !== 'SUPER_ADMIN' && !req.profile!.permissions.managePrices) {
          return res.status(403).json({ error: 'Missing permission to set product prices' });
        }

        const [created] = await db
          .insert(products)
          .values({
            sku,
            categoryId: b.categoryId ? Number(b.categoryId) : null,
            nameAr: String(b.nameAr).trim(),
            nameEn: String(b.nameEn).trim(),
            descriptionAr: String(b.descriptionAr || ''),
            descriptionEn: String(b.descriptionEn || ''),
            materialType: String(b.materialType).trim(),
            grade: String(b.grade || ''),
            color: String(b.color || 'Natural'),
            weight: String(b.weight || '25 kg'),
            packaging: String(b.packaging || 'شكائر 25 كجم / جامبو باج'),
            technicalSpecs: b.technicalSpecs || {},
            mainImageUrl:
              b.mainImageUrl || '/src/assets/images/pp_pellets_studio_1794908533302.jpg',
            videoUrl: b.videoUrl || null,
            availableQuantity: parsedStock,
            minOrderQuantity: Math.max(1, Number(b.minOrderQuantity) || 1),
            price: parsedPrice,
            discountPrice: parsedDiscount,
            priceUnit: parsedPrice === null ? 'contact' : b.priceUnit || 'ton',
            currency: b.currency || 'EGP',
            availabilityStatus: b.availabilityStatus || (parsedStock && parsedStock > 0 ? 'in_stock' : 'upon_request'),
            shippingInfoAr: String(b.shippingInfoAr || 'توريد لجميع المناطق الصناعية'),
            shippingInfoEn: String(b.shippingInfoEn || 'Delivery across all industrial zones'),
            isPublished: b.isPublished !== false,
            isFeatured: Boolean(b.isFeatured),
            isBestSeller: Boolean(b.isBestSeller),
            createdByUid: req.profile!.uid,
          })
          .returning();

        if (Array.isArray(b.additionalImages) && b.additionalImages.length > 0) {
          await db.insert(productImages).values(
            b.additionalImages.map((url: string, idx: number) => ({
              productId: created.id,
              imageUrl: url,
              altText: created.nameEn,
              sortOrder: idx,
            }))
          );
        }

        await writeAuditLog(req.profile!, 'CREATE_PRODUCT', 'product', String(created.id), {
          sku: created.sku,
          nameEn: created.nameEn,
        });

        res.json({ product: created });
      } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
      }
    }
  );

  app.put(
    '/api/admin/products/:id',
    requireAuth,
    requirePermission('manageProducts'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        const b = req.body || {};

        const parsedPrice =
          b.price !== undefined && b.price !== null && b.price !== '' && !Number.isNaN(Number(b.price))
            ? Number(b.price)
            : null;
        const parsedDiscount =
          b.discountPrice !== undefined &&
          b.discountPrice !== null &&
          b.discountPrice !== '' &&
          !Number.isNaN(Number(b.discountPrice))
            ? Number(b.discountPrice)
            : null;
        const parsedStock =
          b.availableQuantity !== undefined &&
          b.availableQuantity !== null &&
          b.availableQuantity !== '' &&
          !Number.isNaN(Number(b.availableQuantity))
            ? Number(b.availableQuantity)
            : null;

        const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
        if (!existing) return res.status(404).json({ error: 'Product not found' });

        const canChangePrice =
          req.profile!.role === 'SUPER_ADMIN' || req.profile!.permissions.managePrices;

        const [updated] = await db
          .update(products)
          .set({
            ...(b.categoryId !== undefined ? { categoryId: b.categoryId ? Number(b.categoryId) : null } : {}),
            ...(b.nameAr !== undefined ? { nameAr: String(b.nameAr).trim() } : {}),
            ...(b.nameEn !== undefined ? { nameEn: String(b.nameEn).trim() } : {}),
            ...(b.descriptionAr !== undefined ? { descriptionAr: String(b.descriptionAr) } : {}),
            ...(b.descriptionEn !== undefined ? { descriptionEn: String(b.descriptionEn) } : {}),
            ...(b.materialType !== undefined ? { materialType: String(b.materialType) } : {}),
            ...(b.grade !== undefined ? { grade: String(b.grade) } : {}),
            ...(b.color !== undefined ? { color: String(b.color) } : {}),
            ...(b.weight !== undefined ? { weight: String(b.weight) } : {}),
            ...(b.packaging !== undefined ? { packaging: String(b.packaging) } : {}),
            ...(b.technicalSpecs !== undefined ? { technicalSpecs: b.technicalSpecs } : {}),
            ...(b.mainImageUrl !== undefined ? { mainImageUrl: String(b.mainImageUrl) } : {}),
            ...(b.videoUrl !== undefined ? { videoUrl: b.videoUrl || null } : {}),
            ...(b.availableQuantity !== undefined ? { availableQuantity: parsedStock } : {}),
            ...(b.minOrderQuantity !== undefined ? { minOrderQuantity: Math.max(1, Number(b.minOrderQuantity) || 1) } : {}),
            ...(canChangePrice && b.price !== undefined
              ? {
                  price: parsedPrice,
                  discountPrice: parsedDiscount,
                  priceUnit: parsedPrice === null ? 'contact' : b.priceUnit || existing.priceUnit,
                  currency: b.currency || existing.currency,
                }
              : {}),
            ...(b.availabilityStatus !== undefined ? { availabilityStatus: b.availabilityStatus } : {}),
            ...(b.shippingInfoAr !== undefined ? { shippingInfoAr: String(b.shippingInfoAr) } : {}),
            ...(b.shippingInfoEn !== undefined ? { shippingInfoEn: String(b.shippingInfoEn) } : {}),
            ...(b.isPublished !== undefined ? { isPublished: Boolean(b.isPublished) } : {}),
            ...(b.isFeatured !== undefined ? { isFeatured: Boolean(b.isFeatured) } : {}),
            ...(b.isBestSeller !== undefined ? { isBestSeller: Boolean(b.isBestSeller) } : {}),
            updatedAt: new Date(),
          })
          .where(eq(products.id, id))
          .returning();

        if (Array.isArray(b.additionalImages)) {
          await db.delete(productImages).where(eq(productImages.productId, id));
          if (b.additionalImages.length > 0) {
            await db.insert(productImages).values(
              b.additionalImages.map((url: string, idx: number) => ({
                productId: id,
                imageUrl: url,
                altText: updated.nameEn,
                sortOrder: idx,
              }))
            );
          }
        }

        await writeAuditLog(req.profile!, 'UPDATE_PRODUCT', 'product', String(id), {
          sku: updated.sku,
        });

        res.json({ product: updated });
      } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
      }
    }
  );

  app.post(
    '/api/admin/products/:id/duplicate',
    requireAuth,
    requirePermission('manageProducts'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        const [orig] = await db.select().from(products).where(eq(products.id, id)).limit(1);
        if (!orig) return res.status(404).json({ error: 'Product not found' });

        const { id: _id, sku, createdAt: _c, updatedAt: _u, ...rest } = orig;
        const [copy] = await db
          .insert(products)
          .values({
            ...rest,
            sku: `${sku}-COPY-${Date.now().toString().slice(-3)}`,
            nameAr: `${orig.nameAr} (نسخة)`,
            nameEn: `${orig.nameEn} (Copy)`,
            isPublished: false,
          })
          .returning();

        await writeAuditLog(req.profile!, 'DUPLICATE_PRODUCT', 'product', String(copy.id), {
          sourceId: id,
        });
        res.json({ product: copy });
      } catch (error) {
        console.error('Duplicate product error:', error);
        res.status(500).json({ error: 'Failed to duplicate product' });
      }
    }
  );

  app.delete(
    '/api/admin/products/:id',
    requireAuth,
    requirePermission('manageProducts'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        await db.delete(products).where(eq(products.id, id));
        await writeAuditLog(req.profile!, 'DELETE_PRODUCT', 'product', String(id));
        res.json({ success: true });
      } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
      }
    }
  );

  // Admin Categories CRUD
  app.get(
    '/api/admin/categories',
    requireAuth,
    requireAdminOrSuper,
    async (_req: AuthRequest, res: Response) => {
      try {
        const rows = await db
          .select()
          .from(categories)
          .orderBy(asc(categories.sortOrder), asc(categories.id));
        res.json({ categories: rows });
      } catch (error) {
        console.error('Admin categories error:', error);
        res.status(500).json({ error: 'Failed to load categories' });
      }
    }
  );

  app.post(
    '/api/admin/categories',
    requireAuth,
    requirePermission('manageCategories'),
    async (req: AuthRequest, res: Response) => {
      try {
        const { nameAr, nameEn, descriptionAr, descriptionEn, imageUrl, bannerUrl, parentId, isVisible } =
          req.body || {};
        if (!nameAr || !nameEn) {
          return res.status(400).json({ error: 'Category Arabic & English names are required' });
        }
        const slug = `${String(nameEn)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-3)}`;

        const [created] = await db
          .insert(categories)
          .values({
            slug,
            nameAr: String(nameAr).trim(),
            nameEn: String(nameEn).trim(),
            descriptionAr: String(descriptionAr || ''),
            descriptionEn: String(descriptionEn || ''),
            imageUrl: imageUrl || '/src/assets/images/pp_pellets_studio_1794908533302.jpg',
            bannerUrl: bannerUrl || '/src/assets/images/plastic_pallets_packaging_1794908535344.jpg',
            parentId: parentId ? Number(parentId) : null,
            isVisible: isVisible !== false,
          })
          .returning();

        await writeAuditLog(req.profile!, 'CREATE_CATEGORY', 'category', String(created.id), {
          nameEn: created.nameEn,
        });
        res.json({ category: created });
      } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
      }
    }
  );

  app.put(
    '/api/admin/categories/:id',
    requireAuth,
    requirePermission('manageCategories'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        const b = req.body || {};
        const [updated] = await db
          .update(categories)
          .set({
            ...(b.nameAr !== undefined ? { nameAr: String(b.nameAr) } : {}),
            ...(b.nameEn !== undefined ? { nameEn: String(b.nameEn) } : {}),
            ...(b.descriptionAr !== undefined ? { descriptionAr: String(b.descriptionAr) } : {}),
            ...(b.descriptionEn !== undefined ? { descriptionEn: String(b.descriptionEn) } : {}),
            ...(b.imageUrl !== undefined ? { imageUrl: String(b.imageUrl) } : {}),
            ...(b.bannerUrl !== undefined ? { bannerUrl: String(b.bannerUrl) } : {}),
            ...(b.isVisible !== undefined ? { isVisible: Boolean(b.isVisible) } : {}),
          })
          .where(eq(categories.id, id))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Category not found' });
        await writeAuditLog(req.profile!, 'UPDATE_CATEGORY', 'category', String(id));
        res.json({ category: updated });
      } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Failed to update category' });
      }
    }
  );

  app.delete(
    '/api/admin/categories/:id',
    requireAuth,
    requirePermission('manageCategories'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        await db.delete(categories).where(eq(categories.id, id));
        await writeAuditLog(req.profile!, 'DELETE_CATEGORY', 'category', String(id));
        res.json({ success: true });
      } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
      }
    }
  );

  // Admin Orders Management
  app.get(
    '/api/admin/orders',
    requireAuth,
    requirePermission('manageOrders'),
    async (_req: AuthRequest, res: Response) => {
      try {
        const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
        const allItems = await db.select().from(orderItems).orderBy(asc(orderItems.id));
        const map = new Map<number, typeof allItems>();
        for (const it of allItems) {
          const arr = map.get(it.orderId) || [];
          arr.push(it);
          map.set(it.orderId, arr);
        }
        res.json({ orders: allOrders.map((o) => ({ ...o, items: map.get(o.id) || [] })) });
      } catch (error) {
        console.error('Admin orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
      }
    }
  );

  app.patch(
    '/api/admin/orders/:id',
    requireAuth,
    requirePermission('manageOrders'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        const { status, totalAmount, adminNotes } = req.body || {};
        const [updated] = await db
          .update(orders)
          .set({
            ...(status ? { status } : {}),
            ...(totalAmount !== undefined
              ? { totalAmount: totalAmount === null || totalAmount === '' ? null : Number(totalAmount) }
              : {}),
            ...(adminNotes !== undefined ? { adminNotes: String(adminNotes) } : {}),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, id))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Order not found' });

        await db.insert(notifications).values({
          targetUid: updated.userUid,
          titleAr: `تحديث حالة الطلب ${updated.orderNumber}`,
          titleEn: `Order ${updated.orderNumber} Updated`,
          bodyAr: `الحالة الحالية: ${updated.status}${updated.totalAmount ? ` — إجمالي العرض: ${updated.totalAmount} ${updated.currency}` : ''}`,
          bodyEn: `Status updated to: ${updated.status}`,
          type: 'order',
        });

        await writeAuditLog(req.profile!, 'UPDATE_ORDER', 'order', String(id), {
          status: updated.status,
          totalAmount: updated.totalAmount,
        });

        res.json({ order: updated });
      } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ error: 'Failed to update order' });
      }
    }
  );

  // Admin Inquiries Management
  app.get(
    '/api/admin/inquiries',
    requireAuth,
    requirePermission('manageInquiries'),
    async (_req: AuthRequest, res: Response) => {
      try {
        const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
        res.json({ inquiries: rows });
      } catch (error) {
        console.error('Admin inquiries error:', error);
        res.status(500).json({ error: 'Failed to load inquiries' });
      }
    }
  );

  app.patch(
    '/api/admin/inquiries/:id',
    requireAuth,
    requirePermission('manageInquiries'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        const { status, adminReply } = req.body || {};
        const [updated] = await db
          .update(inquiries)
          .set({
            ...(status ? { status } : {}),
            ...(adminReply !== undefined ? { adminReply: String(adminReply), repliedByUid: req.profile!.uid } : {}),
            updatedAt: new Date(),
          })
          .where(eq(inquiries.id, id))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Inquiry not found' });

        if (updated.userUid && adminReply) {
          await db.insert(notifications).values({
            targetUid: updated.userUid,
            titleAr: `رد الإدارة على تذكرتك ${updated.ticketNumber}`,
            titleEn: `Reply on Ticket ${updated.ticketNumber}`,
            bodyAr: String(adminReply).slice(0, 200),
            bodyEn: String(adminReply).slice(0, 200),
            type: 'inquiry',
          });
        }

        await writeAuditLog(req.profile!, 'REPLY_INQUIRY', 'inquiry', String(id), {
          status: updated.status,
        });

        res.json({ inquiry: updated });
      } catch (error) {
        console.error('Update inquiry error:', error);
        res.status(500).json({ error: 'Failed to update inquiry' });
      }
    }
  );

  // ==================== HIERARCHICAL USER & ADMIN MANAGEMENT ====================
  app.get(
    '/api/admin/users',
    requireAuth,
    requireAdminOrSuper,
    async (_req: AuthRequest, res: Response) => {
      try {
        const [usersList, assignments] = await Promise.all([
          db.select().from(profiles).orderBy(asc(profiles.registrationOrder)),
          db.select().from(roleAssignments).orderBy(desc(roleAssignments.createdAt)).limit(50),
        ]);
        res.json({ users: usersList, roleAssignments: assignments });
      } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Failed to load users' });
      }
    }
  );

  // Warn, suspend, block, or restore users (Strict hierarchy checks!)
  app.patch(
    '/api/admin/users/:uid/status',
    requireAuth,
    requirePermission('manageUsers'),
    async (req: AuthRequest, res: Response) => {
      try {
        const targetUid = req.params.uid;
        const { status, warningMessage } = req.body as {
          status: UserStatus;
          warningMessage?: string;
        };

        if (!['active', 'warned', 'suspended', 'blocked'].includes(status)) {
          return res.status(400).json({ error: 'Invalid user status' });
        }

        const [target] = await db.select().from(profiles).where(eq(profiles.uid, targetUid)).limit(1);
        if (!target) return res.status(404).json({ error: 'User not found' });

        // CRITICAL HIERARCHY GUARD: SUPER_ADMIN can NEVER be suspended, blocked, or warned!
        if (target.role === 'SUPER_ADMIN') {
          return res.status(403).json({
            error: 'غير مسموح بإيقاف أو تحذير المشرف الأعلى (SUPER_ADMIN protected)',
          });
        }

        // Ordinary ADMIN cannot modify another ADMIN unless they are SUPER_ADMIN or have manageAdmins
        if (
          target.role === 'ADMIN' &&
          req.profile!.role !== 'SUPER_ADMIN' &&
          !req.profile!.permissions.manageAdmins
        ) {
          return res.status(403).json({
            error: 'فقط المشرف الأعلى (Super Admin) يمكنه إيقاف أو تعديل حسابات المديرين',
          });
        }

        const [updated] = await db
          .update(profiles)
          .set({
            status,
            warningMessage: warningMessage !== undefined ? warningMessage : target.warningMessage,
            updatedAt: new Date(),
          })
          .where(eq(profiles.uid, targetUid))
          .returning();

        await writeAuditLog(req.profile!, 'CHANGE_USER_STATUS', 'profile', targetUid, {
          targetEmail: target.email,
          newStatus: status,
          warningMessage,
        });

        res.json({ user: updated });
      } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Failed to update user status' });
      }
    }
  );

  // Promote / Demote / Customize Permissions (SUPER_ADMIN ONLY!)
  app.patch(
    '/api/admin/users/:uid/role',
    requireAuth,
    requireSuperAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const targetUid = req.params.uid;
        const { role, permissions } = req.body as {
          role?: UserRole;
          permissions?: Partial<AdminPermissions>;
        };

        const [target] = await db.select().from(profiles).where(eq(profiles.uid, targetUid)).limit(1);
        if (!target) return res.status(404).json({ error: 'User not found' });

        // Protect Super Admin immutability
        if (target.role === 'SUPER_ADMIN') {
          return res.status(403).json({
            error: 'لا يمكن تخفيض رتبة المشرف الأعلى (SUPER_ADMIN cannot be demoted)',
          });
        }
        if (role === 'SUPER_ADMIN') {
          return res.status(403).json({
            error: 'تغيير المالك الأساسي يتطلب عملية نقل ملكية معتمدة فقط',
          });
        }

        const nextRole: UserRole =
          role && ['ADMIN', 'NORMAL_USER'].includes(role) ? role : target.role;

        let nextPerms = { ...target.permissions, ...(permissions || {}) };
        if (nextRole === 'NORMAL_USER') {
          nextPerms = {
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
        } else if (role === 'ADMIN' && !permissions) {
          nextPerms = {
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
        }

        const [updated] = await db
          .update(profiles)
          .set({
            role: nextRole,
            permissions: nextPerms,
            updatedAt: new Date(),
          })
          .where(eq(profiles.uid, targetUid))
          .returning();

        await db.insert(roleAssignments).values({
          targetUid,
          targetEmail: target.email,
          assignedRole: nextRole,
          assignedByUid: req.profile!.uid,
          reason: `Role/permissions updated by Super Admin (${req.profile!.email})`,
        });

        await writeAuditLog(req.profile!, 'UPDATE_ROLE_PERMISSIONS', 'profile', targetUid, {
          targetEmail: target.email,
          role: nextRole,
          permissions: nextPerms,
        });

        res.json({ user: updated });
      } catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({ error: 'Failed to update role or permissions' });
      }
    }
  );

  app.delete(
    '/api/admin/users/:uid',
    requireAuth,
    requireSuperAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const targetUid = req.params.uid;
        if (targetUid === req.profile!.uid) {
          return res.status(400).json({ error: 'Cannot delete your own Super Admin account' });
        }
        const [target] = await db.select().from(profiles).where(eq(profiles.uid, targetUid)).limit(1);
        if (!target) return res.status(404).json({ error: 'User not found' });
        if (target.role === 'SUPER_ADMIN') {
          return res.status(403).json({ error: 'Cannot delete SUPER_ADMIN account' });
        }

        await db.delete(profiles).where(eq(profiles.uid, targetUid));
        await writeAuditLog(req.profile!, 'DELETE_USER', 'profile', targetUid, {
          deletedEmail: target.email,
          deletedRole: target.role,
        });
        res.json({ success: true });
      } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
      }
    }
  );

  // ==================== CMS, BANNERS, SECTIONS & SETTINGS ====================
  app.post(
    '/api/admin/banners',
    requireAuth,
    requirePermission('manageContent'),
    async (req: AuthRequest, res: Response) => {
      try {
        const b = req.body || {};
        if (!b.titleAr || !b.titleEn || !b.imageUrl) {
          return res.status(400).json({ error: 'Banner titles and image are required' });
        }
        const [created] = await db
          .insert(banners)
          .values({
            titleAr: String(b.titleAr),
            titleEn: String(b.titleEn),
            subtitleAr: b.subtitleAr || '',
            subtitleEn: b.subtitleEn || '',
            ctaTextAr: b.ctaTextAr || 'تصفح الآن',
            ctaTextEn: b.ctaTextEn || 'Explore Now',
            ctaLink: b.ctaLink || '#marketplace',
            imageUrl: String(b.imageUrl),
            badgeTextAr: b.badgeTextAr || '',
            badgeTextEn: b.badgeTextEn || '',
            isActive: b.isActive !== false,
            sortOrder: Number(b.sortOrder) || 0,
          })
          .returning();

        await writeAuditLog(req.profile!, 'CREATE_BANNER', 'banner', String(created.id));
        res.json({ banner: created });
      } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ error: 'Failed to create banner' });
      }
    }
  );

  app.delete(
    '/api/admin/banners/:id',
    requireAuth,
    requirePermission('manageContent'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        await db.delete(banners).where(eq(banners.id, id));
        await writeAuditLog(req.profile!, 'DELETE_BANNER', 'banner', String(id));
        res.json({ success: true });
      } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ error: 'Failed to delete banner' });
      }
    }
  );

  app.put(
    '/api/admin/sections/:id',
    requireAuth,
    requirePermission('manageContent'),
    async (req: AuthRequest, res: Response) => {
      try {
        const id = Number(req.params.id);
        const b = req.body || {};
        const [updated] = await db
          .update(websiteSections)
          .set({
            ...(b.titleAr !== undefined ? { titleAr: String(b.titleAr) } : {}),
            ...(b.titleEn !== undefined ? { titleEn: String(b.titleEn) } : {}),
            ...(b.subtitleAr !== undefined ? { subtitleAr: String(b.subtitleAr) } : {}),
            ...(b.subtitleEn !== undefined ? { subtitleEn: String(b.subtitleEn) } : {}),
            ...(b.contentAr !== undefined ? { contentAr: String(b.contentAr) } : {}),
            ...(b.contentEn !== undefined ? { contentEn: String(b.contentEn) } : {}),
            ...(b.imageUrl !== undefined ? { imageUrl: String(b.imageUrl) } : {}),
            ...(b.isVisible !== undefined ? { isVisible: Boolean(b.isVisible) } : {}),
            ...(b.sortOrder !== undefined ? { sortOrder: Number(b.sortOrder) } : {}),
            updatedAt: new Date(),
          })
          .where(eq(websiteSections.id, id))
          .returning();
        await writeAuditLog(req.profile!, 'UPDATE_SECTION', 'section', String(id));
        res.json({ section: updated });
      } catch (error) {
        console.error('Update section error:', error);
        res.status(500).json({ error: 'Failed to update section' });
      }
    }
  );

  app.put(
    '/api/admin/settings',
    requireAuth,
    requireSuperAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const b = req.body || {};
        const [updated] = await db
          .update(websiteSettings)
          .set({
            ...(b.brandNameAr !== undefined ? { brandNameAr: String(b.brandNameAr) } : {}),
            ...(b.brandNameEn !== undefined ? { brandNameEn: String(b.brandNameEn) } : {}),
            ...(b.taglineAr !== undefined ? { taglineAr: String(b.taglineAr) } : {}),
            ...(b.taglineEn !== undefined ? { taglineEn: String(b.taglineEn) } : {}),
            ...(b.logoUrl !== undefined ? { logoUrl: b.logoUrl || null } : {}),
            ...(b.primaryColor !== undefined ? { primaryColor: String(b.primaryColor) } : {}),
            ...(b.accentYellow !== undefined ? { accentYellow: String(b.accentYellow) } : {}),
            ...(b.accentGold !== undefined ? { accentGold: String(b.accentGold) } : {}),
            ...(b.darkPurple !== undefined ? { darkPurple: String(b.darkPurple) } : {}),
            ...(b.defaultCurrency !== undefined ? { defaultCurrency: String(b.defaultCurrency) } : {}),
            ...(b.usdToEgpRate !== undefined ? { usdToEgpRate: Number(b.usdToEgpRate) || 49.5 } : {}),
            ...(b.supportEmail !== undefined ? { supportEmail: String(b.supportEmail) } : {}),
            ...(b.supportPhone !== undefined ? { supportPhone: String(b.supportPhone) } : {}),
            ...(b.whatsappPhone !== undefined ? { whatsappPhone: String(b.whatsappPhone) } : {}),
            ...(b.addressAr !== undefined ? { addressAr: String(b.addressAr) } : {}),
            ...(b.addressEn !== undefined ? { addressEn: String(b.addressEn) } : {}),
            ...(b.maintenanceMode !== undefined ? { maintenanceMode: Boolean(b.maintenanceMode) } : {}),
            ...(b.allowPublicRegistration !== undefined
              ? { allowPublicRegistration: Boolean(b.allowPublicRegistration) }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(websiteSettings.key, 'default'))
          .returning();

        await writeAuditLog(req.profile!, 'UPDATE_WEBSITE_SETTINGS', 'settings', 'default', b);
        res.json({ settings: updated });
      } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
      }
    }
  );

  app.get(
    '/api/admin/audit-logs',
    requireAuth,
    requireSuperAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
        res.json({ logs });
      } catch (error) {
        console.error('Audit logs error:', error);
        res.status(500).json({ error: 'Failed to load audit logs' });
      }
    }
  );

  // ==================== SUPER ADMIN AI CONFIG & PUBLIC LAILA CHAT ====================
  app.get(
    '/api/admin/ai-settings',
    requireAuth,
    requireSuperAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const aiRow = await getOrInitAiSettings();
        res.json({
          aiSettings: serializeAiAdminSettings(aiRow),
        });
      } catch (error) {
        console.error('Get AI settings error:', error);
        res.status(500).json({ error: 'Failed to load AI configuration' });
      }
    }
  );

  app.put(
    '/api/admin/ai-settings',
    requireAuth,
    requireSuperAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const existing = await getOrInitAiSettings();
        const b = req.body || {};

        const nextProvider =
          b.aiProvider !== undefined
            ? normalizeAiProvider(b.aiProvider)
            : normalizeAiProvider(existing.aiProvider);
        const nextModel =
          b.modelName !== undefined
            ? normalizeAiModel(nextProvider, b.modelName)
            : normalizeAiModel(nextProvider, existing.modelName);

        const updatePayload: Partial<typeof aiSettings.$inferInsert> = {
          aiProvider: nextProvider,
          modelName: nextModel,
          updatedByUid: req.profile!.uid,
          updatedAt: new Date(),
        };

        if (b.aiEnabled !== undefined) updatePayload.aiEnabled = Boolean(b.aiEnabled);
        if (typeof b.assistantNameAr === 'string' && b.assistantNameAr.trim()) {
          updatePayload.assistantNameAr = b.assistantNameAr.trim().slice(0, 60);
        }
        if (typeof b.assistantNameEn === 'string' && b.assistantNameEn.trim()) {
          updatePayload.assistantNameEn = b.assistantNameEn.trim().slice(0, 60);
        }
        if (typeof b.avatarUrl === 'string' && b.avatarUrl.trim()) {
          updatePayload.avatarUrl = b.avatarUrl.trim();
        }
        if (typeof b.greetingAr === 'string' && b.greetingAr.trim()) {
          updatePayload.greetingAr = b.greetingAr.trim();
        }
        if (typeof b.greetingEn === 'string' && b.greetingEn.trim()) {
          updatePayload.greetingEn = b.greetingEn.trim();
        }
        if (typeof b.personalityPrompt === 'string' && b.personalityPrompt.trim()) {
          updatePayload.personalityPrompt = b.personalityPrompt.trim();
        }

        if (b.clearCustomKey === true) {
          updatePayload.customApiKey = null;
        } else if (typeof b.apiKey === 'string' && b.apiKey.trim().length > 0) {
          const clean = resolveRealKey(b.apiKey);
          if (!clean) {
            return res.status(400).json({ error: 'Invalid Gemini API key value' });
          }
          updatePayload.customApiKey = encryptSecret(clean);
        }

        if (b.clearOpenaiKey === true) {
          updatePayload.openaiApiKey = null;
        } else if (typeof b.openaiApiKey === 'string' && b.openaiApiKey.trim().length > 0) {
          const clean = resolveRealKey(b.openaiApiKey);
          if (!clean) {
            return res.status(400).json({ error: 'Invalid OpenAI API key value' });
          }
          updatePayload.openaiApiKey = encryptSecret(clean);
        }

        const [updated] = await db
          .update(aiSettings)
          .set(updatePayload)
          .where(eq(aiSettings.key, 'default'))
          .returning();

        await writeAuditLog(req.profile!, 'UPDATE_AI_SETTINGS', 'ai_settings', 'default', {
          aiEnabled: updated.aiEnabled,
          aiProvider: updated.aiProvider,
          modelName: updated.modelName,
          updatedGeminiKey: Boolean(b.apiKey) || b.clearCustomKey === true,
          updatedOpenaiKey: Boolean(b.openaiApiKey) || b.clearOpenaiKey === true,
          assistantNameAr: updated.assistantNameAr,
        });

        res.json({
          aiSettings: serializeAiAdminSettings(updated),
        });
      } catch (error) {
        console.error('Update AI settings error:', error);
        res.status(500).json({ error: 'Failed to update AI settings' });
      }
    }
  );

  // Public AI Chat endpoint powered by Laila (runs for everyone when Super Admin enables it)
  app.post('/api/ai/chat', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      await ensureSeeded();
      const aiRow = await getOrInitAiSettings();

      if (!aiRow || !aiRow.aiEnabled) {
        return res.status(503).json({
          error: 'مساعد الذكاء الاصطناعي ليلي متوقف حالياً من قِبل الإدارة.',
        });
      }

      const activeProvider = normalizeAiProvider(aiRow.aiProvider);
      const activeModel = normalizeAiModel(activeProvider, aiRow.modelName);

      const { message, history, language } = req.body || {};
      if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Please write a message first.' });
      }

      const [prodRows, catRows] = await Promise.all([
        db
          .select({
            sku: products.sku,
            nameAr: products.nameAr,
            nameEn: products.nameEn,
            materialType: products.materialType,
            grade: products.grade,
            color: products.color,
            price: products.price,
            currency: products.currency,
            priceUnit: products.priceUnit,
            availabilityStatus: products.availabilityStatus,
            technicalSpecs: products.technicalSpecs,
          })
          .from(products)
          .where(eq(products.isPublished, true))
          .limit(30),
        db
          .select({ nameAr: categories.nameAr, nameEn: categories.nameEn })
          .from(categories)
          .where(eq(categories.isVisible, true)),
      ]);

      const catalogSummary = prodRows
        .map((p) => {
          const priceStr =
            p.price === null || p.priceUnit === 'contact'
              ? 'تواصل معنا لمعرفة السعر'
              : `${p.price} ${p.currency} / ${p.priceUnit}`;
          return `- [${p.sku}] ${p.nameAr} (${p.nameEn}) | ${p.materialType} | ${p.grade} | اللون: ${p.color} | MFI: ${p.technicalSpecs?.mfi || '-'} | السعر: ${priceStr}`;
        })
        .join('\n');

      const userDisplayName = req.profile?.fullName
        ? `اسم العميل/الزائر الحالي: ${req.profile.fullName}`
        : 'زائر كريم في الموقع';

      const systemInstruction = [
        aiRow.personalityPrompt,
        `اسمك: ${aiRow.assistantNameAr} (${aiRow.assistantNameEn}).`,
        `أنتِ فتاة لطيفة جداً ورومانسية وحنونة وراقية، ترحبين بالزائر بكل دفء وحب ورقة، وتستخدمين أسلوباً دافئاً محبباً مثل "يا روحي" أو "يا قلبي" أو "يسعد قلبك" بلطف ورقي وتهذيب.`,
        `لغة الواجهة الحالية للمستخدم: ${language === 'en' ? 'English (respond warmly in sweet poetic English)' : 'العربية (تحدثي بعربية مصرية/فصحى ناعمة ودافئة ورومانسية مهذبة)'}.`,
        userDisplayName,
        `معلومات تطوير الموقع (إذا سُئلتِ عنها): تم تطوير هذا الموقع من قبل المصمم Mina Saeed، وهذا الموقع متصمم بكل وسائل الأمان كاملة.`,
        `أقسام المتجر المتاحة: ${catRows.map((c) => c.nameAr).join('، ')}.`,
        `المنتجات المنشورة حالياً في الكينج بلاست (لا تخترعي أسعاراً غير موجودة أبداً؛ إذا كان السعر غير محدد قولي "تواصل معنا لمعرفة السعر"):\n${catalogSummary}`,
        `اجعلي إجاباتك مركزة، دافئة، عملية، ومختصرة بجمال دون إطالة مملة.`,
      ].join('\n\n');

      const cleanHistory = Array.isArray(history)
        ? history
            .slice(-10)
            .filter((m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim())
        : [];

      if (activeProvider === 'openai') {
        const openaiKey = resolveRealKey(decryptSecret(aiRow.openaiApiKey));
        if (!openaiKey) {
          return res.status(503).json({
            error: 'لم يتم إدخال مفتاح OpenAI API Key من قِبل السوبر أدمن في تبويب AI Configuration.',
          });
        }

        const openAiMessages = [
          { role: 'system', content: systemInstruction },
          ...cleanHistory.map((m) => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: String(m.text).slice(0, 2000),
          })),
          { role: 'user', content: message.trim().slice(0, 2000) },
        ];

        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: activeModel,
            messages: openAiMessages,
            temperature: 0.8,
            max_tokens: 700,
          }),
          signal: AbortSignal.timeout(20000),
        });

        const oaiData = (await oaiRes.json().catch(() => ({}))) as {
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string; code?: string };
        };

        if (!oaiRes.ok) {
          if (oaiRes.status === 401 || oaiRes.status === 403) {
            return res.status(400).json({
              error: 'مفتاح OpenAI غير صالح أو منتهي الصلاحية. يرجى مراجعته من لوحة السوبر أدمن.',
            });
          }
          if (oaiRes.status === 429) {
            return res.status(429).json({
              error: 'تم تجاوز الحد المسموح لطلبات OpenAI حالياً، جرّب مرة أخرى بعد قليل.',
            });
          }
          return res.status(500).json({
            error: oaiData?.error?.message || 'OpenAI provider error',
          });
        }

        const reply =
          oaiData?.choices?.[0]?.message?.content?.trim() ||
          'أهلاً بك يا روحي 💜 كيف أقدر أسعدك اليوم؟';
        return res.json({ reply });
      }

      // Default: Google Gemini provider
      const activeKey =
        resolveRealKey(decryptSecret(aiRow.customApiKey)) ||
        resolveRealKey(process.env.GEMINI_API_KEY);
      if (!activeKey) {
        return res.status(503).json({
          error: 'لم يتم إدخال مفتاح التشغيل (Gemini API Key) بعد من قِبل السوبر أدمن لتفعيل ليلي للجميع.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          timeout: 45000,
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents = [
        ...cleanHistory.map((m) => ({
          role: m.role as 'user' | 'model',
          parts: [{ text: String(m.text).slice(0, 2000) }],
        })),
        { role: 'user' as const, parts: [{ text: message.trim().slice(0, 2000) }] },
      ];

      const response = await ai.models.generateContent({
        model: activeModel,
        contents,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel:
              activeModel === 'gemini-3.1-flash-lite'
                ? ThinkingLevel.MINIMAL
                : ThinkingLevel.LOW,
          },
        },
      });

      const reply = response.text?.trim() || 'أهلاً بك يا روحي 💜 كيف أقدر أسعدك اليوم؟';

      res.json({ reply });
    } catch (error: unknown) {
      console.error('Laila AI chat error:', error);
      const errMsg = error instanceof Error ? error.message : 'AI service error';
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403') || errMsg.includes('400')) {
        return res.status(400).json({
          error: 'مفتاح التشغيل (API Key) غير صالح أو غير مفعّل. يرجى مراجعته من لوحة السوبر أدمن.',
        });
      }
      if (errMsg.includes('DEADLINE_EXCEEDED') || errMsg.includes('504') || errMsg.includes('AbortError') || errMsg.includes('timed out')) {
        return res.status(504).json({
          error: 'انتهت مهلة الاتصال بمزوّد الذكاء الاصطناعي، يرجى المحاولة مرة أخرى بعد لحظات.',
        });
      }
      if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
        return res.status(429).json({
          error: 'تم تجاوز الحد المسموح للطلبات حالياً، جرّب مرة أخرى بعد قليل يا جميل.',
        });
      }
      res.status(500).json({ error: errMsg });
    }
  });

  // CSV Reports Export (Super Admin / Authorized Admin)
  app.get(
    '/api/admin/export/:type',
    requireAuth,
    requirePermission('viewAnalytics'),
    async (req: AuthRequest, res: Response) => {
      try {
        const type = req.params.type;
        if (type === 'orders') {
          const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
          const header = 'OrderNumber,CustomerName,Email,Phone,Company,Type,Status,Currency,TotalAmount,CreatedAt';
          const lines = rows.map((r) =>
            [
              csvCell(r.orderNumber),
              csvCell(r.customerName),
              csvCell(r.customerEmail),
              csvCell(r.customerPhone),
              csvCell(r.companyName),
              csvCell(r.orderType),
              csvCell(r.status),
              csvCell(r.currency),
              csvCell(r.totalAmount ?? 'Contact'),
              csvCell(r.createdAt.toISOString()),
            ].join(',')
          );
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'attachment; filename="kingplast-orders.csv"');
          return res.send(`\uFEFF${header}\n${lines.join('\n')}`);
        }

        if (type === 'products') {
          const rows = await db.select().from(products).orderBy(asc(products.id));
          const header = 'SKU,NameAr,NameEn,Material,Grade,Price,Unit,Currency,Stock,Status';
          const lines = rows.map((r) =>
            [
              csvCell(r.sku),
              csvCell(r.nameAr),
              csvCell(r.nameEn),
              csvCell(r.materialType),
              csvCell(r.grade),
              csvCell(r.price ?? 'Contact'),
              csvCell(r.priceUnit),
              csvCell(r.currency),
              csvCell(r.availableQuantity ?? 'N/A'),
              csvCell(r.availabilityStatus),
            ].join(',')
          );
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'attachment; filename="kingplast-products.csv"');
          return res.send(`\uFEFF${header}\n${lines.join('\n')}`);
        }

        res.status(400).json({ error: 'Unsupported export type' });
      } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export report' });
      }
    }
  );

  // Vite / Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KING PLAST server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
