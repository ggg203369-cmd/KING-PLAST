import React from 'react';
import { Lock, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { BrandLogo } from './BrandLogo';

interface WelcomeDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeDeveloperModal: React.FC<WelcomeDeveloperModalProps> = ({ isOpen, onClose }) => {
  const { isRtl, settings } = useMarketplace();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15072E]/85 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-dev-heading"
    >
      <div className="relative max-w-lg w-full rounded-3xl bg-gradient-to-b from-[#240B4C] to-[#15072E] border border-[#D4AF37]/50 text-white shadow-2xl overflow-hidden">
        {/* Soft golden-purple halo */}
        <div
          className="absolute inset-0 pointer-events-none opacity-45"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.22), transparent 60%)',
          }}
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 transition-colors cursor-pointer"
          aria-label={isRtl ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 p-7 sm:p-9 text-center space-y-6">
          <div className="flex justify-center">
            <BrandLogo
              logoUrl={settings?.logoUrl}
              brandNameAr={settings?.brandNameAr}
              brandNameEn={settings?.brandNameEn}
              isRtl={isRtl}
            />
          </div>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#4C1D95] border border-[#FACC15]/50 flex items-center justify-center shadow-lg shadow-[#4C1D95]/40">
            <ShieldCheck className="w-8 h-8 text-[#FACC15]" />
          </div>

          <div className="space-y-3">
            <h2
              id="welcome-dev-heading"
              className="text-xl sm:text-2xl font-black leading-relaxed text-white"
            >
              تم تطوير هذا الموقع من قبل المصمم{' '}
              <span dir="ltr" className="text-[#FACC15] font-display tracking-wide">
                Mina Saeed
              </span>
            </h2>

            <p className="text-sm sm:text-base font-bold text-[#FACC15]/95 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>هذا الموقع متصمم بكل وسائل الأمان كاملة</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-[11px] text-purple-100/90 pt-1">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-[#FACC15]">{isRtl ? 'تشفير ومصادقة' : 'Server Auth'}</p>
              <p className="mt-0.5 text-purple-200/80">{isRtl ? 'حماية خادمية كاملة' : 'Verified Sessions'}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-[#FACC15]">{isRtl ? 'قواعد بيانات معزولة' : 'Cloud SQL'}</p>
              <p className="mt-0.5 text-purple-200/80">{isRtl ? 'صلاحيات هرمية دقيقة' : 'Strict RBAC'}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-[#FACC15]">{isRtl ? 'مراقبة وأمان' : 'Audit Logs'}</p>
              <p className="mt-0.5 text-purple-200/80">{isRtl ? 'سجل مراجعة مستمر' : 'Protected Ops'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#15072E] font-black text-sm shadow-lg shadow-[#FACC15]/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRtl ? 'دخول الموقع وتصفح الكينج بلاست' : 'Enter KING PLAST Marketplace'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
