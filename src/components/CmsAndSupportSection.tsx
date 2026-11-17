import React, { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useMarketplace } from '../context/MarketplaceContext';

export const CmsAndSupportSection: React.FC = () => {
  const { sections, settings, profile, isRtl, apiFetch } = useMarketplace();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [type, setType] = useState<'inquiry' | 'support' | 'report'>('inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName((v) => v || profile.fullName || '');
      setEmail((v) => v || profile.email || '');
      setPhone((v) => v || profile.phone || '');
      setCompany((v) => v || profile.companyName || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ inquiry: { ticketNumber: string } }>('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, company, type, subject, message }),
      });
      setTicketResult(res.inquiry.ticketNumber);
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 2070 Kinetic Vector Showcase (Clean Animated Motion Instead of Extra Stock Photos) */}
      <section id="quality" className="py-16 bg-[#0B0418] border-t border-purple-500/20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              <div
                className={`lg:col-span-6 space-y-4 ${
                  idx % 2 === 1 ? 'lg:order-2' : ''
                }`}
              >
                <p className="text-xs font-bold text-[#FACC15]">
                  {isRtl ? sec.subtitleAr : sec.subtitleEn}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white [text-wrap:balance]">
                  {isRtl ? sec.titleAr : sec.titleEn}
                </h2>
                <p className="text-sm sm:text-base text-purple-200/80 leading-relaxed">
                  {isRtl ? sec.contentAr : sec.contentEn}
                </p>
              </div>

              {/* Subtle 2070 Animated Kinetic SVG Graphic */}
              <div className={`lg:col-span-6 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="h-64 sm:h-72 rounded-3xl bg-[#120726]/80 border border-purple-500/25 relative overflow-hidden flex items-center justify-center p-6">
                  {idx % 2 === 0 ? (
                    <div className="relative flex items-center justify-center w-48 h-48">
                      <svg
                        viewBox="0 0 200 200"
                        className="w-full h-full animate-orbit-slow"
                        aria-hidden="true"
                      >
                        <circle
                          cx="100"
                          cy="100"
                          r="82"
                          fill="none"
                          stroke="#6D28D9"
                          strokeWidth="1.5"
                          strokeDasharray="10 8"
                        />
                        <circle cx="100" cy="18" r="5" fill="#FACC15" />
                        <circle cx="182" cy="100" r="4" fill="#A78BFA" />
                      </svg>
                      <svg
                        viewBox="0 0 200 200"
                        className="w-32 h-32 absolute animate-orbit-reverse"
                        aria-hidden="true"
                      >
                        <circle
                          cx="100"
                          cy="100"
                          r="68"
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="1.5"
                          strokeDasharray="4 10"
                        />
                        <circle cx="100" cy="168" r="4" fill="#FACC15" />
                      </svg>
                      <div className="text-center z-10">
                        <p className="font-mono-tech text-xl font-black text-[#FACC15]">MFI</p>
                        <p className="text-[11px] text-purple-200 mt-0.5">
                          {isRtl ? 'تحليل البوليمر' : 'Polymer QC'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-md space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono-tech text-purple-200">
                        <span>{isRtl ? 'خط التوريد الصناعي' : 'Supply Flow'}</span>
                        <span className="text-[#FACC15]">25kg / 1000kg</span>
                      </div>
                      <svg viewBox="0 0 400 90" className="w-full h-24" aria-hidden="true">
                        <motion.path
                          d="M 10 45 Q 100 10, 200 45 T 390 45"
                          fill="none"
                          stroke="#7C3AED"
                          strokeWidth="2.5"
                          initial={{ pathLength: 0.2, opacity: 0.5 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 2.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                        />
                        <motion.path
                          d="M 10 55 Q 100 85, 200 55 T 390 55"
                          fill="none"
                          stroke="#FACC15"
                          strokeWidth="1.75"
                          initial={{ pathLength: 0.3, opacity: 0.4 }}
                          animate={{ pathLength: 1, opacity: 0.9 }}
                          transition={{ duration: 3.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                        />
                        <circle cx="14" cy="45" r="4" fill="#FACC15" />
                        <circle cx="200" cy="45" r="4.5" fill="#A78BFA" />
                        <circle cx="386" cy="45" r="4" fill="#FACC15" />
                      </svg>
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono-tech text-purple-200/85">
                        <span className="p-2 rounded-xl bg-[#07020F]/70 border border-purple-500/20">PP / PE</span>
                        <span className="p-2 rounded-xl bg-[#07020F]/70 border border-purple-500/20">HDPE / PET</span>
                        <span className="p-2 rounded-xl bg-[#07020F]/70 border border-purple-500/20">B2B Ton</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2070 Support, Quotation & Contact Section */}
      <section id="support" className="py-16 bg-[#07020F] bg-grid-2070 text-white border-t border-purple-500/20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div>
                <p className="text-xs font-bold text-[#FACC15] mb-1">
                  {isRtl ? 'خدمة العملاء والمبيعات الصناعية' : 'Industrial Sales & Support'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {isRtl ? 'تواصل معنا لطلبات التسعير والدعم الفني' : 'Contact Us for Quotations & Support'}
                </h2>
                <p className="text-sm text-purple-200/80 mt-2 leading-relaxed">
                  {isRtl
                    ? 'اطلب عرض سعر رسمي بالطن أو الكونتينر، أو استشر مهندسي البوليمر لاختيار الخامة المثالية لخط الإنتاج.'
                    : 'Request bulk ton/container quotations, submit support tickets, or consult our polymer engineers.'}
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-[#120726]/85 border border-purple-500/20 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#FACC15] shrink-0" />
                  <span>{isRtl ? settings?.addressAr : settings?.addressEn}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#120726]/85 border border-purple-500/20 flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#FACC15] shrink-0" />
                  <span className="font-mono-tech" dir="ltr">
                    {settings?.supportPhone || '+20 100 245 8900'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#120726]/85 border border-purple-500/20 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#FACC15] shrink-0" />
                  <span className="font-mono-tech">{settings?.supportEmail || 'sales@kingplast-eg.com'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#120726]/90 backdrop-blur-xl text-white rounded-3xl border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
              {ticketResult ? (
                <div className="py-10 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#FACC15] mx-auto" />
                  <h3 className="text-lg font-black">
                    {isRtl ? 'تم استلام رسالتك بنجاح' : 'Inquiry Received Successfully'}
                  </h3>
                  <p className="text-sm font-mono-tech font-bold text-[#FACC15]">{ticketResult}</p>
                  <p className="text-xs text-purple-200">
                    {isRtl
                      ? 'سيقوم فريق المبيعات أو الدعم الفني بالرد عليك في أقرب وقت.'
                      : 'Our sales/support team will respond shortly.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTicketResult(null)}
                    className="px-5 py-2.5 rounded-xl bg-[#FACC15] text-[#07020F] text-xs font-extrabold cursor-pointer"
                  >
                    {isRtl ? 'إرسال استفسار آخر' : 'Send Another Inquiry'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'inquiry', ar: 'طلب تسعير / استفسار تجاري', en: 'Commercial Inquiry' },
                      { id: 'support', ar: 'تذكرة دعم فني', en: 'Support Ticket' },
                      { id: 'report', ar: 'بلاغ أو شكوى', en: 'Submit Report' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setType(opt.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                          type === opt.id
                            ? 'bg-[#FACC15] text-[#07020F] border-[#FACC15]'
                            : 'bg-[#07020F] text-purple-200 border-purple-500/25 hover:text-white'
                        }`}
                      >
                        {isRtl ? opt.ar : opt.en}
                      </button>
                    ))}
                  </div>

                  {errMsg && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs">
                      {errMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isRtl ? 'الاسم الكامل *' : 'Full Name *'}
                      className="h-10 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs sm:text-sm text-white placeholder-purple-400/60"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isRtl ? 'البريد الإلكتروني *' : 'Email Address *'}
                      className="h-10 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs sm:text-sm text-white placeholder-purple-400/60"
                    />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isRtl ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}
                      className="h-10 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs sm:text-sm text-white placeholder-purple-400/60"
                    />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={isRtl ? 'اسم المصنع / الشركة' : 'Company / Factory Name'}
                      className="h-10 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs sm:text-sm text-white placeholder-purple-400/60"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={isRtl ? 'الموضوع / الخامة المطلوبة والكمية *' : 'Subject / Required Material & Quantity *'}
                    className="w-full h-10 px-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs sm:text-sm text-white placeholder-purple-400/60"
                  />

                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isRtl
                        ? 'اكتب تفاصيل الطلب أو المواصفات المطلوبة (MFI، اللون، التعبئة، عنوان التسليم)...'
                        : 'Write your inquiry or technical requirements...'
                    }
                    className="w-full p-3 rounded-xl bg-[#07020F] border border-purple-500/30 text-xs sm:text-sm text-white placeholder-purple-400/60 resize-none"
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#07020F] font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting
                        ? isRtl
                          ? 'جاري الإرسال...'
                          : 'Sending...'
                        : isRtl
                        ? 'إرسال الطلب الآن'
                        : 'Submit Request'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
