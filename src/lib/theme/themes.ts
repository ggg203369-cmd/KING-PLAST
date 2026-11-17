/**
 * KING PLAST | Theme and Eye-Comfort Engine
 * Luxury industrial aesthetics with 4 distinct visual themes
 */

export type ThemeId = 'emerald' | 'azure' | 'amber' | 'comfort';

export interface ThemeConfig {
  id: ThemeId;
  nameAr: string;
  nameEn: string;
  previewColor: string;
  accentClass: string;
  accentBg: string;
  accentHoverBg: string;
  accentText: string;
  accentBorder: string;
  glowColor: string;
  badgeBg: string;
  badgeText: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    nameAr: 'الزمردي الصناعي (الأصلي)',
    nameEn: 'Industrial Emerald',
    previewColor: '#10b981',
    accentClass: 'theme-emerald',
    accentBg: 'bg-emerald-400',
    accentHoverBg: 'hover:bg-emerald-300',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/40',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400'
  },
  azure: {
    id: 'azure',
    nameAr: 'التيتانيوم السياني (أزرق)',
    nameEn: 'Titanium Azure',
    previewColor: '#06b6d4',
    accentClass: 'theme-azure',
    accentBg: 'bg-cyan-400',
    accentHoverBg: 'hover:bg-cyan-300',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500/40',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400'
  },
  amber: {
    id: 'amber',
    nameAr: 'الذهب والياقوت النحاسي',
    nameEn: 'Royal Copper Gold',
    previewColor: '#f59e0b',
    accentClass: 'theme-amber',
    accentBg: 'bg-amber-400',
    accentHoverBg: 'hover:bg-amber-300',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/40',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400'
  },
  comfort: {
    id: 'comfort',
    nameAr: 'نمط راحة العين (مانع الإجهاد)',
    nameEn: 'Eye-Comfort Midnight',
    previewColor: '#818cf8',
    accentClass: 'theme-comfort',
    accentBg: 'bg-indigo-300',
    accentHoverBg: 'hover:bg-indigo-200',
    accentText: 'text-indigo-300',
    accentBorder: 'border-indigo-400/30',
    glowColor: 'rgba(129, 140, 248, 0.2)',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-300'
  }
};
