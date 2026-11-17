import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShoppingBag, Trash2, X } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const {
    isRtl,
    cart,
    profile,
    updateCartQty,
    removeCartItem,
    formatPriceDisplay,
    apiFetch,
    refreshProfileAndUserData,
    signInWithGoogle,
  } = useMarketplace();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderType, setOrderType] = useState<'quotation' | 'purchase'>('quotation');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setCustomerName((prev) => prev || profile.fullName || '');
      setCustomerPhone((prev) => prev || profile.phone || '');
      setCompanyName((prev) => prev || profile.companyName || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const hasContactOnlyItem = cart.some(
    (item) => item.product.price === null || item.product.priceUnit === 'contact'
  );

  const computedSubtotal = cart.reduce((acc, item) => {
    const unit = item.product.discountPrice ?? item.product.price;
    if (unit === null || unit === undefined || item.product.priceUnit === 'contact') return acc;
    return acc + unit * item.quantity;
  }, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!profile) {
      await signInWithGoogle();
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ order: { orderNumber: string } }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          customerPhone,
          companyName,
          shippingAddress,
          orderType: hasContactOnlyItem ? 'quotation' : orderType,
          notes,
          fromCart: true,
        }),
      });
      setConfirmedOrderNumber(res.order.orderNumber);
      await refreshProfileAndUserData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#15072E]/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white text-[#15072E] h-full overflow-y-auto shadow-2xl flex flex-col justify-between"
      >
        <div>
          <div className="sticky top-0 z-10 bg-[#15072E] text-white px-6 py-4 flex items-center justify-between border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#FACC15]" />
              <h3 className="text-base font-extrabold">
                {isRtl ? 'سلة الطلبات وعروض الأسعار' : 'Cart & Quotation Request'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfirmedOrderNumber(null);
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#2B0F54] hover:bg-[#4C1D95] text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {confirmedOrderNumber ? (
              <div className="p-6 rounded-2xl bg-purple-50 border border-[#4C1D95]/30 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#4C1D95] mx-auto" />
                <h4 className="text-lg font-black text-[#15072E]">
                  {isRtl ? 'تم تسجيل طلبك بنجاح!' : 'Order Submitted Successfully!'}
                </h4>
                <p className="text-sm font-mono-tech font-bold text-[#4C1D95]">
                  {confirmedOrderNumber}
                </p>
                <p className="text-xs text-[#2B0F54]">
                  {isRtl
                    ? 'تم حفظ الطلب في قاعدة البيانات وإرسال إشعار لفريق المبيعات. يمكنك متابعة حالته من حسابك.'
                    : 'Your request is saved in our database and routed to sales. Track its status in your account.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrderNumber(null);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#4C1D95] text-white text-xs font-bold cursor-pointer"
                >
                  {isRtl ? 'متابعة التسوق' : 'Continue Shopping'}
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-purple-300 mx-auto" />
                <p className="text-sm font-bold text-[#15072E]">
                  {isRtl ? 'سلة الطلبات فارغة حالياً' : 'Your cart is currently empty'}
                </p>
                <p className="text-xs text-purple-700">
                  {isRtl
                    ? 'أضف خامات البلاستيك من الكتالوج لإرسال طلب شراء أو عرض سعر.'
                    : 'Add plastic raw materials from the catalog to submit a purchase or quotation request.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.map((item) => {
                    const priceInfo = formatPriceDisplay(item.product);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-[#FAF8FF] border border-purple-100 flex items-center gap-3"
                      >
                        <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0 border border-purple-100">
                          <ResilientImage src={item.product.mainImageUrl} alt={item.product.nameEn} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-[#15072E] truncate">
                            {isRtl ? item.product.nameAr : item.product.nameEn}
                          </h4>
                          <p className="text-[11px] font-mono-tech text-[#4C1D95] mt-0.5">
                            {priceInfo.mainText}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQty(item.id, Math.max(item.product.minOrderQuantity || 1, item.quantity - 1))
                              }
                              className="w-6 h-6 rounded bg-white border border-purple-200 text-xs font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono-tech font-bold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-white border border-purple-200 text-xs font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="p-4 rounded-xl bg-[#15072E] text-white space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-200">
                      {isRtl ? 'حالة التسعير:' : 'Pricing Summary:'}
                    </span>
                    <span className="font-mono-tech font-bold text-[#FACC15]">
                      {hasContactOnlyItem
                        ? isRtl
                          ? 'سيتم إرسال عرض سعر رسمي'
                          : 'Official Quotation Upon Review'
                        : `${computedSubtotal.toLocaleString()} ${cart[0]?.product.currency || 'EGP'}`}
                    </span>
                  </div>
                </div>

                {/* Checkout / Quote Form */}
                <form onSubmit={handleSubmitOrder} className="space-y-3 pt-2 border-t border-purple-100">
                  <h4 className="text-sm font-extrabold text-[#15072E]">
                    {isRtl ? 'بيانات التوريد والشحن' : 'Delivery & Company Details'}
                  </h4>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('quotation')}
                      className={`py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        orderType === 'quotation' || hasContactOnlyItem
                          ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                          : 'bg-white text-[#2B0F54] border-purple-200'
                      }`}
                    >
                      {isRtl ? 'طلب عرض سعر (B2B)' : 'Request Quotation'}
                    </button>
                    <button
                      type="button"
                      disabled={hasContactOnlyItem}
                      onClick={() => setOrderType('purchase')}
                      className={`py-2 rounded-lg text-xs font-bold border cursor-pointer disabled:opacity-40 ${
                        orderType === 'purchase' && !hasContactOnlyItem
                          ? 'bg-[#4C1D95] text-white border-[#4C1D95]'
                          : 'bg-white text-[#2B0F54] border-purple-200'
                      }`}
                    >
                      {isRtl ? 'طلب شراء مباشر' : 'Purchase Order'}
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={isRtl ? 'الاسم الكامل *' : 'Full Name *'}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={isRtl ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}
                      className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                    />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={isRtl ? 'اسم المصنع أو الشركة' : 'Company / Factory Name'}
                      className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder={isRtl ? 'عنوان التسليم / المنطقة الصناعية *' : 'Delivery Address *'}
                    className="w-full h-10 px-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs"
                  />

                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isRtl ? 'ملاحظات التعبئة أو المواعيد المطلوبة...' : 'Packaging or delivery notes...'}
                    className="w-full p-3 rounded-lg bg-[#FAF8FF] border border-purple-200 text-xs resize-none"
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#15072E] font-extrabold text-sm shadow-md cursor-pointer disabled:opacity-60"
                  >
                    {submitting
                      ? isRtl
                        ? 'جاري إرسال الطلب...'
                        : 'Submitting...'
                      : isRtl
                      ? 'تأكيد وإرسال الطلب الآن'
                      : 'Submit Order Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
