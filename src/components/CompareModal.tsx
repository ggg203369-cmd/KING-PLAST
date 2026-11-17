import React from 'react';
import { Trash2, X } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ResilientImage } from './ResilientImage';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose }) => {
  const { compareList, toggleCompare, clearCompare, isRtl, formatPriceDisplay } = useMarketplace();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15072E]/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-[#15072E] rounded-2xl border border-[#D4AF37]/40 max-w-6xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-purple-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-[#15072E]">
              {isRtl ? 'مقارنة المواصفات الفنية للخامات' : 'Polymer Specifications Comparison'}
            </h3>
            <p className="text-xs text-purple-700">
              {isRtl ? 'مقارنة جنباً إلى جنب لاختيار الدرجة المناسبة لخط الإنتاج' : 'Side-by-side comparison'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {compareList.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                {isRtl ? 'مسح الكل' : 'Clear All'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {compareList.length === 0 ? (
          <div className="p-12 text-center text-sm text-purple-700">
            {isRtl
              ? 'اختر منتجات من الكتالوج عبر زر المقارنة لعرض الفروق الفنية هنا.'
              : 'Select up to 4 products using the Compare button to inspect them side-by-side.'}
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr>
                  <th className="p-3 bg-[#FAF8FF] border border-purple-100 font-extrabold w-44">
                    {isRtl ? 'المواصفة' : 'Attribute'}
                  </th>
                  {compareList.map((p) => (
                    <th key={p.id} className="p-3 bg-[#FAF8FF] border border-purple-100 min-w-[200px] align-top">
                      <div className="space-y-2">
                        <div className="aspect-[4/3] rounded-lg overflow-hidden border border-purple-100">
                          <ResilientImage src={p.mainImageUrl} alt={p.nameEn} />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-[#15072E] text-start">
                            {isRtl ? p.nameAr : p.nameEn}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCompare(p)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'SKU', get: (p: any) => p.sku },
                  { label: isRtl ? 'نوع البوليمر' : 'Material', get: (p: any) => p.materialType },
                  { label: isRtl ? 'الدرجة' : 'Grade', get: (p: any) => p.grade },
                  { label: isRtl ? 'السعر' : 'Price', get: (p: any) => formatPriceDisplay(p).mainText },
                  { label: 'MFI', get: (p: any) => p.technicalSpecs?.mfi || '—' },
                  { label: isRtl ? 'الكثافة' : 'Density', get: (p: any) => p.technicalSpecs?.density || '—' },
                  { label: isRtl ? 'اللون' : 'Color', get: (p: any) => p.color },
                  { label: isRtl ? 'التعبئة' : 'Packaging', get: (p: any) => p.packaging },
                  { label: isRtl ? 'التطبيقات' : 'Applications', get: (p: any) => p.technicalSpecs?.applications || '—' },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-purple-50/40">
                    <td className="p-3 border border-purple-100 font-bold text-[#4C1D95]">{row.label}</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="p-3 border border-purple-100 font-mono-tech text-[#15072E]">
                        {row.get(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
