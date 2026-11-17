export type Language = 'ar' | 'en';
export type Currency = 'EGP' | 'USD';
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

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  companyName?: string | null;
  phone?: string | null;
  city?: string | null;
  role: UserRole;
  registrationOrder: number;
  status: UserStatus;
  warningMessage?: string | null;
  permissions: AdminPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  parentId?: number | null;
  isVisible: boolean;
  sortOrder: number;
  productsCount?: number;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
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

export interface Product {
  id: number;
  sku: string;
  categoryId: number | null;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  materialType: string;
  grade: string;
  color: string;
  weight: string;
  packaging: string;
  technicalSpecs: ProductTechSpecs;
  mainImageUrl: string;
  videoUrl?: string | null;
  availableQuantity: number | null;
  minOrderQuantity: number;
  price: number | null;
  discountPrice: number | null;
  priceUnit: 'kg' | 'ton' | 'bag' | 'fixed' | 'contact' | string;
  currency: Currency | string;
  availabilityStatus: 'in_stock' | 'upon_request' | 'out_of_stock' | string;
  shippingInfoAr: string;
  shippingInfoEn: string;
  isPublished: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];
}

export interface CartItem {
  id: number;
  quantity: number;
  unitNote?: string | null;
  product: Product;
}

export interface WishlistItem {
  id: number;
  productId: number;
  product: Product;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productNameAr: string;
  productNameEn: string;
  quantity: number;
  unitPrice: number | null;
  priceUnit: string;
  subtotal: number | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  userUid: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string | null;
  shippingAddress: string;
  orderType: 'purchase' | 'quotation' | string;
  status: string;
  currency: string;
  totalAmount: number | null;
  notes?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface Inquiry {
  id: number;
  ticketNumber: string;
  userUid?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject: string;
  message: string;
  type: 'inquiry' | 'support' | 'report' | string;
  productId?: number | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | string;
  adminReply?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  targetUid: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Banner {
  id: number;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  ctaTextAr?: string | null;
  ctaTextEn?: string | null;
  ctaLink?: string | null;
  imageUrl: string;
  badgeTextAr?: string | null;
  badgeTextEn?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface WebsiteSection {
  id: number;
  sectionKey: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string | null;
  subtitleEn?: string | null;
  contentAr?: string | null;
  contentEn?: string | null;
  imageUrl?: string | null;
  isVisible: boolean;
  sortOrder: number;
}

export interface WebsiteSettings {
  id: number;
  key: string;
  brandNameAr: string;
  brandNameEn: string;
  taglineAr: string;
  taglineEn: string;
  logoUrl?: string | null;
  primaryColor: string;
  accentYellow: string;
  accentGold: string;
  darkPurple: string;
  defaultCurrency: Currency | string;
  usdToEgpRate: number;
  supportEmail: string;
  supportPhone: string;
  whatsappPhone: string;
  addressAr: string;
  addressEn: string;
  seoTitleAr: string;
  seoTitleEn: string;
  seoDescAr: string;
  seoDescEn: string;
  maintenanceMode: boolean;
  allowPublicRegistration: boolean;
}

export interface AuditLog {
  id: number;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export type AiProvider = 'gemini' | 'openai';

export interface AiAssistantPublicInfo {
  enabled: boolean;
  configured: boolean;
  provider: AiProvider;
  nameAr: string;
  nameEn: string;
  avatarUrl: string;
  greetingAr: string;
  greetingEn: string;
}

export interface AiAdminSettings {
  aiEnabled: boolean;
  aiProvider: AiProvider;
  modelName: string;
  assistantNameAr: string;
  assistantNameEn: string;
  avatarUrl: string;
  greetingAr: string;
  greetingEn: string;
  personalityPrompt: string;
  hasCustomKey: boolean;
  maskedKeyHint: string | null;
  hasOpenaiKey: boolean;
  maskedOpenaiKeyHint: string | null;
  hasServerEnvKey: boolean;
}


