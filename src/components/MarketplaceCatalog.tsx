import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  Filter,
  Heart,
  RotateCcw,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMarketplace } from '../context/MarketplaceContext';
import type { Product } from '../types/marketplace';

interface MarketplaceCatalogProps {
  onSelectProduct: (product: Product) => void;
  onOpenCompare: () => void;
  onOpenCart: () => void;
}

export const MarketplaceCatalog: React.FC<MarketplaceCatalogProps> = ({
  onSelectProduct,
  onOpenCompare,
  onOpenCart,
}) => {
  const {
    products,
    categories,
    loadingStorefront,
    isRtl,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    formatPriceDisplay,
    addToCart,
    toggleWishlist,
    isInWishlist,
    compareList,
    toggleCompare,
    clearCompare,
  } = useMarketplace();

  const [collectionTab, setCollectionTab] = useState<'all' | 'featured' | 'bestseller' | 'recent'>('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'best_selling' | 'price_asc' | 'price_desc'>(
    'featured'
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const materialOptions = ['all', 'PP', 'PE', 'HDPE', 'LDPE', 'LLDPE', 'PET', 'PVC', 'ABS', 'Recycled', 'Scrap', 'Other'];

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (collectionTab === 'featured') {
      list = list.filter((p) => p.isFeatured);
    } else if (collectionTab === 'bestseller') {
      list = list.filter((p) => p.isBestSeller);
    } else if (collectionTab === 'recent') {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    if (selectedCategoryId !== 'all') {
      list = list.filter((p) => String(p.categoryId) === selectedCategoryId);
    }

    if (materialFilter !== 'all') {
      list = list.filter((p) => p.materialType.toLowerCase() === materialFilter.toLowerCase());
    }

    if (availabilityFilter !== 'all') {
      list = list.filter((p) => p.availabilityStatus === availabilityFilter);
    }

    if (gradeFilter.trim()) {
      const g = gradeFilter.trim().toLowerCase();
      list = list.filter((p) => p.grade.toLowerCase().includes(g));
    }

    if (colorFilter.trim()) {
      const c = colorFilter.trim().toLowerCase();
      list = list.filter((p) => p.color.toLowerCase().includes(c));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.materialType.toLowerCase().includes(q) ||
          p.grade.toLowerCase().includes(q) ||
          p.descriptionAr.toLowerCase().includes(q) ||
          p.descriptionEn.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'best_selling') {
      list.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    } else {
      list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }

    return list;
  }, [
    products,
    collectionTab,
    selectedCategoryId,
    materialFilter,
    availabilityFilter,
    gradeFilter,
    colorFilter,
    searchQuery,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setCollectionTab('all');
    setSelectedCategoryId('all');
    setMaterialFilter('all');
    setAvailabilityFilter('all');
    setGradeFilter('');
    setColorFilter('');
    setSearchQuery('');
    setSortBy('featured');
  };

  const handleQuickAdd = async (product: Product) => {
    try {
      setAddingId(product.id);
      const ok = await addToCart(product.id, product.minOrderQuantity || 1);
      if (ok) {
        setToastMsg(
          isRtl
            ? `تمت إضافة "${product.nameAr}" إلى سلة الطلبات`
            : `Added "${product.nameEn}" to cart`
        );
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch (err: unknown) {
      setToastMsg(err instanceof Error ? err.message : 'Error adding to cart');
      setTimeout(() => setToastMsg(null), 3500);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section id="marketplace" className="py-14 bg-[#07020F] bg-grid-2070 text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Collection Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-bold text-[#FACC15] mb-1">
              {isRtl ? 'كتالوج التوريد المباشر للمصانع' : 'Factory-Direct Polymer Catalog'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isRtl ? 'سوق خامات وحبيبات البلاستيك' : 'Industrial Plastic Raw Materials Marketplace'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#120726] rounded-2xl border border-purple-500/25">
            {[
              { id: 'all', labelAr: 'كل المنتجات', labelEn: 'All Materials' },
              { id: 'featured', labelAr: 'المميزة', labelEn: 'Featured' },
              { id: 'bestseller', labelAr: 'الأكثر طلباً', labelEn: 'Best Sellers' },
              { id: 'recent', labelAr: 'المضافة حديثاً', labelEn: 'Recently Added' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCollectionTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  collectionTab === tab.id
                    ? 'bg-[#FACC15] text-[#07020F] shadow-sm'
                    : 'text-purple-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {isRtl ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#120726] text-white border border-[#FACC15]/50 flex items-center justify-between gap-4 shadow-lg">
            <span className="text-xs sm:text-sm font-semibold">{toastMsg}</span>
            <button
              type="button"
              onClick={onOpenCart}
              className="px-3 py-1 rounded-lg bg-[#FACC15] text-[#07020F] text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isRtl ? 'عرض السلة' : 'View Cart'}
            </button>
          </div>
        )}

        {/* Toolbar & Mobile Filter Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMobileFilters((v) => !v)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#120726] border border-purple-500/30 text-xs font-bold text-white cursor-pointer"
            >
              <Filter className="w-4 h-4 text-[#FACC15]" />
              <span>{isRtl ? 'تصفية متقدمة' : 'Filters'}</span>
            </button>
            <span className="text-xs sm:text-sm font-semibold text-purple-200 tabular-nums">
              {isRtl
                ? `عرض ${filteredProducts.length} من أصل ${products.length} خامة`
                : `Showing ${filteredProducts.length} of ${products.length} materials`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-purple-200 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>{isRtl ? 'ترتيب:' : 'Sort:'}</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 rounded-xl bg-[#120726] border border-purple-500/30 text-xs font-semibold text-white focus:outline-none focus:border-[#FACC15]"
            >
              <option value="featured">{isRtl ? 'المميزة أولاً' : 'Featured First'}</option>
              <option value="newest">{isRtl ? 'الأحدث إضافة' : 'Newest Arrivals'}</option>
              <option value="best_selling">{isRtl ? 'الأكثر مبيعاً' : 'Best Selling'}</option>
              <option value="price_asc">{isRtl ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
              <option value="price_desc">{isRtl ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Filter Panel (2070 Glass Console) */}
          <aside
            className={`lg:col-span-3 bg-[#120726]/85 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-5 space-y-5 shadow-xl ${
              showMobileFilters ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <h3 className="text-sm font-extrabold text-white">
                {isRtl ? 'فلاتر المواصفات والخامات' : 'Specification Filters'}
              </h3>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#FACC15] hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                {isRtl ? 'القسم' : 'Category'}
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs font-semibold text-white"
              >
                <option value="all">{isRtl ? 'جميع الأقسام' : 'All Categories'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {isRtl ? catLabel(c.nameAr, c.nameEn, isRtl) : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                {isRtl ? 'نوع البوليمر' : 'Material Type'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {materialOptions.map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => setMaterialFilter(mat)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      materialFilter === mat
                        ? 'bg-[#FACC15] text-[#07020F] font-bold'
                        : 'bg-[#07020F] text-purple-200 border border-purple-500/25 hover:border-[#FACC15]/60'
                    }`}
                  >
                    {mat === 'all' ? (isRtl ? 'الكل' : 'All') : mat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                {isRtl ? 'حالة التوفر' : 'Availability'}
              </label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs font-semibold text-white"
              >
                <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                <option value="in_stock">{isRtl ? 'متوفر بالمخزن' : 'In Stock'}</option>
                <option value="upon_request">{isRtl ? 'توريد حسب الطلب' : 'Available Upon Request'}</option>
                <option value="out_of_stock">{isRtl ? 'غير متوفر حالياً' : 'Out of Stock'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                {isRtl ? 'الدرجة الفنية (Grade)' : 'Technical Grade'}
              </label>
              <input
                type="text"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                placeholder={isRtl ? 'مثال: Injection, Film, Blow...' : 'e.g. Injection, Film...'}
                className="w-full h-9 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs text-white placeholder-purple-400/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5">
                {isRtl ? 'اللون' : 'Color'}
              </label>
              <input
                type="text"
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                placeholder={isRtl ? 'مثال: طبيعي، شفاف، أسود...' : 'e.g. Natural, Clear, Black...'}
                className="w-full h-9 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs text-white placeholder-purple-400/50"
              />
            </div>
          </aside>

          {/* 2070 Photo-Free Architectural Product Cards (Photos available cleanly inside Detail Modal) */}
          <div className="lg:col-span-9">
            {loadingStorefront ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#120726]/70 rounded-3xl border border-purple-500/20 p-6 space-y-4 animate-pulse"
                  >
                    <div className="h-4 bg-purple-800/40 rounded w-1/2" />
                    <div className="h-6 bg-purple-800/40 rounded w-4/5" />
                    <div className="h-14 bg-purple-800/30 rounded-xl" />
                    <div className="h-9 bg-purple-800/40 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-[#120726]/80 rounded-3xl border border-purple-500/20 p-12 text-center">
                <p className="text-base font-bold text-white mb-2">
                  {isRtl ? 'لا توجد خامات مطابقة لبحثك حالياً' : 'No materials match your filters'}
                </p>
                <p className="text-xs text-purple-200/80 mb-5">
                  {isRtl
                    ? 'جرب تعديل الفلاتر أو اطلب الخامة مباشرة عبر قسم عروض الأسعار'
                    : 'Adjust your filters or request custom sourcing via our quotation team'}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#FACC15] text-[#07020F] text-xs font-extrabold cursor-pointer"
                >
                  {isRtl ? 'إظهار جميع الخامات' : 'Show All Materials'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const priceInfo = formatPriceDisplay(product);
                  const saved = isInWishlist(product.id);
                  const compared = compareList.some((c) => c.id === product.id);

                  return (
                    <motion.article
                      key={product.id}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="bg-[#120726]/85 backdrop-blur-md rounded-3xl border border-purple-500/25 hover:border-[#FACC15]/70 p-5 shadow-lg transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Top Polymer Code Header & Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-mono-tech text-[#FACC15] font-bold">
                            {product.materialType}
                            <span className="mx-1.5 text-purple-400" aria-hidden="true">·</span>
                            <span className="text-purple-200 font-normal">{product.sku}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleWishlist(product.id)}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                saved
                                  ? 'bg-[#4C1D95] text-[#FACC15] border-[#FACC15]'
                                  : 'bg-[#07020F]/70 text-purple-200 border-purple-500/25 hover:text-white'
                              }`}
                              title={isRtl ? 'حفظ في المفضلة' : 'Save to wishlist'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCompare(product)}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                compared
                                  ? 'bg-[#FACC15] text-[#07020F] border-[#FACC15]'
                                  : 'bg-[#07020F]/70 text-purple-200 border-purple-500/25 hover:text-white'
                              }`}
                              title={isRtl ? 'مقارنة المواصفات' : 'Compare specifications'}
                            >
                              {compared ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Title & Grade */}
                        <div>
                          <h3
                            onClick={() => onSelectProduct(product)}
                            className="text-base font-extrabold text-white hover:text-[#FACC15] cursor-pointer line-clamp-2 min-h-[2.75rem] transition-colors"
                          >
                            {isRtl ? product.nameAr : product.nameEn}
                          </h3>
                          <p className="text-xs text-purple-200/80 mt-1 line-clamp-1">
                            {product.grade} · {product.color}
                          </p>
                        </div>

                        {/* Compact 2070 Technical Spec Micro-Grid */}
                        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-purple-500/15 text-xs">
                          <div>
                            <p className="text-[11px] text-purple-300/70">MFI</p>
                            <p className="font-mono-tech font-semibold text-white truncate">
                              {product.technicalSpecs?.mfi || 'Standard'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-purple-300/70">
                              {isRtl ? 'العبوة / الوزن' : 'Unit Weight'}
                            </p>
                            <p className="font-mono-tech font-semibold text-white truncate">
                              {product.weight}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Price & Action Footer */}
                      <div className="mt-5 pt-4 border-t border-purple-500/20 space-y-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <p
                              className={`font-extrabold tabular-nums ${
                                priceInfo.hasPrice
                                  ? 'text-base text-[#FACC15] font-mono-tech'
                                  : 'text-xs text-[#FACC15]'
                              }`}
                            >
                              {priceInfo.mainText}
                            </p>
                            {priceInfo.originalText && (
                              <p className="text-[11px] text-purple-400 line-through font-mono-tech tabular-nums">
                                {priceInfo.originalText}
                              </p>
                            )}
                          </div>

                          <span className="text-[11px] font-semibold text-purple-200/80">
                            {product.availabilityStatus === 'in_stock'
                              ? isRtl
                                ? 'متوفر بالمخزن'
                                : 'In Stock'
                              : product.availabilityStatus === 'out_of_stock'
                              ? isRtl
                                ? 'نفذت الكمية'
                                : 'Out of Stock'
                              : isRtl
                              ? 'توريد عند الطلب'
                              : 'Upon Request'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(product)}
                            disabled={addingId === product.id}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#4C1D95] hover:bg-[#5B21B6] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-[#FACC15]" />
                            <span>
                              {addingId === product.id
                                ? isRtl
                                  ? 'جاري الإضافة...'
                                  : 'Adding...'
                                : priceInfo.hasPrice
                                ? isRtl
                                  ? 'أضف للسلة'
                                  : 'Add to Cart'
                                : isRtl
                                ? 'طلب تسعير'
                                : 'Add to Quote'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectProduct(product)}
                            className="py-2.5 px-3 rounded-xl bg-[#07020F] hover:bg-white/10 border border-purple-500/30 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isRtl ? 'التفاصيل والصور' : 'Specs & Media'}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Bottom Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto bg-[#120726]/95 backdrop-blur-xl text-white border border-[#FACC15]/60 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-4">
            <span className="text-xs font-bold tabular-nums">
              {isRtl
                ? `مقارنة (${compareList.length}/4) خامات`
                : `Compare (${compareList.length}/4) Materials`}
            </span>
            <button
              type="button"
              onClick={onOpenCompare}
              className="px-3.5 py-1.5 rounded-xl bg-[#FACC15] text-[#07020F] text-xs font-extrabold cursor-pointer"
            >
              {isRtl ? 'فتح المقارنة' : 'Compare Now'}
            </button>
            <button
              type="button"
              onClick={clearCompare}
              className="text-xs text-purple-200 hover:text-white cursor-pointer"
            >
              {isRtl ? 'مسح' : 'Clear'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

function catLabel(nameAr: string, nameEn: string, isRtl: boolean) {
  return isRtl ? nameAr : nameEn;
}
