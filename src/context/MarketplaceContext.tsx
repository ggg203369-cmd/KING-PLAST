import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase';
import type {
  AiAssistantPublicInfo,
  AppNotification,
  Banner,
  CartItem,
  Category,
  Currency,
  Language,
  Order,
  Product,
  UserProfile,
  WebsiteSection,
  WebsiteSettings,
  WishlistItem,
} from '../types/marketplace';

interface MarketplaceContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRtl: boolean;
  currency: Currency;
  setCurrency: (cur: Currency) => void;
  loadingStorefront: boolean;
  authReady: boolean;
  firebaseUser: User | null;
  profile: UserProfile | null;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  refreshStorefront: () => Promise<void>;
  refreshProfileAndUserData: () => Promise<void>;

  settings: WebsiteSettings | null;
  categories: Category[];
  banners: Banner[];
  sections: WebsiteSection[];
  products: Product[];
  aiAssistant: AiAssistantPublicInfo | null;

  cart: CartItem[];
  wishlist: WishlistItem[];
  myOrders: Order[];
  notifications: AppNotification[];
  unreadNotifications: number;

  compareList: Product[];
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;

  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
  updateCartQty: (cartItemId: number, quantity: number) => Promise<void>;
  removeCartItem: (cartItemId: number) => Promise<void>;
  toggleWishlist: (productId: number) => Promise<boolean>;
  isInWishlist: (productId: number) => boolean;
  markNotificationRead: (id: number) => Promise<void>;

  // Navigation & Active UI Filter helpers
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  formatPriceDisplay: (product: Product) => {
    hasPrice: boolean;
    mainText: string;
    originalText?: string;
    unitLabel: string;
  };
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [currency, setCurrency] = useState<Currency>('EGP');
  const [loadingStorefront, setLoadingStorefront] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiAssistant, setAiAssistant] = useState<AiAssistantPublicInfo | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [compareList, setCompareList] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isRtl = language === 'ar';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const apiFetch = useCallback(async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data as T;
  }, []);

  const refreshStorefront = useCallback(async () => {
    try {
      setLoadingStorefront(true);
      const res = await fetch('/api/storefront');
      if (!res.ok) throw new Error('Failed to load storefront');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.banners)) setBanners(data.banners);
      if (Array.isArray(data.sections)) setSections(data.sections);
      if (Array.isArray(data.products)) setProducts(data.products);
      if (data.aiAssistant !== undefined) setAiAssistant(data.aiAssistant);
    } catch (err) {
      console.error('Storefront load error:', err);
    } finally {
      setLoadingStorefront(false);
    }
  }, []);

  const refreshProfileAndUserData = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      setCart([]);
      setWishlist([]);
      setMyOrders([]);
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    try {
      const me = await apiFetch<{ profile: UserProfile; unreadNotifications: number }>('/api/auth/me');
      setProfile(me.profile);
      setUnreadNotifications(me.unreadNotifications || 0);
      setAuthError(null);

      const [cartData, wishData, ordData, notifData] = await Promise.all([
        apiFetch<{ items: CartItem[] }>('/api/cart').catch(() => ({ items: [] })),
        apiFetch<{ items: WishlistItem[] }>('/api/wishlist').catch(() => ({ items: [] })),
        apiFetch<{ orders: Order[] }>('/api/orders/my').catch(() => ({ orders: [] })),
        apiFetch<{ notifications: AppNotification[] }>('/api/notifications').catch(() => ({
          notifications: [],
        })),
      ]);

      setCart(cartData.items || []);
      setWishlist(wishData.items || []);
      setMyOrders(ordData.orders || []);
      setNotifications(notifData.notifications || []);
      setUnreadNotifications((notifData.notifications || []).filter((n) => !n.isRead).length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Session error';
      setAuthError(msg);
      setProfile(null);
    }
  }, [apiFetch]);

  useEffect(() => {
    refreshStorefront();
  }, [refreshStorefront]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await refreshProfileAndUserData();
      } else {
        setProfile(null);
        setCart([]);
        setWishlist([]);
        setMyOrders([]);
        setNotifications([]);
        setUnreadNotifications(0);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [refreshProfileAndUserData]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      await refreshProfileAndUserData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in';
      setAuthError(msg);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setCart([]);
    setWishlist([]);
    setMyOrders([]);
    setNotifications([]);
  };

  const addToCart = async (productId: number, quantity = 1): Promise<boolean> => {
    if (!auth.currentUser) {
      await signInWithGoogle();
      if (!auth.currentUser) return false;
    }
    await apiFetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    const cartData = await apiFetch<{ items: CartItem[] }>('/api/cart');
    setCart(cartData.items || []);
    return true;
  };

  const updateCartQty = async (cartItemId: number, quantity: number) => {
    await apiFetch(`/api/cart/${cartItemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    const cartData = await apiFetch<{ items: CartItem[] }>('/api/cart');
    setCart(cartData.items || []);
  };

  const removeCartItem = async (cartItemId: number) => {
    await apiFetch(`/api/cart/${cartItemId}`, { method: 'DELETE' });
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const toggleWishlist = async (productId: number): Promise<boolean> => {
    if (!auth.currentUser) {
      await signInWithGoogle();
      if (!auth.currentUser) return false;
    }
    const res = await apiFetch<{ saved: boolean }>('/api/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    const wishData = await apiFetch<{ items: WishlistItem[] }>('/api/wishlist');
    setWishlist(wishData.items || []);
    return res.saved;
  };

  const isInWishlist = (productId: number) => wishlist.some((w) => w.productId === productId);

  const markNotificationRead = async (id: number) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadNotifications((c) => Math.max(0, c - 1));
  };

  const toggleCompare = (product: Product) => {
    setCompareList((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  };

  const clearCompare = () => setCompareList([]);

  const formatPriceDisplay = useCallback(
    (product: Product) => {
      const unitMapAr: Record<string, string> = {
        kg: 'كجم',
        ton: 'طن',
        bag: 'شكارة',
        fixed: 'وحدة',
        contact: '',
      };
      const unitMapEn: Record<string, string> = {
        kg: 'kg',
        ton: 'ton',
        bag: 'bag',
        fixed: 'unit',
        contact: '',
      };

      if (product.price === null || product.price === undefined || product.priceUnit === 'contact') {
        return {
          hasPrice: false,
          mainText: isRtl ? 'تواصل معنا لمعرفة السعر' : 'Contact us for price',
          unitLabel: '',
        };
      }

      const rate = settings?.usdToEgpRate || 49.5;
      const convert = (val: number, fromCur: string) => {
        if (fromCur === currency) return val;
        if (fromCur === 'USD' && currency === 'EGP') return val * rate;
        if (fromCur === 'EGP' && currency === 'USD') return val / rate;
        return val;
      };

      const activeRaw = product.discountPrice ?? product.price;
      const activeConverted = convert(activeRaw, product.currency || 'EGP');
      const formattedActive = activeConverted.toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
        maximumFractionDigits: currency === 'USD' ? 2 : 0,
      });

      const currSymbol = currency === 'EGP' ? (isRtl ? 'ج.م' : 'EGP') : '$';
      const unitText = isRtl
        ? unitMapAr[product.priceUnit] || ''
        : unitMapEn[product.priceUnit] || '';

      let originalText: string | undefined;
      if (product.discountPrice !== null && product.discountPrice !== undefined && product.price > product.discountPrice) {
        const origConverted = convert(product.price, product.currency || 'EGP');
        originalText = `${origConverted.toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
          maximumFractionDigits: currency === 'USD' ? 2 : 0,
        })} ${currSymbol}`;
      }

      return {
        hasPrice: true,
        mainText: `${formattedActive} ${currSymbol}${unitText ? ` / ${unitText}` : ''}`,
        originalText,
        unitLabel: unitText,
      };
    },
    [currency, isRtl, settings?.usdToEgpRate]
  );

  return (
    <MarketplaceContext.Provider
      value={{
        language,
        setLanguage,
        isRtl,
        currency,
        setCurrency,
        loadingStorefront,
        authReady,
        firebaseUser,
        profile,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        logout,
        apiFetch,
        refreshStorefront,
        refreshProfileAndUserData,
        settings,
        categories,
        banners,
        sections,
        products,
        aiAssistant,
        cart,
        wishlist,
        myOrders,
        notifications,
        unreadNotifications,
        compareList,
        toggleCompare,
        clearCompare,
        addToCart,
        updateCartQty,
        removeCartItem,
        toggleWishlist,
        isInWishlist,
        markNotificationRead,
        selectedCategoryId,
        setSelectedCategoryId,
        searchQuery,
        setSearchQuery,
        formatPriceDisplay,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error('useMarketplace must be used inside MarketplaceProvider');
  return ctx;
};
