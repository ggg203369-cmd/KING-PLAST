import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Heart, LogOut, Package, Shield, User, X } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ResilientImage } from './ResilientImage';
import type { Inquiry } from '../types/marketplace';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
}) => {
  const {
    isRtl,
    profile,
    myOrders,
    wishlist,
    notifications,
    markNotificationRead,
    toggleWishlist,
    addToCart,
    apiFetch,
    refreshProfileAndUserData,
    logout,
  } = useMarketplace();

  const [tab, setTab] = useState<'profile' | 'orders' | 'wishlist' | 'tickets' | 'notifications'>('orders');
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setCompanyName(profile.companyName || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen && profile) {
      apiFetch<{ inquiries: Inquiry[] }>('/api/inquiries/my')
        .then((d) => setMyInquiries(d.inquiries || []))
        .catch(() => {});
    }
  }, [isOpen, profile, apiFetch]);

  if (!isOpen || !profile) return null;

  const isAdmin = profile.role === 'SUPER_ADMIN' || profile.role === 'ADMIN';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ fullName, companyName, phone, city }),
    });
    await refreshProfileAndUserData();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15072E]/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-[#15072E] rounded-2xl border border-[#D4AF37]/40 max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#15072E] text-white px-6 py-4 flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4C1D95] border border-[#D4AF37]/50 flex items-center justify-center text-[#FACC15]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold">{profile.fullName}</h3>
              <p className="text-xs text-purple-200 font-mono-tech">
                {profile.email} · {profile.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#FACC15] text-[#15072E] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isRtl ? 'لوحة الإدارة' : 'Admin'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#2B0F54] hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isRtl ? 'خروج' : 'Sign Out'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#2B0F54] text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Account Warning Banner if warned by admin */}
        {profile.warningMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
            {isRtl ? 'تنبيه إداري:' : 'Admin Notice:'} {profile.warningMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-purple-100 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'orders', labelAr: `طلباتي (${myOrders.length})`, labelEn: `Orders (${myOrders.length})` },
            { id: 'wishlist', labelAr: `المفضلة (${wishlist.length})`, labelEn: `Wishlist (${wishlist.length})` },
            {
              id: 'notifications',
              labelAr: `الإشعارات (${notifications.filter((n) => !n.isRead).length})`,
              labelEn: `Notifications (${notifications.filter((n) => !n.isRead).length})`,
            },
            { id: 'tickets', labelAr: `الاستفسارات (${myInquiries.length})`, labelEn: `Tickets (${myInquiries.length})` },
            { id: 'profile', labelAr: 'الملف الشخصي', labelEn: 'Profile' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                tab === t.id
                  ? 'border-[#4C1D95] text-[#4C1D95]'
                  : 'border-transparent text-[#2B0F54]/70 hover:text-[#15072E]'
              }`}
            >
              {isRtl ? t.labelAr : t.labelEn}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'orders' && (
            <div className="space-y-4">
              {myOrders.length === 0 ? (
                <p className="text-sm text-purple-700 text-center py-8">
                  {isRtl ? 'لا توجد طلبات مسجلة بعد.' : 'No orders submitted yet.'}
                </p>
              ) : (
                myOrders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-xl bg-[#FAF8FF] border border-purple-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#4C1D95]" />
                        <span className="font-mono-tech font-bold text-sm text-[#15072E]">
                          {ord.orderNumber}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#4C1D95]">
                        {ord.status.toUpperCase()} · {ord.orderType}
                      </span>
                    </div>
                    <div className="text-xs text-[#2B0F54]">
                      {ord.items.map((it) => (
                        <div key={it.id} className="flex justify-between py-1 border-b border-purple-100/70 last:border-0">
                          <span>
                            {isRtl ? it.productNameAr : it.productNameEn} × {it.quantity}
                          </span>
                          <span className="font-mono-tech">
                            {it.subtotal ? `${it.subtotal.toLocaleString()} ${ord.currency}` : isRtl ? 'تسعير خاص' : 'Quoted'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {ord.totalAmount && (
                      <p className="text-xs font-extrabold text-[#4C1D95] font-mono-tech">
                        {isRtl ? 'إجمالي العرض المعتمد:' : 'Quoted Total:'} {ord.totalAmount.toLocaleString()} {ord.currency}
                      </p>
                    )}
                    {ord.adminNotes && (
                      <p className="text-xs bg-white p-2.5 rounded-lg border border-purple-100 text-[#15072E]">
                        <strong>{isRtl ? 'رد الإدارة:' : 'Admin Note:'}</strong> {ord.adminNotes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'wishlist' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlist.length === 0 ? (
                <p className="col-span-2 text-sm text-purple-700 text-center py-8">
                  {isRtl ? 'قائمة المفضلة فارغة.' : 'Your wishlist is empty.'}
                </p>
              ) : (
                wishlist.map((w) => (
                  <div key={w.id} className="p-3 rounded-xl bg-[#FAF8FF] border border-purple-100 flex items-center gap-3">
                    <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0">
                      <ResilientImage src={w.product.mainImageUrl} alt={w.product.nameEn} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">
                        {isRtl ? w.product.nameAr : w.product.nameEn}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => addToCart(w.productId, 1)}
                          className="px-2.5 py-1 rounded bg-[#4C1D95] text-white text-[11px] font-bold cursor-pointer"
                        >
                          {isRtl ? 'أضف للسلة' : 'Add to Cart'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(w.productId)}
                          className="p-1 text-rose-500 cursor-pointer"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-purple-700 text-center py-8">
                  {isRtl ? 'لا توجد إشعارات.' : 'No notifications.'}
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markNotificationRead(n.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer ${
                      n.isRead ? 'bg-white border-purple-100' : 'bg-purple-50 border-[#4C1D95]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#4C1D95]" />
                        {isRtl ? n.titleAr : n.titleEn}
                      </span>
                      <span className="text-[11px] font-mono-tech text-purple-500">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#2B0F54] mt-1">{isRtl ? n.bodyAr : n.bodyEn}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'tickets' && (
            <div className="space-y-3">
              {myInquiries.length === 0 ? (
                <p className="text-sm text-purple-700 text-center py-8">
                  {isRtl ? 'لا توجد استفسارات أو تذاكر دعم.' : 'No support tickets yet.'}
                </p>
              ) : (
                myInquiries.map((inq) => (
                  <div key={inq.id} className="p-4 rounded-xl bg-[#FAF8FF] border border-purple-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-tech font-bold text-[#4C1D95]">{inq.ticketNumber}</span>
                      <span className="font-bold">{inq.status}</span>
                    </div>
                    <h4 className="text-xs font-extrabold">{inq.subject}</h4>
                    <p className="text-xs text-[#2B0F54]">{inq.message}</p>
                    {inq.adminReply && (
                      <div className="p-2.5 rounded-lg bg-white border border-purple-200 text-xs">
                        <strong className="text-[#4C1D95]">{isRtl ? 'رد الدعم:' : 'Support Reply:'}</strong>{' '}
                        {inq.adminReply}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
              {savedNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRtl ? 'تم تحديث بيانات حسابك بنجاح' : 'Profile updated!'}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{isRtl ? 'الشركة / المصنع' : 'Company / Factory'}</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isRtl ? 'المدينة الصناعية' : 'City'}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#4C1D95] text-white text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
