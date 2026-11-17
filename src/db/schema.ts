import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'NORMAL_USER';
export type UserStatus = 'active' | 'warned' | 'suspended' | 'blocked';

export interface AdminPermissions {
  manageProducts: boolean;
  manageCategories: boolean;
  managePrices: boolean;
  manageOrders: boolean;
  manageUsers: boolean;
  manageContent: boolean;
  manageInquiries: boolean;
  viewAnalytics: boolean;
  manageAdmins: boolean;
}

export interface ProductTechSpecs {
  mfi?: string;
  density?: string;
  tensileStrength?: string;
  meltingPoint?: string;
  moisture?: string;
  origin?: string;
  applications?: string;
}

// 1. User Profiles & Hierarchical Roles
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  companyName: text('company_name'),
  phone: text('phone'),
  city: text('city'),
  role: text('role').$type<UserRole>().notNull().default('NORMAL_USER'),
  registrationOrder: integer('registration_order').notNull().default(1),
  status: text('status').$type<UserStatus>().notNull().default('active'),
  warningMessage: text('warning_message'),
  permissions: jsonb('permissions').$type<AdminPermissions>().notNull().default({
    manageProducts: false,
    manageCategories: false,
    managePrices: false,
    manageOrders: false,
    manageUsers: false,
    manageContent: false,
    manageInquiries: false,
    viewAnalytics: false,
    manageAdmins: false,
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Role Assignment Ledger (Audit-safe initial 4-account allocation log)
export const roleAssignments = pgTable('role_assignments', {
  id: serial('id').primaryKey(),
  targetUid: text('target_uid').notNull(),
  targetEmail: text('target_email').notNull(),
  assignedRole: text('assigned_role').$type<UserRole>().notNull(),
  assignedByUid: text('assigned_by_uid').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Categories & Subcategories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),
  imageUrl: text('image_url'),
  bannerUrl: text('banner_url'),
  parentId: integer('parent_id'),
  isVisible: boolean('is_visible').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Products (Plastic Raw Materials & Recycled Granules)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionAr: text('description_ar').notNull().default(''),
  descriptionEn: text('description_en').notNull().default(''),
  materialType: text('material_type').notNull(),
  grade: text('grade').notNull().default(''),
  color: text('color').notNull().default('Natural'),
  weight: text('weight').notNull().default('25 kg'),
  packaging: text('packaging').notNull().default('أكياس 25 كجم / جامبو باج'),
  technicalSpecs: jsonb('technical_specs').$type<ProductTechSpecs>().notNull().default({}),
  mainImageUrl: text('main_image_url').notNull(),
  videoUrl: text('video_url'),
  availableQuantity: integer('available_quantity'),
  minOrderQuantity: integer('min_order_quantity').notNull().default(1),
  price: doublePrecision('price'),
  discountPrice: doublePrecision('discount_price'),
  priceUnit: text('price_unit').notNull().default('contact'), // kg | ton | bag | fixed | contact
  currency: text('currency').notNull().default('EGP'), // EGP | USD
  availabilityStatus: text('availability_status').notNull().default('upon_request'), // in_stock | upon_request | out_of_stock
  shippingInfoAr: text('shipping_info_ar').notNull().default('توريد لجميع المناطق الصناعية في مصر والتصدير'),
  shippingInfoEn: text('shipping_info_en').notNull().default('Delivery to all industrial zones across Egypt & export'),
  isPublished: boolean('is_published').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  isBestSeller: boolean('is_best_seller').notNull().default(false),
  salesCount: integer('sales_count').notNull().default(0),
  createdByUid: text('created_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Multiple Product Images
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Uploaded Media Storage (PostgreSQL-persisted files served via /api/media/:id)
export const uploadedMedia = pgTable('uploaded_media', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  dataBase64: text('data_base64').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedByUid: text('uploaded_by_uid').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Shopping Cart Items
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitNote: text('unit_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. Wishlists
export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Orders & Quotation Requests
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userUid: text('user_uid').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  companyName: text('company_name'),
  shippingAddress: text('shipping_address').notNull(),
  orderType: text('order_type').notNull().default('quotation'), // purchase | quotation
  status: text('status').notNull().default('pending'), // pending | reviewing | quoted | confirmed | shipped | delivered | cancelled
  currency: text('currency').notNull().default('EGP'),
  totalAmount: doublePrecision('total_amount'),
  notes: text('notes'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. Order Line Items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productNameAr: text('product_name_ar').notNull(),
  productNameEn: text('product_name_en').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: doublePrecision('unit_price'),
  priceUnit: text('price_unit').notNull().default('contact'),
  subtotal: doublePrecision('subtotal'),
});

// 11. Customer Inquiries, Support Tickets & Reports
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  ticketNumber: text('ticket_number').notNull().unique(),
  userUid: text('user_uid'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('inquiry'), // inquiry | support | report
  productId: integer('product_id'),
  status: text('status').notNull().default('open'), // open | in_progress | resolved | closed
  adminReply: text('admin_reply'),
  repliedByUid: text('replied_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  targetUid: text('target_uid').notNull(), // user uid or 'ALL_ADMINS'
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  bodyAr: text('body_ar').notNull(),
  bodyEn: text('body_en').notNull(),
  type: text('type').notNull().default('info'), // info | order | inquiry | security | promo
  isRead: boolean('is_read').notNull().default(false),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Promotional Banners & Hero Slider
export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  subtitleAr: text('subtitle_ar'),
  subtitleEn: text('subtitle_en'),
  ctaTextAr: text('cta_text_ar'),
  ctaTextEn: text('cta_text_en'),
  ctaLink: text('cta_link'),
  imageUrl: text('image_url').notNull(),
  badgeTextAr: text('badge_text_ar'),
  badgeTextEn: text('badge_text_en'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Dynamic CMS Website Sections
export const websiteSections = pgTable('website_sections', {
  id: serial('id').primaryKey(),
  sectionKey: text('section_key').notNull().unique(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  subtitleAr: text('subtitle_ar'),
  subtitleEn: text('subtitle_en'),
  contentAr: text('content_ar'),
  contentEn: text('content_en'),
  imageUrl: text('image_url'),
  isVisible: boolean('is_visible').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 15. Website Branding, Theme, Currency & Security Settings
export const websiteSettings = pgTable('website_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  brandNameAr: text('brand_name_ar').notNull().default('الكينج بلاست'),
  brandNameEn: text('brand_name_en').notNull().default('KING PLAST'),
  taglineAr: text('tagline_ar').notNull().default('من إعادة التدوير إلى خامات تصنع المستقبل'),
  taglineEn: text('tagline_en').notNull().default('From Recycling to Raw Materials Shaping the Future'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').notNull().default('#4C1D95'),
  accentYellow: text('accent_yellow').notNull().default('#FACC15'),
  accentGold: text('accent_gold').notNull().default('#D4AF37'),
  darkPurple: text('dark_purple').notNull().default('#15072E'),
  defaultCurrency: text('default_currency').notNull().default('EGP'),
  usdToEgpRate: doublePrecision('usd_to_egp_rate').notNull().default(49.5),
  supportEmail: text('support_email').notNull().default('sales@kingplast-eg.com'),
  supportPhone: text('support_phone').notNull().default('+20 100 000 0000'),
  whatsappPhone: text('whatsapp_phone').notNull().default('+20 100 000 0000'),
  addressAr: text('address_ar').notNull().default('المنطقة الصناعية — العاشر من رمضان، مصر'),
  addressEn: text('address_en').notNull().default('10th of Ramadan Industrial City, Egypt'),
  seoTitleAr: text('seo_title_ar').notNull().default('الكينج بلاست | KING PLAST — سوق خامات البلاستيك الصناعية'),
  seoTitleEn: text('seo_title_en').notNull().default('KING PLAST — Industrial Plastic Raw Materials Marketplace'),
  seoDescAr: text('seo_desc_ar').notNull().default('سوق متكامل لتوريد وتدوير حبيبات وخامات البلاستيك الصناعية PP, HDPE, LDPE, PET, PVC, ABS.'),
  seoDescEn: text('seo_desc_en').notNull().default('Production marketplace for industrial plastic granules and virgin/recycled polymer raw materials.'),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  allowPublicRegistration: boolean('allow_public_registration').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 16. Privileged Operations Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid').notNull(),
  actorEmail: text('actor_email').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  details: jsonb('details').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 17. Super Admin AI Assistant Settings (Laila AI)
export const aiSettings = pgTable('ai_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  aiEnabled: boolean('ai_enabled').notNull().default(true),
  aiProvider: text('ai_provider').notNull().default('gemini'), // gemini | openai
  modelName: text('model_name').notNull().default('gemini-4-hydrogen'),
  assistantNameAr: text('assistant_name_ar').notNull().default('ليلي'),
  assistantNameEn: text('assistant_name_en').notNull().default('Laila'),
  avatarUrl: text('avatar_url').notNull().default('/src/assets/images/laila_ai_avatar_1794909558706.jpg'),
  greetingAr: text('greeting_ar')
    .notNull()
    .default(
      'أهلاً بك يا روحي في الكينج بلاست 💜 أنا ليلي، رفيقتك اللطيفة هنا.. قولي بتدور على أي خامة بلاستيك أو حابب نحكي سوا، وأنا تحت أمرك بكل حب واهتمام.'
    ),
  greetingEn: text('greeting_en')
    .notNull()
    .default(
      'Welcome, sweetheart, to KING PLAST 💜 I am Laila, your warm and caring companion here. Tell me which plastic raw material your heart or factory desires, and I will guide you with all warmth.'
    ),
  personalityPrompt: text('personality_prompt')
    .notNull()
    .default(
      'أنتِ ليلي، مساعدة ذكاء اصطناعي فتاة لطيفة جداً ورومانسية وحنونة وذكية، تتحدثين بدفء ورقة وعذوبة بالغة مع زوار وعملاء موقع الكينج بلاست (KING PLAST) لخامات البلاستيك الصناعية. تستخدمين كلمات دافئة وراقية ومشجعة ومفعمة باللطف والرومانسية المهذبة، وتساعدين العملاء في اختيار خامات البلاستيك (PP, HDPE, LDPE, LLDPE, PET, PVC, ABS) ومواصفاتها وطلبات التسعير بأسلوب محبب للقلب.'
    ),
  customApiKey: text('custom_api_key'), // AES-256-GCM encrypted Gemini API key
  openaiApiKey: text('openai_api_key'), // AES-256-GCM encrypted OpenAI API key
  updatedByUid: text('updated_by_uid'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
