export type PolymerType = 'PP' | 'HDPE' | 'LDPE' | 'LLDPE' | 'PVC' | 'PET' | 'ABS' | 'OTHER';

export type StockStatus = 'in_stock' | 'low_stock' | 'on_demand' | 'out_of_stock';

export type QuotationStatus = 'new' | 'under_review' | 'contacted' | 'quoted' | 'completed' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  sku: string;
  categoryId: string;
  polymerType: PolymerType;
  color: string;
  form: string; // حبيبات مخرزة، مجروش ومغسول، كسر، بلور
  mfi?: string; // Melt Flow Index (g/10min)
  density?: string; // Density (g/cm³)
  tensileStrength?: string;
  meshFilter?: string; // فلتر الإكسترودر (Mesh 80, 100, 120)
  moisture?: string; // نسبة الرطوبة القصوى
  packaging?: string; // أكياس منسوجة 25 كجم، جامبو 1 طن
  minOrderQuantity?: string;
  stockStatus: StockStatus;
  price?: string; // فارغ إذا كان "السعر عند الطلب"
  priceUnit?: string; // طن أو كجم
  description: string;
  applications: string; // مجالات التطبيق: حقن، نفخ، سحب خيوط، أكياس، مواسير
  mainImageUrl: string;
  additionalImages?: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  description: string;
  displayOrder: number;
}

export interface QuotationItem {
  productId: string;
  productName: string;
  polymerType: string;
  quantity: number;
  unit: 'ton' | 'kg';
  customColor?: string;
  customSpecs?: string;
  packagingPreference?: string;
  priceEstimated?: string;
}

export interface QuotationRequest {
  id: string;
  referenceNumber: string; // KP-2026-XXXX
  customerName: string;
  companyName?: string;
  phone: string;
  email?: string;
  governorate: string;
  notes?: string;
  status: QuotationStatus;
  items: QuotationItem[];
  quotedPriceTotal?: string;
  quotedNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RecyclingStage {
  id: string;
  title: string;
  description: string;
  order: number;
  imageUrl?: string;
  active: boolean;
}

export interface CompanySettings {
  companyNameAr: string;
  companyNameEn: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  factoryAddress: string;
  workingHours: string;
  taglineAr: string;
  secondaryTaglineAr: string;
  updatedAt?: string;
}

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

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  target?: string;
  details: string;
  timestamp: string;
}

export interface BootstrapState {
  isInitialized: boolean;
  ownerId?: string;
  ownerEmail?: string;
  initializedAt?: string;
}
