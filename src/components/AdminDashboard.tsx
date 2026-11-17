import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Ban,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Layout,
  Package,
  Plus,
  Settings,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ResilientImage } from './ResilientImage';
import type {
  AdminPermissions,
  AiAdminSettings,
  AuditLog,
  Banner,
  Category,
  Inquiry,
  Order,
  Product,
  UserProfile,
  UserRole,
  UserStatus,
  WebsiteSection,
} from '../types/marketplace';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'inquiries'
  | 'users'
  | 'cms'
  | 'ai'
  | 'settings'
  | 'audit';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const {
    isRtl,
    profile,
    apiFetch,
    refreshStorefront,
    categories,
    banners,
    sections,
    settings,
  } = useMarketplace();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<{
    stats: Record<string, number>;
    recentOrders: Order[];
    recentInquiries: Inquiry[];
    recentLogs: AuditLog[];
  } | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Super Admin AI Configuration (Laila) State
  const [aiForm, setAiForm] = useState<
    AiAdminSettings & {
      apiKeyInput: string;
      openaiKeyInput: string;
      showGeminiKey: boolean;
      showOpenaiKey: boolean;
    }
  >({
    aiEnabled: true,
    aiProvider: 'gemini',
    modelName: 'gemini-4-hydrogen',
    assistantNameAr: 'ليلي',
    assistantNameEn: 'Laila',
    avatarUrl: '/src/assets/images/laila_ai_avatar_1794909558706.jpg',
    greetingAr: '',
    greetingEn: '',
    personalityPrompt: '',
    hasCustomKey: false,
    maskedKeyHint: null,
    hasOpenaiKey: false,
    maskedOpenaiKeyHint: null,
    hasServerEnvKey: false,
    apiKeyInput: '',
    openaiKeyInput: '',
    showGeminiKey: false,
    showOpenaiKey: false,
  });
  const [aiTestMsg, setAiTestMsg] = useState('');
  const [aiTestReply, setAiTestReply] = useState<string | null>(null);
  const [aiTesting, setAiTesting] = useState(false);

  // Product Form Modal
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Category Form
  const [catForm, setCatForm] = useState({
    id: 0,
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    imageUrl: '/src/assets/images/pp_pellets_studio_1794908533302.jpg',
    bannerUrl: '/src/assets/images/plastic_pallets_packaging_1794908535344.jpg',
    isVisible: true,
  });

  // Banner Form
  const [bannerForm, setBannerForm] = useState({
    titleAr: '',
    titleEn: '',
    subtitleAr: '',
    subtitleEn: '',
    ctaTextAr: 'تصفح السوق',
    ctaTextEn: 'Browse Now',
    ctaLink: '#marketplace',
    imageUrl: '/src/assets/images/hero_industrial_recycling_1793299426013.jpg',
    badgeTextAr: 'توريد مباشر',
    badgeTextEn: 'Factory Direct',
  });

  // Settings Form (SUPER_ADMIN)
  const [settingsForm, setSettingsForm] = useState({
    brandNameAr: settings?.brandNameAr || 'الكينج بلاست',
    brandNameEn: settings?.brandNameEn || 'KING PLAST',
    taglineAr: settings?.taglineAr || '',
    taglineEn: settings?.taglineEn || '',
    logoUrl: settings?.logoUrl || '',
    primaryColor: settings?.primaryColor || '#4C1D95',
    accentYellow: settings?.accentYellow || '#FACC15',
    accentGold: settings?.accentGold || '#D4AF37',
    darkPurple: settings?.darkPurple || '#15072E',
    defaultCurrency: settings?.defaultCurrency || 'EGP',
    usdToEgpRate: settings?.usdToEgpRate || 49.5,
    supportEmail: settings?.supportEmail || '',
    supportPhone: settings?.supportPhone || '',
    addressAr: settings?.addressAr || '',
    addressEn: settings?.addressEn || '',
    maintenanceMode: settings?.maintenanceMode || false,
    allowPublicRegistration: settings?.allowPublicRegistration ?? true,
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        brandNameAr: settings.brandNameAr,
        brandNameEn: settings.brandNameEn,
        taglineAr: settings.taglineAr,
        taglineEn: settings.taglineEn,
        logoUrl: settings.logoUrl || '',
        primaryColor: settings.primaryColor,
        accentYellow: settings.accentYellow,
        accentGold: settings.accentGold,
        darkPurple: settings.darkPurple,
        defaultCurrency: settings.defaultCurrency,
        usdToEgpRate: settings.usdToEgpRate,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        addressAr: settings.addressAr,
        addressEn: settings.addressEn,
        maintenanceMode: settings.maintenanceMode,
        allowPublicRegistration: settings.allowPublicRegistration,
      });
    }
  }, [settings]);

  const notify = (msg: string) => {
    setFeedback(msg);
    setErrorMsg(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';
  const perms = profile?.permissions;
  const can = (p: keyof AdminPermissions) => isSuperAdmin || Boolean(perms?.[p]);

  const loadTabData = useCallback(async () => {
    if (!isOpen || !profile) return;
    setLoading(true);
    try {
      if (tab === 'overview') {
        const d = await apiFetch('/api/admin/overview');
        setOverview(d);
      } else if (tab === 'products') {
        const d = await apiFetch<{ products: Product[] }>('/api/products?includeUnpublished=true');
        setAllProducts(d.products || []);
      } else if (tab === 'categories') {
        const d = await apiFetch<{ categories: Category[] }>('/api/admin/categories');
        setAllCategories(d.categories || []);
      } else if (tab === 'orders' && can('manageOrders')) {
        const d = await apiFetch<{ orders: Order[] }>('/api/admin/orders');
        setAllOrders(d.orders || []);
      } else if (tab === 'inquiries' && can('manageInquiries')) {
        const d = await apiFetch<{ inquiries: Inquiry[] }>('/api/admin/inquiries');
        setAllInquiries(d.inquiries || []);
      } else if (tab === 'users') {
        const d = await apiFetch<{ users: UserProfile[] }>('/api/admin/users');
        setAllUsers(d.users || []);
      } else if (tab === 'ai' && isSuperAdmin) {
        const d = await apiFetch<{ aiSettings: AiAdminSettings }>('/api/admin/ai-settings');
        if (d.aiSettings) {
          setAiForm({
            ...d.aiSettings,
            apiKeyInput: '',
            openaiKeyInput: '',
            showGeminiKey: false,
            showOpenaiKey: false,
          });
        }
      } else if (tab === 'audit' && isSuperAdmin) {
        const d = await apiFetch<{ logs: AuditLog[] }>('/api/admin/audit-logs');
        setAuditLogs(d.logs || []);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [isOpen, profile, tab, apiFetch]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  if (!isOpen || !profile || (profile.role !== 'SUPER_ADMIN' && profile.role !== 'ADMIN')) {
    return null;
  }

  // Real File Upload Handler (Phone/Computer -> PostgreSQL -> /api/media/:id)
  const uploadDeviceFile = async (file: File): Promise<string | null> => {
    setUploadingImg(true);
    setErrorMsg(null);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiFetch<{ url: string }>('/api/media/upload', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          base64Data,
        }),
      });
      return res.url;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Image upload failed');
      return null;
    } finally {
      setUploadingImg(false);
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const payload = { ...editingProduct, additionalImages: extraImages };
      if (editingProduct.id) {
        await apiFetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        notify(isRtl ? 'تم تحديث بيانات الخامة بنجاح' : 'Product updated');
      } else {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        notify(isRtl ? 'تمت إضافة الخامة إلى قاعدة البيانات' : 'Product created');
      }
      setEditingProduct(null);
      await loadTabData();
      await refreshStorefront();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (catForm.id > 0) {
        await apiFetch(`/api/admin/categories/${catForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(catForm),
        });
        notify(isRtl ? 'تم تحديث التصنيف' : 'Category updated');
      } else {
        await apiFetch('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(catForm),
        });
        notify(isRtl ? 'تمت إضافة التصنيف الجديد' : 'Category added');
      }
      setCatForm({
        id: 0,
        nameAr: '',
        nameEn: '',
        descriptionAr: '',
        descriptionEn: '',
        imageUrl: '/src/assets/images/pp_pellets_studio_1794908533302.jpg',
        bannerUrl: '/src/assets/images/plastic_pallets_packaging_1794908535344.jpg',
        isVisible: true,
      });
      await loadTabData();
      await refreshStorefront();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Category save error');
    }
  };

  // Update User Status
  const handleUserStatus = async (uid: string, status: UserStatus) => {
    let warningMessage: string | undefined;
    if (status === 'warned') {
      warningMessage = window.prompt(isRtl ? 'اكتب نص التحذير للعميل:' : 'Enter warning message:') || '';
    }
    try {
      await apiFetch(`/api/admin/users/${uid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, warningMessage }),
      });
      notify(isRtl ? 'تم تحديث حالة الحساب' : 'Account status updated');
      await loadTabData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  // Super Admin: Role & Granular Permissions
  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await apiFetch(`/api/admin/users/${uid}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      notify(isRtl ? 'تم تحديث رتبة الحساب بنجاح' : 'Role updated');
      await loadTabData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Role update failed');
    }
  };

  const handleTogglePerm = async (u: UserProfile, key: keyof AdminPermissions) => {
    try {
      await apiFetch(`/api/admin/users/${u.uid}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          permissions: { ...u.permissions, [key]: !u.permissions[key] },
        }),
      });
      await loadTabData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Permission update failed');
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (!window.confirm(isRtl ? `تأكيد حذف الحساب ${email} نهائياً؟` : `Permanently delete ${email}?`)) {
      return;
    }
    try {
      await apiFetch(`/api/admin/users/${uid}`, { method: 'DELETE' });
      notify(isRtl ? 'تم حذف الحساب' : 'User deleted');
      await loadTabData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleExportCsv = async (type: 'orders' | 'products') => {
    try {
      const token = await (await import('../firebase')).auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kingplast-${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Export failed');
    }
  };

  const tabs: Array<{ id: AdminTab; labelAr: string; labelEn: string; icon: React.ReactNode; show: boolean }> = [
    { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: <Activity className="w-4 h-4" />, show: true },
    { id: 'products', labelAr: 'المنتجات والأسعار', labelEn: 'Products', icon: <Package className="w-4 h-4" />, show: can('manageProducts') },
    { id: 'categories', labelAr: 'التصنيفات', labelEn: 'Categories', icon: <Layers className="w-4 h-4" />, show: can('manageCategories') },
    { id: 'orders', labelAr: 'الطلبات وعروض الأسعار', labelEn: 'Orders', icon: <ShoppingBag className="w-4 h-4" />, show: can('manageOrders') },
    { id: 'inquiries', labelAr: 'الاستفسارات والدعم', labelEn: 'Inquiries', icon: <FileText className="w-4 h-4" />, show: can('manageInquiries') },
    { id: 'users', labelAr: 'المستخدمون والمديرون', labelEn: 'Users & Admins', icon: <Users className="w-4 h-4" />, show: can('manageUsers') || isSuperAdmin },
    { id: 'cms', labelAr: 'البنرات والمحتوى', labelEn: 'Banners & CMS', icon: <Layout className="w-4 h-4" />, show: can('manageContent') },
    { id: 'ai', labelAr: 'إعدادات الذكاء الاصطناعي', labelEn: 'AI Configuration', icon: <Sparkles className="w-4 h-4" />, show: isSuperAdmin },
    { id: 'settings', labelAr: 'إعدادات الهوية والأمان', labelEn: 'Branding & Security', icon: <Settings className="w-4 h-4" />, show: isSuperAdmin },
    { id: 'audit', labelAr: 'سجلات الأمان', labelEn: 'Audit Logs', icon: <ShieldAlert className="w-4 h-4" />, show: isSuperAdmin },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8FF] text-[#15072E] overflow-y-auto">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-[#15072E] text-white border-b border-[#D4AF37]/40 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FACC15] text-[#15072E] flex items-center justify-center font-black">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold">
              {isRtl ? 'مركز إدارة KING PLAST' : 'KING PLAST Control Center'}
            </h2>
            <p className="text-[11px] text-[#FACC15] font-mono-tech">
              {profile.role} · {profile.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2B0F54] hover:bg-[#4C1D95] border border-[#D4AF37]/30 text-xs font-bold text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>{isRtl ? 'العودة للمتجر' : 'Back to Marketplace'}</span>
        </button>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation (240-260px style) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-purple-100 p-3 space-y-1 shadow-sm">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  tab === t.id
                    ? 'bg-[#4C1D95] text-white shadow-sm'
                    : 'text-[#2B0F54] hover:bg-purple-50'
                }`}
              >
                <span className={tab === t.id ? 'text-[#FACC15]' : 'text-[#4C1D95]'}>{t.icon}</span>
                <span>{isRtl ? t.labelAr : t.labelEn}</span>
              </button>
            ))}
        </aside>

        {/* Main Workspace */}
        <main className="lg:col-span-9 space-y-6">
          {feedback && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && overview && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-[#15072E]">
                  {isRtl ? 'إحصائيات المنصة الحقيقية' : 'Live Business Overview'}
                </h3>
                {can('viewAnalytics') && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportCsv('orders')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-purple-200 hover:border-[#4C1D95] text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#4C1D95]" />
                      <span>{isRtl ? 'تصدير الطلبات CSV' : 'Export Orders CSV'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportCsv('products')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-purple-200 hover:border-[#4C1D95] text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#4C1D95]" />
                      <span>{isRtl ? 'تصدير المنتجات CSV' : 'Export Products CSV'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: isRtl ? 'إجمالي المستخدمين' : 'Total Users', val: overview.stats.totalUsers },
                  { label: isRtl ? 'المنتجات المسجلة' : 'Total Products', val: overview.stats.totalProducts },
                  { label: isRtl ? 'التصنيفات' : 'Categories', val: overview.stats.totalCategories },
                  { label: isRtl ? 'الطلبات' : 'Total Orders', val: overview.stats.totalOrders },
                  { label: isRtl ? 'تذاكر مفتوحة' : 'Open Inquiries', val: overview.stats.openInquiries },
                ].map((kpi) => (
                  <div key={kpi.label} className="p-4 rounded-xl bg-white border border-purple-100 shadow-sm">
                    <p className="text-xs text-purple-700 font-semibold">{kpi.label}</p>
                    <p className="text-2xl font-black font-mono-tech tabular-nums text-[#15072E] mt-1">
                      {kpi.val}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-purple-100 p-5">
                  <h4 className="text-sm font-extrabold mb-3">
                    {isRtl ? 'أحدث الطلبات وعروض الأسعار' : 'Recent Orders & Quotes'}
                  </h4>
                  {overview.recentOrders.length === 0 ? (
                    <p className="text-xs text-purple-600">{isRtl ? 'لا توجد طلبات بعد' : 'No orders yet'}</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {overview.recentOrders.map((o) => (
                        <div key={o.id} className="p-2.5 rounded-lg bg-[#FAF8FF] flex justify-between">
                          <span className="font-bold">{o.orderNumber} · {o.customerName}</span>
                          <span className="font-mono-tech text-[#4C1D95]">{o.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-purple-100 p-5">
                  <h4 className="text-sm font-extrabold mb-3">
                    {isRtl ? 'أحدث تذاكر الدعم والاستفسارات' : 'Recent Customer Inquiries'}
                  </h4>
                  {overview.recentInquiries.length === 0 ? (
                    <p className="text-xs text-purple-600">{isRtl ? 'لا توجد رسائل بعد' : 'No inquiries yet'}</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {overview.recentInquiries.map((i) => (
                        <div key={i.id} className="p-2.5 rounded-lg bg-[#FAF8FF] flex justify-between">
                          <span className="font-bold truncate max-w-[220px]">{i.name} · {i.subject}</span>
                          <span className="font-mono-tech text-[#4C1D95]">{i.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CRUD + IMAGE UPLOAD + REAL PRICING */}
          {tab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-[#15072E]">
                  {isRtl ? 'إدارة كتالوج الخامات والأسعار' : 'Products & Pricing Management'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setExtraImages([]);
                    setEditingProduct({
                      nameAr: '',
                      nameEn: '',
                      materialType: 'PP',
                      grade: '',
                      color: 'طبيعي / Natural',
                      weight: '25 كجم',
                      packaging: 'شكائر منسوجة 25 كجم',
                      descriptionAr: '',
                      descriptionEn: '',
                      mainImageUrl: '/src/assets/images/pp_pellets_studio_1794908533302.jpg',
                      price: null,
                      discountPrice: null,
                      priceUnit: 'contact',
                      currency: 'EGP',
                      minOrderQuantity: 1,
                      availableQuantity: null,
                      availabilityStatus: 'upon_request',
                      isPublished: true,
                      isFeatured: false,
                      isBestSeller: false,
                      technicalSpecs: {},
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4C1D95] text-white text-xs font-extrabold cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#FACC15]" />
                  <span>{isRtl ? 'إضافة خامة / منتج جديد' : 'Add Product'}</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-purple-100 overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-[#15072E] text-white">
                    <tr>
                      <th className="p-3">{isRtl ? 'المنتج' : 'Product'}</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">{isRtl ? 'البوليمر' : 'Material'}</th>
                      <th className="p-3">{isRtl ? 'السعر' : 'Price'}</th>
                      <th className="p-3">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th className="p-3">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {allProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-purple-50/40">
                        <td className="p-3 flex items-center gap-2.5 min-w-[220px]">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-purple-100">
                            <ResilientImage src={p.mainImageUrl} alt={p.nameEn} />
                          </div>
                          <span className="font-bold">{isRtl ? p.nameAr : p.nameEn}</span>
                        </td>
                        <td className="p-3 font-mono-tech">{p.sku}</td>
                        <td className="p-3">{p.materialType}</td>
                        <td className="p-3 font-mono-tech tabular-nums">
                          {p.price !== null && p.priceUnit !== 'contact'
                            ? `${p.price} ${p.currency} / ${p.priceUnit}`
                            : isRtl
                            ? 'تواصل للسعر'
                            : 'Contact'}
                        </td>
                        <td className="p-3">
                          {p.isPublished ? (isRtl ? 'منشور' : 'Published') : isRtl ? 'مسودة' : 'Draft'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setExtraImages(p.images?.map((i) => i.imageUrl) || []);
                                setEditingProduct(p);
                              }}
                              className="p-1.5 rounded bg-purple-50 text-[#4C1D95] hover:bg-purple-100 cursor-pointer"
                              title={isRtl ? 'تعديل' : 'Edit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await apiFetch(`/api/admin/products/${p.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ isPublished: !p.isPublished }),
                                });
                                await loadTabData();
                                await refreshStorefront();
                              }}
                              className="p-1.5 rounded bg-purple-50 text-[#4C1D95] hover:bg-purple-100 cursor-pointer"
                              title={p.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {p.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await apiFetch(`/api/admin/products/${p.id}/duplicate`, { method: 'POST' });
                                notify(isRtl ? 'تم استنساخ المنتج كمسودة' : 'Product duplicated');
                                await loadTabData();
                              }}
                              className="p-1.5 rounded bg-purple-50 text-[#4C1D95] hover:bg-purple-100 cursor-pointer"
                              title={isRtl ? 'نسخ' : 'Duplicate'}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm(isRtl ? 'حذف هذا المنتج نهائياً؟' : 'Delete product?')) return;
                                await apiFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
                                await loadTabData();
                                await refreshStorefront();
                              }}
                              className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                              title={isRtl ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {tab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveCategory}
                className="lg:col-span-5 bg-white rounded-2xl border border-purple-100 p-5 space-y-3"
              >
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-[#4C1D95]" />
                  <span>{catForm.id ? (isRtl ? 'تعديل تصنيف' : 'Edit Category') : isRtl ? 'إضافة تصنيف جديد' : 'Add Category'}</span>
                </h3>
                <input
                  type="text"
                  required
                  value={catForm.nameAr}
                  onChange={(e) => setCatForm({ ...catForm, nameAr: e.target.value })}
                  placeholder={isRtl ? 'الاسم بالعربية *' : 'Arabic Name *'}
                  className="w-full h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                />
                <input
                  type="text"
                  required
                  value={catForm.nameEn}
                  onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })}
                  placeholder={isRtl ? 'الاسم بالإنجليزية *' : 'English Name *'}
                  className="w-full h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                />
                <textarea
                  rows={2}
                  value={catForm.descriptionAr}
                  onChange={(e) => setCatForm({ ...catForm, descriptionAr: e.target.value })}
                  placeholder={isRtl ? 'وصف التصنيف بالعربية' : 'Arabic Description'}
                  className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs resize-none"
                />
                <label className="block text-[11px] font-bold">
                  {isRtl ? 'رفع صورة التصنيف من جهازك:' : 'Upload Category Image:'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = await uploadDeviceFile(f);
                      if (url) setCatForm({ ...catForm, imageUrl: url });
                    }
                  }}
                  className="w-full text-xs"
                />
                <button
                  type="submit"
                  disabled={uploadingImg}
                  className="w-full py-2.5 rounded-xl bg-[#4C1D95] text-white text-xs font-bold cursor-pointer"
                >
                  {isRtl ? 'حفظ التصنيف' : 'Save Category'}
                </button>
              </form>

              <div className="lg:col-span-7 space-y-3">
                {allCategories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <ResilientImage src={c.imageUrl} alt={c.nameEn} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold">{isRtl ? c.nameAr : c.nameEn}</p>
                        <p className="text-[11px] text-purple-600">{c.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCatForm({
                            id: c.id,
                            nameAr: c.nameAr,
                            nameEn: c.nameEn,
                            descriptionAr: c.descriptionAr || '',
                            descriptionEn: c.descriptionEn || '',
                            imageUrl: c.imageUrl || '',
                            bannerUrl: c.bannerUrl || '',
                            isVisible: c.isVisible,
                          })
                        }
                        className="p-1.5 rounded bg-purple-50 text-[#4C1D95] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
                          await loadTabData();
                          await refreshStorefront();
                        }}
                        className="p-1.5 rounded bg-rose-50 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {tab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-xl font-black text-[#15072E]">
                {isRtl ? 'إدارة الطلبات وعروض الأسعار' : 'Orders & Quotations Management'}
              </h3>
              {allOrders.length === 0 ? (
                <p className="text-sm text-purple-700 bg-white p-8 rounded-2xl border border-purple-100 text-center">
                  {isRtl ? 'لا توجد طلبات مسجلة حالياً.' : 'No orders yet.'}
                </p>
              ) : (
                allOrders.map((ord) => (
                  <OrderAdminRow
                    key={ord.id}
                    order={ord}
                    isRtl={isRtl}
                    onUpdate={async (status, totalAmount, adminNotes) => {
                      await apiFetch(`/api/admin/orders/${ord.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status, totalAmount, adminNotes }),
                      });
                      notify(isRtl ? 'تم تحديث الطلب وإشعار العميل' : 'Order updated & customer notified');
                      await loadTabData();
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* TAB 5: INQUIRIES */}
          {tab === 'inquiries' && (
            <div className="space-y-4">
              <h3 className="text-xl font-black text-[#15072E]">
                {isRtl ? 'الاستفسارات وتذاكر الدعم والبلاغات' : 'Inquiries, Support & Reports'}
              </h3>
              {allInquiries.length === 0 ? (
                <p className="text-sm text-purple-700 bg-white p-8 rounded-2xl border border-purple-100 text-center">
                  {isRtl ? 'لا توجد رسائل أو تذاكر دعم.' : 'No inquiries yet.'}
                </p>
              ) : (
                allInquiries.map((inq) => (
                  <InquiryAdminRow
                    key={inq.id}
                    inquiry={inq}
                    isRtl={isRtl}
                    onReply={async (status, adminReply) => {
                      await apiFetch(`/api/admin/inquiries/${inq.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status, adminReply }),
                      });
                      notify(isRtl ? 'تم حفظ الرد وإشعار العميل' : 'Reply saved');
                      await loadTabData();
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* TAB 6: HIERARCHICAL USERS & ADMINS */}
          {tab === 'users' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-[#15072E]">
                  {isRtl ? 'التسلسل الإداري وصلاحيات الحسابات' : 'Administrator Hierarchy & User Accounts'}
                </h3>
                <p className="text-xs text-purple-700 mt-1">
                  {isRtl
                    ? 'الحساب #1: المشرف الأعلى (Super Admin) · الحسابات #2–#4: المديرون المؤسسون (Admin) · الحساب #5+: مستخدمون عاديون.'
                    : 'Account #1: SUPER_ADMIN · Accounts #2–#4: Founding ADMINs · Account #5+: NORMAL_USER.'}
                </p>
              </div>

              <div className="space-y-3">
                {allUsers.map((u) => (
                  <div
                    key={u.uid}
                    className="bg-white rounded-2xl border border-purple-100 p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tech text-xs font-bold text-purple-600">
                            #{u.registrationOrder}
                          </span>
                          <span className="text-sm font-extrabold text-[#15072E]">{u.fullName}</span>
                          <span className="text-xs font-mono-tech font-bold text-[#4C1D95]">
                            · {u.role}
                          </span>
                        </div>
                        <p className="text-xs font-mono-tech text-purple-700">
                          {u.email} · {u.status}
                        </p>
                      </div>

                      {u.role !== 'SUPER_ADMIN' && (
                        <div className="flex flex-wrap items-center gap-2">
                          {isSuperAdmin && (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                              className="h-8 px-2.5 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs font-bold"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="NORMAL_USER">NORMAL_USER</option>
                            </select>
                          )}

                          <button
                            type="button"
                            onClick={() => handleUserStatus(u.uid, 'warned')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
                          >
                            {isRtl ? 'تحذير' : 'Warn'}
                          </button>

                          {u.status !== 'suspended' && u.status !== 'blocked' ? (
                            <button
                              type="button"
                              onClick={() => handleUserStatus(u.uid, 'suspended')}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                            >
                              {isRtl ? 'إيقاف / حظر' : 'Suspend'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUserStatus(u.uid, 'active')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                            >
                              {isRtl ? 'استعادة' : 'Restore'}
                            </button>
                          )}

                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.uid, u.email)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                              title={isRtl ? 'حذف نهائي' : 'Delete User'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Super Admin Custom Permissions Matrix per ADMIN */}
                    {isSuperAdmin && u.role === 'ADMIN' && (
                      <div className="pt-2 border-t border-purple-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        {(Object.keys(u.permissions) as Array<keyof AdminPermissions>).map((permKey) => (
                          <label key={permKey} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(u.permissions[permKey])}
                              onChange={() => handleTogglePerm(u, permKey)}
                            />
                            <span className="font-mono-tech">{permKey}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: BANNERS & CMS SECTIONS */}
          {tab === 'cms' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-4">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#4C1D95]" />
                  <span>{isRtl ? 'إدارة البنرات الترويجية بالسلايدر الرئيسي' : 'Hero Slider Banners'}</span>
                </h3>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await apiFetch('/api/admin/banners', {
                      method: 'POST',
                      body: JSON.stringify(bannerForm),
                    });
                    notify(isRtl ? 'تمت إضافة البنر ونشره' : 'Banner published');
                    setBannerForm({ ...bannerForm, titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '' });
                    await refreshStorefront();
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <input
                    type="text"
                    required
                    value={bannerForm.titleAr}
                    onChange={(e) => setBannerForm({ ...bannerForm, titleAr: e.target.value })}
                    placeholder={isRtl ? 'عنوان البنر بالعربية *' : 'Arabic Banner Title *'}
                    className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={bannerForm.titleEn}
                    onChange={(e) => setBannerForm({ ...bannerForm, titleEn: e.target.value })}
                    placeholder={isRtl ? 'عنوان البنر بالإنجليزية *' : 'English Banner Title *'}
                    className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                  />
                  <input
                    type="text"
                    value={bannerForm.subtitleAr}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitleAr: e.target.value })}
                    placeholder={isRtl ? 'الوصف المختصر بالعربية' : 'Arabic Subtitle'}
                    className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await uploadDeviceFile(f);
                        if (url) setBannerForm({ ...bannerForm, imageUrl: url });
                      }
                    }}
                    className="text-xs"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 py-2.5 rounded-xl bg-[#4C1D95] text-white text-xs font-bold cursor-pointer"
                  >
                    {isRtl ? 'نشر البنر الجديد' : 'Publish Banner'}
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {banners.map((b: Banner) => (
                    <div key={b.id} className="p-3 rounded-xl bg-[#FAF8FF] border border-purple-100 flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0">
                        <ResilientImage src={b.imageUrl} alt={b.titleEn} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{isRtl ? b.titleAr : b.titleEn}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/api/admin/banners/${b.id}`, { method: 'DELETE' });
                          await refreshStorefront();
                        }}
                        className="p-1.5 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Homepage Sections */}
              <div className="space-y-4">
                {sections.map((sec: WebsiteSection) => (
                  <SectionEditorRow
                    key={sec.id}
                    section={sec}
                    isRtl={isRtl}
                    onUpload={uploadDeviceFile}
                    onSave={async (updated) => {
                      await apiFetch(`/api/admin/sections/${sec.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(updated),
                      });
                      notify(isRtl ? 'تم تحديث القسم بالموقع' : 'Section updated');
                      await refreshStorefront();
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 7B: SUPER ADMIN AI CONFIGURATION (LAILA) */}
          {tab === 'ai' && isSuperAdmin && (
            <div className="space-y-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const d = await apiFetch<{ aiSettings: AiAdminSettings }>('/api/admin/ai-settings', {
                      method: 'PUT',
                      body: JSON.stringify({
                        aiEnabled: aiForm.aiEnabled,
                        aiProvider: aiForm.aiProvider,
                        modelName: aiForm.modelName,
                        assistantNameAr: aiForm.assistantNameAr,
                        assistantNameEn: aiForm.assistantNameEn,
                        avatarUrl: aiForm.avatarUrl,
                        greetingAr: aiForm.greetingAr,
                        greetingEn: aiForm.greetingEn,
                        personalityPrompt: aiForm.personalityPrompt,
                        apiKey: aiForm.apiKeyInput.trim() || undefined,
                        openaiApiKey: aiForm.openaiKeyInput.trim() || undefined,
                      }),
                    });
                    setAiForm({
                      ...d.aiSettings,
                      apiKeyInput: '',
                      openaiKeyInput: '',
                      showGeminiKey: false,
                      showOpenaiKey: false,
                    });
                    await refreshStorefront();
                    notify(
                      isRtl
                        ? 'تم تشفير وحفظ إعدادات الذكاء الاصطناعي وتفعيل ليلي للجميع'
                        : 'AI Configuration encrypted, saved & active for everyone'
                    );
                  } catch (err: unknown) {
                    setErrorMsg(err instanceof Error ? err.message : 'Failed to save AI configuration');
                  }
                }}
                className="bg-white rounded-2xl border border-purple-100 p-6 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-purple-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={aiForm.avatarUrl}
                      alt={aiForm.assistantNameAr}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover object-top border-2 border-[#D4AF37]"
                    />
                    <div>
                      <h3 className="text-xl font-black text-[#15072E]">
                        {isRtl ? 'إعدادات الذكاء الاصطناعي — ليلي (Super Admin)' : 'AI Configuration — Laila (Super Admin)'}
                      </h3>
                      <p className="text-xs text-purple-700">
                        {isRtl
                          ? 'إدارة مشفّرة لمفاتيح المزوّدين (Gemini / OpenAI) واختيار النموذج لتشغيل ليلي لجميع زوار الموقع.'
                          : 'Securely store AES-256-GCM encrypted provider API keys & select models powering Laila AI across the site.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#4C1D95] border border-purple-200 inline-flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {isRtl ? 'خزنة AES-256-GCM مشفرة' : 'AES-256-GCM Encrypted Vault'}
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-xl border ${
                        aiForm.aiProvider === 'openai'
                          ? aiForm.hasOpenaiKey
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                          : aiForm.hasCustomKey || aiForm.hasServerEnvKey
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {aiForm.aiProvider === 'openai'
                        ? aiForm.hasOpenaiKey
                          ? isRtl
                            ? `OpenAI مفعّل (${aiForm.maskedOpenaiKeyHint})`
                            : `OpenAI Ready (${aiForm.maskedOpenaiKeyHint})`
                          : isRtl
                          ? 'OpenAI بانتظار المفتاح'
                          : 'OpenAI Key Required'
                        : aiForm.hasCustomKey
                        ? isRtl
                          ? `Gemini مفعّل (${aiForm.maskedKeyHint})`
                          : `Gemini Saved (${aiForm.maskedKeyHint})`
                        : aiForm.hasServerEnvKey
                        ? isRtl
                          ? 'مفتاح Gemini للخادم مفعّل'
                          : 'Gemini Server Key Active'
                        : isRtl
                        ? 'Gemini بانتظار المفتاح'
                        : 'Gemini Key Required'}
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-sm font-extrabold text-[#15072E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiForm.aiEnabled}
                    onChange={(e) => setAiForm({ ...aiForm, aiEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#4C1D95]"
                  />
                  <span>
                    {isRtl
                      ? 'تشغيل الذكاء الاصطناعي (ليلي) لجميع الناس والزوار في الموقع'
                      : 'Enable Laila AI widget publicly across the marketplace'}
                  </span>
                </label>

                {/* Active Provider & Model Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#FAF8FF] border border-purple-100 space-y-2">
                    <label className="block font-extrabold text-[#15072E]">
                      {isRtl ? 'مزوّد الذكاء الاصطناعي النشط' : 'Active AI Provider'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAiForm((prev) => ({
                            ...prev,
                            aiProvider: 'gemini',
                            modelName: prev.modelName.startsWith('gemini')
                              ? prev.modelName
                              : 'gemini-4-hydrogen',
                          }))
                        }
                        className={`h-10 rounded-lg font-bold border transition-all cursor-pointer ${
                          aiForm.aiProvider === 'gemini'
                            ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                            : 'bg-white text-[#15072E] border-purple-200 hover:border-[#4C1D95]'
                        }`}
                      >
                        Google Gemini
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAiForm((prev) => ({
                            ...prev,
                            aiProvider: 'openai',
                            modelName: prev.modelName.startsWith('gpt')
                              ? prev.modelName
                              : 'gpt-4o-mini',
                          }))
                        }
                        className={`h-10 rounded-lg font-bold border transition-all cursor-pointer ${
                          aiForm.aiProvider === 'openai'
                            ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                            : 'bg-white text-[#15072E] border-purple-200 hover:border-[#4C1D95]'
                        }`}
                      >
                        OpenAI GPT
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8FF] border border-purple-100 space-y-2">
                    <label className="block font-extrabold text-[#15072E]">
                      {isRtl ? 'النموذج المستخدم لليلي' : 'Active AI Model'}
                    </label>
                    <select
                      value={aiForm.modelName}
                      onChange={(e) => setAiForm({ ...aiForm, modelName: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-white border border-purple-200 font-mono-tech text-xs"
                    >
                      {aiForm.aiProvider === 'gemini' ? (
                        <>
                          <option value="gemini-4-hydrogen">gemini-4-hydrogen (Recommended)</option>
                          <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
                        </>
                      ) : (
                        <>
                          <option value="gpt-4o-mini">gpt-4o-mini (Fast & Balanced)</option>
                          <option value="gpt-4.1-mini">gpt-4.1-mini (Enhanced Reasoning)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Encrypted Key Vault Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                  {/* Google Gemini API Key */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      aiForm.aiProvider === 'gemini'
                        ? 'bg-[#FAF8FF] border-[#D4AF37]/70'
                        : 'bg-[#FAF8FF]/60 border-purple-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-extrabold text-[#15072E]">
                        {isRtl ? 'مفتاح Google Gemini API' : 'Google Gemini API Key'}
                      </label>
                      {aiForm.hasCustomKey && (
                        <span className="font-mono-tech text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {aiForm.maskedKeyHint}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={aiForm.showGeminiKey ? 'text' : 'password'}
                          value={aiForm.apiKeyInput}
                          onChange={(e) => setAiForm({ ...aiForm, apiKeyInput: e.target.value })}
                          autoComplete="new-password"
                          placeholder={
                            aiForm.hasCustomKey
                              ? isRtl
                                ? 'اتركه فارغاً للإبقاء على المفتاح المحفوظ أو الصق مفتاحاً جديداً...'
                                : 'Leave blank to keep saved key or paste new Gemini key...'
                              : 'AIza...'
                          }
                          className="w-full h-10 ps-3 pe-10 rounded-lg bg-white border border-purple-200 font-mono-tech"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setAiForm((prev) => ({ ...prev, showGeminiKey: !prev.showGeminiKey }))
                          }
                          title={aiForm.showGeminiKey ? 'Hide' : 'Show'}
                          className="absolute inset-y-0 end-0 px-3 text-purple-600 hover:text-[#15072E] cursor-pointer"
                        >
                          {aiForm.showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {aiForm.hasCustomKey && (
                        <button
                          type="button"
                          onClick={async () => {
                            const d = await apiFetch<{ aiSettings: AiAdminSettings }>('/api/admin/ai-settings', {
                              method: 'PUT',
                              body: JSON.stringify({ clearCustomKey: true }),
                            });
                            setAiForm((prev) => ({
                              ...prev,
                              ...d.aiSettings,
                              apiKeyInput: '',
                            }));
                            await refreshStorefront();
                            notify(isRtl ? 'تم مسح مفتاح Gemini' : 'Gemini key cleared');
                          }}
                          className="h-10 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer shrink-0"
                        >
                          {isRtl ? 'مسح' : 'Clear'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* OpenAI API Key */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      aiForm.aiProvider === 'openai'
                        ? 'bg-[#FAF8FF] border-[#D4AF37]/70'
                        : 'bg-[#FAF8FF]/60 border-purple-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-extrabold text-[#15072E]">
                        {isRtl ? 'مفتاح OpenAI API' : 'OpenAI API Key'}
                      </label>
                      {aiForm.hasOpenaiKey && (
                        <span className="font-mono-tech text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {aiForm.maskedOpenaiKeyHint}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={aiForm.showOpenaiKey ? 'text' : 'password'}
                          value={aiForm.openaiKeyInput}
                          onChange={(e) => setAiForm({ ...aiForm, openaiKeyInput: e.target.value })}
                          autoComplete="new-password"
                          placeholder={
                            aiForm.hasOpenaiKey
                              ? isRtl
                                ? 'اتركه فارغاً للإبقاء على المفتاح المحفوظ أو الصق مفتاحاً جديداً...'
                                : 'Leave blank to keep saved key or paste new OpenAI key...'
                              : 'sk-...'
                          }
                          className="w-full h-10 ps-3 pe-10 rounded-lg bg-white border border-purple-200 font-mono-tech"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setAiForm((prev) => ({ ...prev, showOpenaiKey: !prev.showOpenaiKey }))
                          }
                          title={aiForm.showOpenaiKey ? 'Hide' : 'Show'}
                          className="absolute inset-y-0 end-0 px-3 text-purple-600 hover:text-[#15072E] cursor-pointer"
                        >
                          {aiForm.showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {aiForm.hasOpenaiKey && (
                        <button
                          type="button"
                          onClick={async () => {
                            const d = await apiFetch<{ aiSettings: AiAdminSettings }>('/api/admin/ai-settings', {
                              method: 'PUT',
                              body: JSON.stringify({ clearOpenaiKey: true }),
                            });
                            setAiForm((prev) => ({
                              ...prev,
                              ...d.aiSettings,
                              openaiKeyInput: '',
                            }));
                            await refreshStorefront();
                            notify(isRtl ? 'تم مسح مفتاح OpenAI' : 'OpenAI key cleared');
                          }}
                          className="h-10 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer shrink-0"
                        >
                          {isRtl ? 'مسح' : 'Clear'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-purple-700">
                  {isRtl
                    ? 'تُشفّر جميع المفاتيح بخوارزمية AES-256-GCM في قاعدة البيانات على الخادم ولا تُرسل أبداً إلى متصفحات الزوار.'
                    : 'All keys are encrypted with AES-256-GCM before storage in Cloud SQL PostgreSQL and are never sent to browser clients.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1">{isRtl ? 'اسم المساعدة بالعربية' : 'Assistant Name (AR)'}</label>
                    <input
                      type="text"
                      value={aiForm.assistantNameAr}
                      onChange={(e) => setAiForm({ ...aiForm, assistantNameAr: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isRtl ? 'اسم المساعدة بالإنجليزية' : 'Assistant Name (EN)'}</label>
                    <input
                      type="text"
                      value={aiForm.assistantNameEn}
                      onChange={(e) => setAiForm({ ...aiForm, assistantNameEn: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
                    />
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <label className="block font-bold">{isRtl ? 'صورة ليلي (رابط أو رفع من جهازك)' : 'Laila Portrait Image'}</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      value={aiForm.avatarUrl}
                      onChange={(e) => setAiForm({ ...aiForm, avatarUrl: e.target.value })}
                      className="flex-1 min-w-[220px] h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 font-mono-tech"
                    />
                    <label className="h-10 px-4 rounded-lg bg-purple-100 hover:bg-purple-200 text-[#4C1D95] font-bold inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>{isRtl ? 'رفع صورة جديدة' : 'Upload Portrait'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const url = await uploadDeviceFile(f);
                            if (url) setAiForm((prev) => ({ ...prev, avatarUrl: url }));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1">{isRtl ? 'رسالة الترحيب (عربي)' : 'Welcome Greeting (AR)'}</label>
                    <textarea
                      rows={3}
                      value={aiForm.greetingAr}
                      onChange={(e) => setAiForm({ ...aiForm, greetingAr: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#FAF8FF] border border-purple-200 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isRtl ? 'رسالة الترحيب (إنجليزي)' : 'Welcome Greeting (EN)'}</label>
                    <textarea
                      rows={3}
                      value={aiForm.greetingEn}
                      onChange={(e) => setAiForm({ ...aiForm, greetingEn: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#FAF8FF] border border-purple-200 resize-none"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold mb-1">
                    {isRtl ? 'تعليمات شخصية ليلي (الأسلوب اللطيف والرومانسي)' : 'Laila Persona System Instruction'}
                  </label>
                  <textarea
                    rows={3}
                    value={aiForm.personalityPrompt}
                    onChange={(e) => setAiForm({ ...aiForm, personalityPrompt: e.target.value })}
                    className="w-full p-3 rounded-lg bg-[#FAF8FF] border border-purple-200 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#15072E] font-black text-xs cursor-pointer"
                >
                  {isRtl ? 'حفظ وتفعيل ليلي للجميع' : 'Save & Activate Laila AI'}
                </button>
              </form>

              {/* Quick Live Test Panel */}
              <div className="bg-white rounded-2xl border border-purple-100 p-6 space-y-3 text-xs">
                <h4 className="text-sm font-black text-[#15072E]">
                  {isRtl ? 'اختبار رد ليلي مباشرة' : 'Test Laila Response'}
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiTestMsg}
                    onChange={(e) => setAiTestMsg(e.target.value)}
                    placeholder={isRtl ? 'اكتب رسالة تجريبية لليلي...' : 'Write a test message for Laila...'}
                    className="flex-1 h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
                  />
                  <button
                    type="button"
                    disabled={aiTesting || !aiTestMsg.trim()}
                    onClick={async () => {
                      setAiTesting(true);
                      setAiTestReply(null);
                      try {
                        const res = await fetch('/api/ai/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ message: aiTestMsg, language: isRtl ? 'ar' : 'en' }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Error');
                        setAiTestReply(data.reply);
                      } catch (err: unknown) {
                        setErrorMsg(err instanceof Error ? err.message : 'Test failed');
                      } finally {
                        setAiTesting(false);
                      }
                    }}
                    className="h-10 px-5 rounded-lg bg-[#4C1D95] text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {aiTesting ? (isRtl ? 'جاري الاختبار...' : 'Testing...') : isRtl ? 'اختبار' : 'Test'}
                  </button>
                </div>
                {aiTestReply && (
                  <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-purple-200 text-[#15072E] leading-relaxed">
                    {aiTestReply}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: SUPER ADMIN WEBSITE SETTINGS & BRANDING */}
          {tab === 'settings' && isSuperAdmin && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiFetch('/api/admin/settings', {
                  method: 'PUT',
                  body: JSON.stringify(settingsForm),
                });
                notify(isRtl ? 'تم حفظ إعدادات الموقع والهوية' : 'Website settings saved');
                await refreshStorefront();
              }}
              className="bg-white rounded-2xl border border-purple-100 p-6 space-y-4"
            >
              <h3 className="text-xl font-black text-[#15072E]">
                {isRtl ? 'إعدادات الهوية والألوان والأمان (Super Admin)' : 'Branding, Currency & Security Settings'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1">{isRtl ? 'اسم العلامة بالعربية' : 'Brand Name (AR)'}</label>
                  <input
                    type="text"
                    value={settingsForm.brandNameAr}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandNameAr: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isRtl ? 'اسم العلامة بالإنجليزية' : 'Brand Name (EN)'}</label>
                  <input
                    type="text"
                    value={settingsForm.brandNameEn}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brandNameEn: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isRtl ? 'الشعار اللفظي بالعربية' : 'Tagline (AR)'}</label>
                  <input
                    type="text"
                    value={settingsForm.taglineAr}
                    onChange={(e) => setSettingsForm({ ...settingsForm, taglineAr: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isRtl ? 'سعر صرف الدولار (EGP)' : 'USD to EGP Rate'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsForm.usdToEgpRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, usdToEgpRate: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 font-mono-tech"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isRtl ? 'بريد الدعم والمبيعات' : 'Support Email'}</label>
                  <input
                    type="email"
                    value={settingsForm.supportEmail}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isRtl ? 'هاتف المبيعات' : 'Support Phone'}</label>
                  <input
                    type="text"
                    value={settingsForm.supportPhone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.allowPublicRegistration}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, allowPublicRegistration: e.target.checked })
                    }
                  />
                  <span>{isRtl ? 'السماح بتسجيل العملاء الجدد' : 'Allow Public User Registration'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.maintenanceMode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                  />
                  <span>{isRtl ? 'وضع الصيانة' : 'Maintenance Mode'}</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#4C1D95] text-white text-xs font-extrabold cursor-pointer"
              >
                {isRtl ? 'حفظ الإعدادات وتطبيقها فوراً' : 'Save & Apply Settings'}
              </button>
            </form>
          )}

          {/* TAB 9: AUDIT LOGS */}
          {tab === 'audit' && isSuperAdmin && (
            <div className="bg-white rounded-2xl border border-purple-100 overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-[#15072E] text-white">
                  <tr>
                    <th className="p-3">{isRtl ? 'التوقيت' : 'Timestamp'}</th>
                    <th className="p-3">{isRtl ? 'المسؤول' : 'Actor'}</th>
                    <th className="p-3">{isRtl ? 'العملية' : 'Action'}</th>
                    <th className="p-3">{isRtl ? 'الهدف' : 'Target'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {auditLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-mono-tech">{new Date(l.createdAt).toLocaleString()}</td>
                      <td className="p-3">{l.actorEmail} ({l.actorRole})</td>
                      <td className="p-3 font-mono-tech font-bold text-[#4C1D95]">{l.action}</td>
                      <td className="p-3 font-mono-tech">{l.targetType} #{l.targetId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {loading && (
            <p className="text-xs text-purple-700 font-semibold">{isRtl ? 'جاري التحديث...' : 'Loading...'}</p>
          )}
        </main>
      </div>

      {/* Product Add/Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-[#15072E]/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-2xl border border-[#D4AF37]/40 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <h4 className="text-base font-black">
                {editingProduct.id ? (isRtl ? 'تعديل المنتج' : 'Edit Product') : isRtl ? 'إضافة خامة جديدة' : 'Add Material'}
              </h4>
              <button type="button" onClick={() => setEditingProduct(null)} className="p-1.5 rounded bg-purple-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={editingProduct.nameAr || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                placeholder={isRtl ? 'اسم الخامة بالعربية *' : 'Arabic Name *'}
                className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
              />
              <input
                type="text"
                required
                value={editingProduct.nameEn || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                placeholder={isRtl ? 'اسم الخامة بالإنجليزية *' : 'English Name *'}
                className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
              />
              <select
                value={editingProduct.categoryId || ''}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    categoryId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
              >
                <option value="">{isRtl ? 'اختر التصنيف' : 'Select Category'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isRtl ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={editingProduct.materialType || 'PP'}
                onChange={(e) => setEditingProduct({ ...editingProduct, materialType: e.target.value })}
                placeholder="Material Type (PP, HDPE, LDPE, PET...)"
                className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
              />
              <input
                type="text"
                value={editingProduct.grade || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, grade: e.target.value })}
                placeholder={isRtl ? 'الدرجة الفنية (Injection, Blow...)' : 'Grade'}
                className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
              />
              <input
                type="text"
                value={editingProduct.color || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
                placeholder={isRtl ? 'اللون' : 'Color'}
                className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
              />
            </div>

            {/* Pricing & Stock */}
            {can('managePrices') && (
              <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-purple-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.price ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: e.target.value === '' ? null : Number(e.target.value),
                      priceUnit: e.target.value === '' ? 'contact' : editingProduct.priceUnit === 'contact' ? 'ton' : editingProduct.priceUnit,
                    })
                  }
                  placeholder={isRtl ? 'السعر (اتركه فارغاً للتواصل)' : 'Price (blank = contact)'}
                  className="h-9 px-2.5 rounded-lg bg-white border border-purple-200 font-mono-tech"
                />
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.discountPrice ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      discountPrice: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  placeholder={isRtl ? 'سعر العرض' : 'Discount Price'}
                  className="h-9 px-2.5 rounded-lg bg-white border border-purple-200 font-mono-tech"
                />
                <select
                  value={editingProduct.priceUnit || 'contact'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, priceUnit: e.target.value })}
                  className="h-9 px-2 rounded-lg bg-white border border-purple-200"
                >
                  <option value="contact">{isRtl ? 'تواصل للسعر' : 'Contact'}</option>
                  <option value="ton">{isRtl ? 'بالطن' : 'Per Ton'}</option>
                  <option value="kg">{isRtl ? 'بالكيلو' : 'Per Kg'}</option>
                  <option value="bag">{isRtl ? 'بالشكارة' : 'Per Bag'}</option>
                  <option value="fixed">{isRtl ? 'سعر ثابت' : 'Fixed'}</option>
                </select>
                <select
                  value={editingProduct.currency || 'EGP'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, currency: e.target.value })}
                  className="h-9 px-2 rounded-lg bg-white border border-purple-200"
                >
                  <option value="EGP">EGP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            )}

            {/* Image Upload & Gallery */}
            <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-purple-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#4C1D95]" />
                  {isRtl ? 'رفع الصورة الرئيسية وصور المعرض من الهاتف أو الكمبيوتر:' : 'Upload Product Photos:'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = await uploadDeviceFile(f);
                      if (url) setEditingProduct({ ...editingProduct, mainImageUrl: url });
                    }
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="text-[11px] font-bold">{isRtl ? 'إضافة صور إضافية:' : 'Add gallery images:'}</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    for (const f of files) {
                      const url = await uploadDeviceFile(f);
                      if (url) setExtraImages((prev) => [...prev, url]);
                    }
                  }}
                />
              </div>
            </div>

            <textarea
              rows={2}
              value={editingProduct.descriptionAr || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, descriptionAr: e.target.value })}
              placeholder={isRtl ? 'الوصف التفصيلي بالعربية' : 'Arabic Description'}
              className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-purple-200 resize-none"
            />

            <div className="flex flex-wrap gap-4 font-bold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.isPublished)}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isPublished: e.target.checked })}
                />
                <span>{isRtl ? 'منشور للعملاء' : 'Published'}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.isFeatured)}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                />
                <span>{isRtl ? 'منتج مميز' : 'Featured'}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.isBestSeller)}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                />
                <span>{isRtl ? 'الأكثر مبيعاً' : 'Best Seller'}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploadingImg}
              className="w-full py-3 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#15072E] font-extrabold text-sm cursor-pointer"
            >
              {uploadingImg ? (isRtl ? 'جاري رفع الصورة...' : 'Uploading...') : isRtl ? 'حفظ المنتج' : 'Save Product'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const OrderAdminRow: React.FC<{
  order: Order;
  isRtl: boolean;
  onUpdate: (status: string, totalAmount: number | null, adminNotes: string) => Promise<void>;
}> = ({ order, isRtl, onUpdate }) => {
  const [status, setStatus] = useState(order.status);
  const [totalAmount, setTotalAmount] = useState(order.totalAmount?.toString() || '');
  const [notes, setNotes] = useState(order.adminNotes || '');

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-4 space-y-3 text-xs">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <span className="font-mono-tech font-bold text-[#4C1D95] text-sm">{order.orderNumber}</span>
          <span className="mx-2">·</span>
          <strong>{order.customerName}</strong> ({order.customerPhone})
          <p className="text-purple-700 mt-0.5">{order.shippingAddress}</p>
        </div>
        <span className="font-mono-tech text-purple-600">{new Date(order.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="p-2.5 rounded-lg bg-[#FAF8FF] space-y-1">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between">
            <span>{isRtl ? it.productNameAr : it.productNameEn}</span>
            <span className="font-mono-tech font-bold">× {it.quantity}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-2.5 rounded-lg bg-[#FAF8FF] border border-purple-200 font-bold"
        >
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="quoted">Quoted</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="number"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder={isRtl ? 'إجمالي عرض السعر' : 'Quoted Total'}
          className="h-9 px-2.5 rounded-lg bg-[#FAF8FF] border border-purple-200 font-mono-tech"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isRtl ? 'ملاحظات للعميل' : 'Notes for customer'}
          className="h-9 px-2.5 rounded-lg bg-[#FAF8FF] border border-purple-200"
        />
        <button
          type="button"
          onClick={() => onUpdate(status, totalAmount === '' ? null : Number(totalAmount), notes)}
          className="h-9 rounded-lg bg-[#4C1D95] text-white font-bold cursor-pointer"
        >
          {isRtl ? 'حفظ وإشعار العميل' : 'Update Order'}
        </button>
      </div>
    </div>
  );
};

const InquiryAdminRow: React.FC<{
  inquiry: Inquiry;
  isRtl: boolean;
  onReply: (status: string, adminReply: string) => Promise<void>;
}> = ({ inquiry, isRtl, onReply }) => {
  const [status, setStatus] = useState(inquiry.status);
  const [reply, setReply] = useState(inquiry.adminReply || '');

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-4 space-y-2 text-xs">
      <div className="flex justify-between">
        <span className="font-mono-tech font-bold text-[#4C1D95]">{inquiry.ticketNumber} · {inquiry.type}</span>
        <span>{inquiry.name} ({inquiry.email})</span>
      </div>
      <h4 className="font-extrabold text-sm">{inquiry.subject}</h4>
      <p className="text-[#2B0F54]">{inquiry.message}</p>
      <div className="flex flex-wrap gap-2 pt-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-2.5 rounded-lg bg-[#FAF8FF] border border-purple-200 font-bold"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={isRtl ? 'اكتب رد الإدارة...' : 'Write admin reply...'}
          className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
        />
        <button
          type="button"
          onClick={() => onReply(status, reply)}
          className="h-9 px-4 rounded-lg bg-[#4C1D95] text-white font-bold cursor-pointer"
        >
          {isRtl ? 'إرسال الرد' : 'Save Reply'}
        </button>
      </div>
    </div>
  );
};

const SectionEditorRow: React.FC<{
  section: WebsiteSection;
  isRtl: boolean;
  onUpload: (file: File) => Promise<string | null>;
  onSave: (data: Partial<WebsiteSection>) => Promise<void>;
}> = ({ section, isRtl, onUpload, onSave }) => {
  const [titleAr, setTitleAr] = useState(section.titleAr);
  const [titleEn, setTitleEn] = useState(section.titleEn);
  const [contentAr, setContentAr] = useState(section.contentAr || '');
  const [imageUrl, setImageUrl] = useState(section.imageUrl || '');

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-4 space-y-3 text-xs">
      <div className="flex justify-between items-center">
        <span className="font-mono-tech font-bold text-[#4C1D95]">{section.sectionKey}</span>
        <button
          type="button"
          onClick={() => onSave({ titleAr, titleEn, contentAr, imageUrl })}
          className="px-4 py-1.5 rounded-lg bg-[#4C1D95] text-white font-bold cursor-pointer"
        >
          {isRtl ? 'حفظ التعديلات' : 'Save Section'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
        />
        <input
          type="text"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200"
        />
      </div>
      <textarea
        rows={2}
        value={contentAr}
        onChange={(e) => setContentAr(e.target.value)}
        className="w-full p-2.5 rounded-lg bg-[#FAF8FF] border border-purple-200 resize-none"
      />
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            const url = await onUpload(f);
            if (url) setImageUrl(url);
          }
        }}
      />
    </div>
  );
};
