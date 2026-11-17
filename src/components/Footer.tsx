import React from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onOpenDeveloperInfo?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDeveloperInfo }) => {
  const { settings, categories, setSelectedCategoryId, isRtl } = useMarketplace();

  return (
    <footer className="bg-[#05010B] text-white border-t border-purple-500/20 py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#D4AF37]/20">
          <div className="md:col-span-5 space-y-3">
            <BrandLogo
              logoUrl={settings?.logoUrl}
              brandNameAr={settings?.brandNameAr}
              brandNameEn={settings?.brandNameEn}
              isRtl={isRtl}
            />
            <p className="text-xs sm:text-sm text-purple-200/85 max-w-md leading-relaxed">
              {isRtl ? settings?.taglineAr : settings?.taglineEn}
            </p>
            <p className="text-xs text-purple-300/75">
              {isRtl ? settings?.addressAr : settings?.addressEn}
            </p>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs font-extrabold text-[#FACC15] mb-3">
              {isRtl ? 'الأقسام الرئيسية' : 'Key Material Categories'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-purple-100/80">
              {categories.slice(0, 8).map((c) => (
                <a
                  key={c.id}
                  href="#marketplace"
                  onClick={() => setSelectedCategoryId(String(c.id))}
                  className="hover:text-[#FACC15] transition-colors truncate"
                >
                  {isRtl ? c.nameAr : c.nameEn}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 space-y-2 text-xs text-purple-100/80">
            <h4 className="text-xs font-extrabold text-[#FACC15] mb-3">
              {isRtl ? 'التواصل المباشر' : 'Direct Contact'}
            </h4>
            <p className="font-mono-tech">{settings?.supportEmail}</p>
            <p className="font-mono-tech" dir="ltr">
              {settings?.supportPhone}
            </p>
            <a href="#support" className="inline-block text-[#FACC15] hover:underline font-bold pt-1">
              {isRtl ? 'إرسال طلب تسعير' : 'Request Quotation'}
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-purple-300/80">
          <p>
            © {new Date().getFullYear()} {settings?.brandNameEn || 'KING PLAST'} ·{' '}
            {settings?.brandNameAr || 'الكينج بلاست'}.{' '}
            {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <button
            type="button"
            onClick={onOpenDeveloperInfo}
            className="text-start hover:text-[#FACC15] transition-colors cursor-pointer"
          >
            <span>تم تطوير هذا الموقع من قبل المصمم </span>
            <span dir="ltr" className="font-bold text-[#FACC15]">
              Mina Saeed
            </span>
            <span> · هذا الموقع متصمم بكل وسائل الأمان كاملة</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
