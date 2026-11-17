import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Globe,
  Layers,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { BrandLogo } from './BrandLogo';
import type { Product } from '../types/marketplace';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onSelectProduct: (product: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenAccount,
  onOpenAdmin,
  onSelectProduct,
}) => {
  const {
    language,
    setLanguage,
    isRtl,
    currency,
    setCurrency,
    settings,
    categories,
    profile,
    cart,
    unreadNotifications,
    searchQuery,
    setSearchQuery,
    setSelectedCategoryId,
    signInWithGoogle,
  } = useMarketplace();

  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{
      id: number;
      nameAr: string;
      nameEn: string;
      materialType: string;
      grade: string;
      sku: string;
      mainImageUrl: string;
    }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN';
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/suggestions?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch {
        // Ignore transient autocomplete errors
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategoryId(catId);
    setMegaOpen(false);
    setMobileOpen(false);
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSuggestionClick = async (id: number) => {
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.product) onSelectProduct(data.product);
      }
    } catch {
      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#07020F]/85 backdrop-blur-xl text-white border-b border-purple-500/25 shadow-lg">
      {/* Main Row */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a href="#top" className="shrink-0 focus-visible:outline-2 focus-visible:outline-[#FACC15] rounded">
          <BrandLogo
            logoUrl={settings?.logoUrl}
            brandNameAr={settings?.brandNameAr}
            brandNameEn={settings?.brandNameEn}
            isRtl={isRtl}
          />
        </a>

        {/* Zone 2: Concise Single-Line Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-white/85">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMegaOpen((v) => !v)}
              className="flex items-center gap-1.5 hover:text-[#FACC15] transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#FACC15]" />
              <span>{isRtl ? 'التصنيفات' : 'Categories'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <a
            href="#marketplace"
            className="hover:text-[#FACC15] transition-colors whitespace-nowrap shrink-0"
          >
            {isRtl ? 'السوق الصناعي' : 'Marketplace'}
          </a>
          <a
            href="#quality"
            className="hover:text-[#FACC15] transition-colors whitespace-nowrap shrink-0"
          >
            {isRtl ? 'الجودة والتوريد' : 'Supply & Lab'}
          </a>
          <a
            href="#support"
            className="hover:text-[#FACC15] transition-colors whitespace-nowrap shrink-0"
          >
            {isRtl ? 'الدعم وطلب الأسعار' : 'Support & Quotes'}
          </a>
        </nav>

        {/* Live Search Box (Desktop) */}
        <div ref={searchBoxRef} className="hidden md:block flex-1 max-w-md relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSuggestions(false);
                  document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              placeholder={
                isRtl
                  ? 'ابحث عن الخامات (PP، HDPE، PET، الدرجة، SKU)...'
                  : 'Search polymers, grades, SKUs (PP, HDPE, PET)...'
              }
              className="w-full h-10 bg-[#120726]/90 border border-purple-500/30 rounded-xl ps-10 pe-4 text-xs sm:text-sm text-white placeholder-purple-300/55 focus:outline-none focus:border-[#FACC15] transition-colors"
            />
            <Search className="w-4 h-4 text-[#FACC15] absolute start-3 pointer-events-none" />
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-12 inset-x-0 bg-[#120726] text-white rounded-2xl shadow-2xl border border-purple-500/35 overflow-hidden z-50">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSuggestionClick(s.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#240B4C] text-start transition-colors border-b border-purple-500/15 last:border-b-0 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#4C1D95]/60 border border-[#D4AF37]/40 flex items-center justify-center shrink-0 font-mono-tech text-[11px] font-bold text-[#FACC15]">
                    {s.materialType}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {isRtl ? s.nameAr : s.nameEn}
                    </p>
                    <p className="text-[11px] text-purple-300 font-mono-tech truncate">
                      {s.grade} · {s.sku}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Currency Switch */}
          <button
            type="button"
            onClick={() => setCurrency(currency === 'EGP' ? 'USD' : 'EGP')}
            className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-lg bg-[#240B4C] hover:bg-[#34116B] border border-[#D4AF37]/30 text-xs font-mono-tech font-semibold text-[#FACC15] whitespace-nowrap shrink-0 cursor-pointer"
            title={isRtl ? 'تغيير العملة' : 'Switch currency'}
          >
            {currency}
          </button>

          {/* Language Switch */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#240B4C] hover:bg-[#34116B] border border-[#D4AF37]/30 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Admin Console (Visible strictly for SUPER_ADMIN & ADMIN) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#FDE047] text-[#15072E] text-xs font-extrabold whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isRtl ? 'لوحة الإدارة' : 'Admin'}</span>
            </button>
          )}

          {/* Account / Sign In */}
          {profile ? (
            <button
              type="button"
              onClick={onOpenAccount}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#240B4C] hover:bg-[#34116B] border border-[#D4AF37]/35 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#FACC15]" />
              <span className="hidden xl:inline max-w-[110px] truncate">{profile.fullName}</span>
              {unreadNotifications > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#FACC15] text-[#15072E] font-mono-tech text-[10px] font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#FDE047] text-[#15072E] text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>
          )}

          {/* Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4C1D95] hover:bg-[#5B21B6] border border-[#D4AF37]/40 text-xs font-bold text-white whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={isRtl ? 'سلة الطلبات' : 'Shopping Cart'}
          >
            <ShoppingCart className="w-4 h-4 text-[#FACC15]" />
            <span className="font-mono-tech tabular-nums">{totalCartItems}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg bg-[#240B4C] text-white hover:text-[#FACC15] cursor-pointer"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mega Menu Panel (Clean Photo-Free 2070 Grid) */}
      {megaOpen && (
        <div className="hidden lg:block bg-[#0E051E]/95 backdrop-blur-xl text-white border-b border-purple-500/25 shadow-2xl">
          <div className="max-w-[1440px] mx-auto px-8 py-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-500/20">
              <h3 className="text-sm font-extrabold text-[#FACC15]">
                {isRtl ? 'أقسام خامات البلاستيك الصناعية' : 'Industrial Polymer Categories'}
              </h3>
              <button
                type="button"
                onClick={() => handleCategoryClick('all')}
                className="text-xs font-bold text-[#FACC15] hover:text-white underline cursor-pointer"
              >
                {isRtl ? 'عرض جميع المنتجات' : 'View All Products'}
              </button>
            </div>
            <div className="grid grid-cols-4 xl:grid-cols-5 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(String(cat.id))}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-purple-500/20 bg-[#15072E]/70 hover:border-[#FACC15]/60 hover:bg-[#240B4C] text-start transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {isRtl ? cat.nameAr : cat.nameEn}
                    </p>
                    <p className="text-[11px] text-purple-300 font-mono-tech mt-0.5">
                      {cat.productsCount ?? 0} {isRtl ? 'خامة' : 'items'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#1D0A3D] border-t border-[#D4AF37]/20 px-4 py-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث عن الخامات أو الدرجة...' : 'Search materials...'}
              className="w-full h-10 bg-[#2B0F54] border border-[#D4AF37]/30 rounded-lg ps-9 pe-3 text-sm text-white"
            />
            <Search className="w-4 h-4 text-[#FACC15] absolute start-3 top-3" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <a
              href="#marketplace"
              onClick={() => setMobileOpen(false)}
              className="p-2.5 rounded-lg bg-[#2B0F54] text-white"
            >
              {isRtl ? 'السوق الصناعي' : 'Marketplace'}
            </a>
            <a
              href="#categories"
              onClick={() => setMobileOpen(false)}
              className="p-2.5 rounded-lg bg-[#2B0F54] text-white"
            >
              {isRtl ? 'الأقسام' : 'Categories'}
            </a>
            <a
              href="#quality"
              onClick={() => setMobileOpen(false)}
              className="p-2.5 rounded-lg bg-[#2B0F54] text-white"
            >
              {isRtl ? 'الجودة والتوريد' : 'Quality & Lab'}
            </a>
            <a
              href="#support"
              onClick={() => setMobileOpen(false)}
              className="p-2.5 rounded-lg bg-[#2B0F54] text-white"
            >
              {isRtl ? 'طلب عرض سعر' : 'Support & Quote'}
            </a>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAdmin();
              }}
              className="w-full py-2.5 rounded-lg bg-[#FACC15] text-[#15072E] font-extrabold text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isRtl ? 'فتح لوحة الإدارة والتحكم' : 'Open Admin Dashboard'}</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
