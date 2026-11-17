import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  PlayCircle,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ResilientImage } from './ResilientImage';
import type { Product } from '../types/marketplace';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenCart: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenCart,
}) => {
  const { isRtl, formatPriceDisplay, addToCart, toggleWishlist, isInWishlist, toggleCompare, compareList } =
    useMarketplace();
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  if (!product) return null;

  const galleryUrls = Array.from(
    new Set([
      product.mainImageUrl,
      ...(product.images?.map((img) => img.imageUrl) || []),
    ].filter(Boolean))
  );

  const activeImage = galleryUrls[imgIdx] || product.mainImageUrl;
  const priceInfo = formatPriceDisplay(product);
  const saved = isInWishlist(product.id);
  const compared = compareList.some((c) => c.id === product.id);
  const specs = product.technicalSpecs || {};

  const handleAdd = async () => {
    setBusy(true);
    try {
      const ok = await addToCart(product.id, Math.max(qty, product.minOrderQuantity || 1));
      if (ok) {
        onClose();
        onOpenCart();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15072E]/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-[#15072E] rounded-2xl border border-[#D4AF37]/40 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-purple-100 px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono-tech text-purple-700 font-semibold">
              {product.sku} · {product.materialType}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#15072E]">
              {isRtl ? product.nameAr : product.nameEn}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#15072E] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Gallery Column */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-purple-100 bg-[#FAF8FF]">
              <ResilientImage src={activeImage} alt={isRtl ? product.nameAr : product.nameEn} />
              {galleryUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImgIdx((i) => (i - 1 + galleryUrls.length) % galleryUrls.length)}
                    className="absolute start-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#15072E]/75 text-white hover:bg-[#15072E] cursor-pointer"
                  >
                    {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgIdx((i) => (i + 1) % galleryUrls.length)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#15072E]/75 text-white hover:bg-[#15072E] cursor-pointer"
                  >
                    {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>

            {galleryUrls.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {galleryUrls.map((url, idx) => (
                  <button
                    key={url + idx}
                    type="button"
                    onClick={() => setImgIdx(idx)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                      idx === imgIdx ? 'border-[#4C1D95]' : 'border-purple-100 opacity-75'
                    }`}
                  >
                    <ResilientImage src={url} alt="" />
                  </button>
                ))}
              </div>
            )}

            {product.videoUrl && (
              <a
                href={product.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#4C1D95] text-xs font-bold border border-purple-200"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{isRtl ? 'مشاهدة فيديو خط الإنتاج والاختبار' : 'Watch Production Video'}</span>
              </a>
            )}
          </div>

          {/* Contiguous Purchase & Technical Specs Module */}
          <div className="lg:col-span-6 space-y-5">
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-purple-200/70 space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-lg sm:text-xl font-black text-[#4C1D95] font-mono-tech tabular-nums">
                  {priceInfo.mainText}
                </p>
                {priceInfo.originalText && (
                  <p className="text-xs text-purple-400 line-through font-mono-tech tabular-nums">
                    {priceInfo.originalText}
                  </p>
                )}
              </div>

              <div className="text-xs text-[#2B0F54] flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  {isRtl ? 'الحد الأدنى للطلب:' : 'Min Order:'}{' '}
                  <strong className="font-mono-tech">{product.minOrderQuantity}</strong>
                </span>
                {product.availableQuantity !== null && (
                  <span>
                    {isRtl ? 'الكمية المتاحة:' : 'Available Stock:'}{' '}
                    <strong className="font-mono-tech">{product.availableQuantity}</strong>
                  </span>
                )}
                <span>
                  {isRtl ? 'الوزن / العبوة:' : 'Packaging:'} <strong>{product.weight}</strong>
                </span>
              </div>
            </div>

            <p className="text-sm text-[#2B0F54] leading-relaxed">
              {isRtl ? product.descriptionAr : product.descriptionEn}
            </p>

            {/* Technical Specifications Grid */}
            <div className="border border-purple-100 rounded-xl overflow-hidden">
              <div className="bg-[#15072E] text-white px-4 py-2 text-xs font-bold">
                {isRtl ? 'المواصفات الفنية والخصائص الميكانيكية' : 'Technical Specifications'}
              </div>
              <div className="divide-y divide-purple-100 text-xs">
                {[
                  { label: isRtl ? 'الدرجة (Grade)' : 'Grade', val: product.grade },
                  { label: isRtl ? 'اللون' : 'Color', val: product.color },
                  { label: isRtl ? 'التعبئة والتغليف' : 'Packaging', val: product.packaging },
                  { label: 'MFI', val: specs.mfi },
                  { label: isRtl ? 'الكثافة' : 'Density', val: specs.density },
                  { label: isRtl ? 'مقاومة الشد' : 'Tensile Strength', val: specs.tensileStrength },
                  { label: isRtl ? 'نقطة الانصهار' : 'Melting Point', val: specs.meltingPoint },
                  { label: isRtl ? 'نسبة الرطوبة' : 'Moisture', val: specs.moisture },
                  { label: isRtl ? 'التطبيقات' : 'Applications', val: specs.applications },
                  { label: isRtl ? 'المصدر' : 'Origin', val: specs.origin },
                ]
                  .filter((row) => row.val)
                  .map((row) => (
                    <div key={row.label} className="grid grid-cols-3 px-4 py-2 bg-white">
                      <span className="font-bold text-[#2B0F54]">{row.label}</span>
                      <span className="col-span-2 text-[#15072E] font-mono-tech">{row.val}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-purple-800">
              <Truck className="w-4 h-4 text-[#4C1D95] shrink-0" />
              <span>{isRtl ? product.shippingInfoAr : product.shippingInfoEn}</span>
            </div>

            {/* Quantity & Action Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden bg-[#FAF8FF]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(product.minOrderQuantity || 1, q - 1))}
                  className="px-3 py-2.5 text-sm font-bold text-[#15072E] hover:bg-purple-100 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={product.minOrderQuantity || 1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 text-center text-sm font-mono-tech font-bold bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2.5 text-sm font-bold text-[#15072E] hover:bg-purple-100 cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={busy}
                className="flex-1 py-3 px-5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#15072E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {busy
                    ? isRtl
                      ? 'جاري التنفيذ...'
                      : 'Processing...'
                    : priceInfo.hasPrice
                    ? isRtl
                      ? 'إضافة لسلة الشراء'
                      : 'Add to Cart'
                    : isRtl
                    ? 'إضافة لطلب عرض سعر'
                    : 'Add to Quote Request'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border cursor-pointer ${
                  saved
                    ? 'bg-[#4C1D95] text-[#FACC15] border-[#4C1D95]'
                    : 'bg-white text-[#15072E] border-purple-200 hover:bg-purple-50'
                }`}
                title={isRtl ? 'المفضلة' : 'Wishlist'}
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => toggleCompare(product)}
                className={`p-3 rounded-xl border cursor-pointer ${
                  compared
                    ? 'bg-[#FACC15] text-[#15072E] border-[#15072E]'
                    : 'bg-white text-[#15072E] border-purple-200 hover:bg-purple-50'
                }`}
                title={isRtl ? 'مقارنة' : 'Compare'}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
