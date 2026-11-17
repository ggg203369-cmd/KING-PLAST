import React from 'react';

interface BrandLogoProps {
  logoUrl?: string | null;
  brandNameAr?: string;
  brandNameEn?: string;
  isRtl: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  brandNameAr = 'الكينج بلاست',
  brandNameEn = 'KING PLAST',
  isRtl,
}) => {
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={brandNameEn}
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-lg object-cover border border-[#D4AF37]/50"
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4C1D95] to-[#15072E] border border-[#D4AF37]/60 flex items-center justify-center shadow-sm">
          <svg
            viewBox="0 0 32 32"
            className="w-6 h-6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
              stroke="#D4AF37"
              strokeWidth="1.75"
              fill="#240B4C"
            />
            <path
              d="M8.5 20.5L10.5 11.5L16 15.5L21.5 11.5L23.5 20.5H8.5Z"
              fill="#FACC15"
              stroke="#D4AF37"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
        {isRtl ? `${brandNameAr} · ${brandNameEn}` : brandNameEn}
      </span>
    </div>
  );
};
