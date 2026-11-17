import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Truck, Award, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ResilientImage } from './ResilientImage';

export const HeroSection: React.FC = () => {
  const { banners, settings, isRtl, products, categories } = useMarketplace();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const currentBanner = banners[activeIndex] || {
    id: 0,
    titleAr: settings?.taglineAr || 'من إعادة التدوير إلى خامات تصنع المستقبل',
    titleEn: settings?.taglineEn || 'From Recycling to Raw Materials Shaping the Future',
    subtitleAr: 'منصة صناعية من الجيل الجديد — حبيبات بوليمر فائقة النقاء، اختبارات MFI مخبرية، وتوريد مباشر للمصانع.',
    subtitleEn: 'Next-generation polymer marketplace — lab-verified recycled granules and virgin resins delivered factory-direct.',
    ctaTextAr: 'استكشف سوق الخامات',
    ctaTextEn: 'Explore Marketplace',
    ctaLink: '#marketplace',
    imageUrl: '/src/assets/images/hero_industrial_recycling_1793299426013.jpg',
    badgeTextAr: 'الجيل الصناعي الحديث',
    badgeTextEn: 'B2B Factory Direct',
  };

  return (
    <section id="top" className="bg-[#07020F] bg-grid-2070 text-white relative overflow-hidden border-b border-purple-500/20">
      {/* Subtle 2070 Radial Luminance */}
      <div
        className="absolute inset-0 pointer-events-none opacity-65"
        style={{
          background:
            'radial-gradient(circle at 18% 22%, rgba(250, 204, 21, 0.12), transparent 40%), radial-gradient(circle at 82% 30%, rgba(109, 40, 217, 0.34), transparent 52%)',
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10 text-[#f2e7e7]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Copy Column */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center space-y-6"
          >
            <div className="text-xs font-semibold tracking-wide text-[#FACC15]">
              {isRtl ? settings?.brandNameAr : settings?.brandNameEn}
              <span className="mx-2 text-purple-400" aria-hidden="true">·</span>
              <span className="text-purple-200">{isRtl ? currentBanner.badgeTextAr : currentBanner.badgeTextEn}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.2] text-white [text-wrap:balance]">
                  {isRtl ? currentBanner.titleAr : currentBanner.titleEn}
                </h1>

                <p className="text-sm sm:text-base text-purple-200/80 leading-relaxed max-w-xl">
                  {isRtl ? currentBanner.subtitleAr : currentBanner.subtitleEn}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={currentBanner.ctaLink || '#marketplace'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FACC15] hover:bg-[#FDE047] text-[#07020F] font-black text-sm shadow-lg shadow-[#FACC15]/20 transition-transform active:scale-95"
              >
                <span>{isRtl ? currentBanner.ctaTextAr : currentBanner.ctaTextEn}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>

              <a
                href="#support"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#120726]/80 hover:bg-[#240B4C] backdrop-blur-md border border-purple-400/30 text-white font-bold text-sm transition-colors"
              >
                <span>{isRtl ? 'اطلب عرض سعر بالطن' : 'Request Bulk Quote'}</span>
              </a>
            </div>

            {banners.length > 1 && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="p-2 rounded-xl bg-[#120726]/90 hover:bg-[#4C1D95] border border-purple-500/30 text-white cursor-pointer"
                  aria-label="Previous slide"
                >
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <div className="flex items-center gap-2">
                  {banners.map((b, i) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === activeIndex ? 'w-8 bg-[#FACC15]' : 'w-2 bg-purple-400/30'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => (prev + 1) % banners.length)}
                  className="p-2 rounded-xl bg-[#120726]/90 hover:bg-[#4C1D95] border border-purple-500/30 text-white cursor-pointer"
                  aria-label="Next slide"
                >
                  {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            )}
          </motion.div>

          {/* 2070 Kinetic Orbital Frame + Single Animated Showcase Image */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full h-72 sm:h-88 lg:h-full min-h-[340px] rounded-3xl overflow-hidden border border-purple-400/30 bg-[#120726]/80 backdrop-blur-xl shadow-2xl">
              {/* Animated SVG Orbital Polymer Rings (Compositor-only rotation) */}
              <svg
                viewBox="0 0 400 400"
                className="absolute -top-24 -end-24 w-72 h-72 pointer-events-none opacity-45 z-20 animate-orbit-slow"
                aria-hidden="true"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="165"
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="1"
                  strokeDasharray="10 14"
                />
                <circle cx="200" cy="35" r="4" fill="#FACC15" />
              </svg>

              <svg
                viewBox="0 0 400 400"
                className="absolute -bottom-24 -start-24 w-64 h-64 pointer-events-none opacity-35 z-20 animate-orbit-reverse"
                aria-hidden="true"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="145"
                  fill="none"
                  stroke="#A78BFA"
                  strokeWidth="1"
                  strokeDasharray="6 12"
                />
                <circle cx="345" cy="200" r="3.5" fill="#D4AF37" />
              </svg>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBanner.imageUrl}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full"
                >
                  <ResilientImage
                    src={currentBanner.imageUrl}
                    alt={isRtl ? currentBanner.titleAr : currentBanner.titleEn}
                    className="w-full h-full object-cover opacity-85"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Subtle sheen sweep */}
              <div
                className="absolute inset-0 pointer-events-none z-10 animate-sheen"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 35%, rgba(250, 204, 21, 0.14) 50%, transparent 65%)',
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#07020F]/90 via-[#07020F]/20 to-transparent z-10" />

              <div className="absolute bottom-5 inset-x-5 z-20 flex items-center justify-between text-xs">
                <span className="font-bold text-[#FACC15]">
                  {isRtl ? 'خامات بلاستيك صناعية — جودة وتوريد' : 'Next-Gen Industrial Polymers'}
                </span>
                <span className="font-mono-tech tabular-nums text-purple-200">
                  {activeIndex + 1} / {Math.max(1, banners.length)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean 2070 Glass Telemetry Bar */}
        <div className="mt-10 pt-8 border-t border-purple-500/20 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#120726]/70 backdrop-blur-md border border-purple-500/20 flex items-center gap-3.5">
            <Layers className="w-5 h-5 text-[#FACC15] shrink-0" />
            <div>
              <p className="text-lg font-black font-mono-tech tabular-nums text-white">
                {categories.length}
              </p>
              <p className="text-xs text-purple-200/80">
                {isRtl ? 'قسم للبوليمرات والخامات' : 'Polymer Categories'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#120726]/70 backdrop-blur-md border border-purple-500/20 flex items-center gap-3.5">
            <Award className="w-5 h-5 text-[#FACC15] shrink-0" />
            <div>
              <p className="text-lg font-black font-mono-tech tabular-nums text-white">
                {products.length}
              </p>
              <p className="text-xs text-purple-200/80">
                {isRtl ? 'خامة ومنتج بالكتالوج' : 'Catalog Materials'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#120726]/70 backdrop-blur-md border border-purple-500/20 flex items-center gap-3.5">
            <ShieldCheck className="w-5 h-5 text-[#FACC15] shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">
                {isRtl ? 'فحص مخبري MFI' : 'Lab-Tested MFI'}
              </p>
              <p className="text-xs text-purple-200/80">
                {isRtl ? 'مطابقة كاملة للمواصفات' : 'Verified specifications'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#120726]/70 backdrop-blur-md border border-purple-500/20 flex items-center gap-3.5">
            <Truck className="w-5 h-5 text-[#FACC15] shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">
                {isRtl ? 'توريد بالطن والحاوية' : 'Ton & Container Supply'}
              </p>
              <p className="text-xs text-purple-200/80">
                {isRtl ? 'شحن لجميع المدن الصناعية' : 'All industrial zones'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
