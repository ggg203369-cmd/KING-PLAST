import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Wrench, X } from 'lucide-react';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoryStrip } from './components/CategoryStrip';
import { MarketplaceCatalog } from './components/MarketplaceCatalog';
import { CmsAndSupportSection } from './components/CmsAndSupportSection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CompareModal } from './components/CompareModal';
import { CartDrawer } from './components/CartDrawer';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BrandLogo } from './components/BrandLogo';
import { WelcomeDeveloperModal } from './components/WelcomeDeveloperModal';
import { LailaAiWidget } from './components/LailaAiWidget';
import type { Product } from './types/marketplace';

function MarketplaceShell() {
  const {
    isRtl,
    settings,
    profile,
    authError,
    clearAuthError,
    signInWithGoogle,
  } = useMarketplace();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kp_welcome_seen') !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!welcomeOpen) {
      try {
        sessionStorage.setItem('kp_welcome_seen', '1');
      } catch {
        // ignore storage restrictions
      }
    }
  }, [welcomeOpen]);

  const isAdmin = profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN';
  const isMaintenanceBlocked = Boolean(settings?.maintenanceMode) && !isAdmin;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#07020F] text-[#F5F3FF] flex flex-col selection:bg-[#FACC15]/40 selection:text-[#07020F]"
    >
      {/* Global Auth / Session Error Notice */}
      {authError && (
        <div className="bg-rose-950 text-white border-b border-rose-700/50 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between gap-4 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FACC15] shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            type="button"
            onClick={clearAuthError}
            className="p-1 rounded hover:bg-white/10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Maintenance Mode Guard (Admins still have full access) */}
      {isMaintenanceBlocked ? (
        <div className="flex-1 bg-[#07020F] bg-grid-2070 text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#120726]/90 backdrop-blur-xl border border-[#D4AF37]/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="flex justify-center">
              <BrandLogo
                logoUrl={settings?.logoUrl}
                brandNameAr={settings?.brandNameAr}
                brandNameEn={settings?.brandNameEn}
                isRtl={isRtl}
              />
            </div>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#4C1D95] border border-[#FACC15]/40 flex items-center justify-center">
              <Wrench className="w-7 h-7 text-[#FACC15]" />
            </div>
            <h1 className="text-2xl font-black text-white">
              {isRtl ? 'الموقع تحت الصيانة والتحديث' : 'Marketplace Under Scheduled Maintenance'}
            </h1>
            <p className="text-sm text-purple-200 leading-relaxed">
              {isRtl
                ? 'نقوم حالياً بتحديث مخزون خامات البلاستيك وقوائم الأسعار الصناعية. سنعود للعمل خلال دقائق.'
                : 'We are currently updating polymer inventory and industrial specification sheets. Please check back shortly.'}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              {!profile ? (
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FACC15] text-[#15072E] font-extrabold text-sm hover:bg-yellow-300 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRtl ? 'دخول الإدارة' : 'Admin Sign In'}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navbar
            onOpenCart={() => setCartOpen(true)}
            onOpenAccount={() => setAccountOpen(true)}
            onOpenAdmin={() => setAdminOpen(true)}
            onSelectProduct={(prod) => setSelectedProduct(prod)}
          />

          <main className="flex-1">
            <HeroSection />
            <CategoryStrip />
            <MarketplaceCatalog
              onSelectProduct={(prod) => setSelectedProduct(prod)}
              onOpenCompare={() => setCompareOpen(true)}
              onOpenCart={() => setCartOpen(true)}
            />
            <CmsAndSupportSection />
          </main>

          <Footer onOpenDeveloperInfo={() => setWelcomeOpen(true)} />

          {/* First-Entry Developer & Security Welcome Modal */}
          <WelcomeDeveloperModal isOpen={welcomeOpen} onClose={() => setWelcomeOpen(false)} />

          {/* Floating Laila AI Companion (Available to All Visitors) */}
          <LailaAiWidget />

          {/* Interactive Overlays */}
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onOpenCart={() => setCartOpen(true)}
          />

          <CompareModal isOpen={compareOpen} onClose={() => setCompareOpen(false)} />

          <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

          <CustomerAccountModal
            isOpen={accountOpen}
            onClose={() => setAccountOpen(false)}
            onOpenAdmin={() => {
              setAccountOpen(false);
              setAdminOpen(true);
            }}
          />

          {isAdmin && (
            <AdminDashboard isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <MarketplaceProvider>
      <MarketplaceShell />
    </MarketplaceProvider>
  );
}
