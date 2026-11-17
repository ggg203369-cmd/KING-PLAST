import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useMarketplace } from '../context/MarketplaceContext';

function getPolymerCode(nameEn: string, slug: string): string {
  const match = nameEn.match(/\(([A-Z0-9]+)\)/);
  if (match) return match[1];
  const upper = slug.toUpperCase();
  if (upper.includes('HDPE')) return 'HDPE';
  if (upper.includes('LLDPE')) return 'LLDPE';
  if (upper.includes('LDPE')) return 'LDPE';
  if (upper.includes('PET')) return 'PET';
  if (upper.includes('PVC')) return 'PVC';
  if (upper.includes('ABS')) return 'ABS';
  if (upper.includes('RECYCLED')) return 'R-PL';
  if (upper.includes('SCRAP')) return 'SCRAP';
  if (upper.includes('FLAKES')) return 'FLK';
  if (upper.includes('PELLET')) return 'PLT';
  if (upper.includes('CUSTOM')) return 'CMP';
  return 'POLY';
}

export const CategoryStrip: React.FC = () => {
  const { categories, selectedCategoryId, setSelectedCategoryId, isRtl } = useMarketplace();

  const handleSelect = (id: string) => {
    setSelectedCategoryId(id);
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="categories" className="py-12 bg-[#0B0418] border-b border-purple-500/20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-bold text-[#FACC15] mb-1">
              {isRtl ? 'تصنيفات البوليمرات' : 'Polymer Classifications'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isRtl ? 'أقسام خامات البلاستيك الصناعية' : 'Plastic Raw Material Categories'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleSelect('all')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#FACC15] hover:text-white transition-colors cursor-pointer"
          >
            <span>{isRtl ? 'عرض الكل' : 'View All'}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Sleek Photo-Free 2070 Polymer Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {categories.map((cat, idx) => {
            const isActive = selectedCategoryId === String(cat.id);
            const code = getPolymerCode(cat.nameEn, cat.slug);
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18 }}
                onClick={() => handleSelect(String(cat.id))}
                className={`group relative text-start rounded-2xl p-4 border overflow-hidden transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#FACC15] bg-[#4C1D95] text-white shadow-lg shadow-[#4C1D95]/30'
                    : 'border-purple-500/20 bg-[#120726]/80 hover:border-[#D4AF37]/60 text-purple-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`font-mono-tech text-xs font-bold tracking-wider ${
                      isActive ? 'text-[#FACC15]' : 'text-[#D4AF37]'
                    }`}
                  >
                    {code}
                  </span>
                  <span className="font-mono-tech text-[11px] tabular-nums text-purple-300/70">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="text-xs font-extrabold line-clamp-2 min-h-[2rem] text-white">
                  {isRtl ? cat.nameAr : cat.nameEn}
                </h3>

                <p
                  className={`text-[11px] font-mono-tech tabular-nums mt-2 ${
                    isActive ? 'text-[#FACC15]' : 'text-purple-300/75'
                  }`}
                >
                  {cat.productsCount ?? 0} {isRtl ? 'خامة' : 'items'}
                </p>

                <div
                  className={`mt-3 h-0.5 rounded-full transition-all duration-300 ${
                    isActive ? 'w-full bg-[#FACC15]' : 'w-6 bg-purple-500/40 group-hover:w-full group-hover:bg-[#D4AF37]'
                  }`}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
