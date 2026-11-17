import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ResilientImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#2B0F54] via-[#4C1D95] to-[#15072E] flex flex-col items-center justify-center p-4 text-center">
        <Package className="w-8 h-8 text-[#FACC15] mb-2 opacity-90" />
        <span className="text-xs font-semibold text-white/90 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
