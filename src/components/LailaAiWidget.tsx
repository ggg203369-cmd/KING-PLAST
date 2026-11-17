import React, { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircleHeart, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const DEFAULT_LAILA_AVATAR = '/src/assets/images/laila_ai_avatar_1794909558706.jpg';

export const LailaAiWidget: React.FC = () => {
  const { isRtl, language, aiAssistant } = useMarketplace();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listEndRef = useRef<HTMLDivElement>(null);

  const name = isRtl
    ? aiAssistant?.nameAr || 'ليلي'
    : aiAssistant?.nameEn || 'Laila';
  const avatarUrl = aiAssistant?.avatarUrl || DEFAULT_LAILA_AVATAR;
  const greeting = isRtl
    ? aiAssistant?.greetingAr ||
      'أهلاً بك يا روحي في الكينج بلاست 💜 أنا ليلي، رفيقتك اللطيفة هنا.. قولي بتدور على أي خامة بلاستيك أو حابب نحكي سوا، وأنا تحت أمرك بكل حب واهتمام.'
    : aiAssistant?.greetingEn ||
      'Welcome, sweetheart, to KING PLAST 💜 I am Laila, your warm companion here. How can I brighten your day and help you with plastic raw materials?';

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'model', text: greeting }]);
    }
  }, [greeting, messages.length]);

  useEffect(() => {
    if (open) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, sending]);

  // If Super Admin explicitly disabled AI for visitors, hide or show paused state cleanly
  const isEnabled = aiAssistant ? aiAssistant.enabled : true;
  if (!isEnabled) {
    return null;
  }

  const sendMessage = async (textToSend?: string) => {
    const content = (textToSend ?? input).trim();
    if (!content || sending) return;

    setErrorMsg(null);
    const nextHistory = [...messages];
    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', text: content }];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: nextHistory.slice(1), // skip static initial greeting when passing history
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'تعذر الاتصال بليلي حالياً');
      }
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSending(false);
    }
  };

  const quickSuggestions = isRtl
    ? [
        'رشحي لي أفضل خامة PP للحقن',
        'إيه أنواع HDPE المتاحة عندكم؟',
        'محتاج طلب تسعير بالطن',
        'كلامك لطيف جداً يا ليلي 💜',
      ]
    : [
        'Recommend PP grade for injection',
        'What HDPE grades are available?',
        'How do I request a bulk quote?',
        'You are so sweet, Laila 💜',
      ];

  return (
    <div className="fixed bottom-5 start-5 z-40">
      {/* Floating Chat Drawer */}
      {open && (
        <div
          className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[390px] h-[540px] max-h-[78vh] rounded-3xl bg-[#0E051E]/95 backdrop-blur-xl border border-[#D4AF37]/50 shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-label={name}
        >
          {/* Header with Laila's portrait */}
          <div className="bg-gradient-to-r from-[#07020F] via-[#240B4C] to-[#4C1D95] text-white p-4 flex items-center justify-between gap-3 border-b border-purple-500/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#FACC15] shadow-md shrink-0">
                <img
                  src={avatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white truncate">{name}</h3>
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
                </div>
                <p className="text-[11px] text-[#FACC15] truncate">
                  {isRtl ? 'رفيقتك الذكية واللطيفة في الكينج بلاست' : 'Your Sweet AI Companion · KING PLAST'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMessages([{ role: 'model', text: greeting }]);
                  setErrorMsg(null);
                }}
                title={isRtl ? 'محادثة جديدة' : 'Reset chat'}
                className="p-2 rounded-xl hover:bg-white/10 text-purple-200 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title={isRtl ? 'إغلاق' : 'Close'}
                className="p-2 rounded-xl hover:bg-white/10 text-purple-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#07020F]/90">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <img
                      src={avatarUrl}
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover object-top border border-[#D4AF37]/60 shrink-0"
                    />
                  )}
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-[#4C1D95] text-white rounded-be-none shadow-sm'
                        : 'bg-[#120726] text-purple-50 border border-purple-500/25 rounded-bs-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-end gap-2 justify-start">
                <img
                  src={avatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover object-top border border-[#D4AF37]/60 shrink-0"
                />
                <div className="px-4 py-2.5 rounded-2xl bg-[#120726] border border-purple-500/25 text-xs text-[#FACC15] font-semibold">
                  {isRtl ? `${name} تكتب لكِ بكل حب...` : `${name} is typing warmly...`}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div ref={listEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-[#0E051E] border-t border-purple-500/20 flex gap-1.5 overflow-x-auto">
              {quickSuggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-[#120726] hover:bg-[#4C1D95] border border-purple-500/30 text-[11px] font-semibold text-purple-100 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Message Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-[#0E051E] border-t border-purple-500/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRtl ? `اكتب رسالتك لـ ${name}...` : `Write warmly to ${name}...`}
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#07020F] border border-purple-500/30 focus:border-[#FACC15] focus:outline-none text-xs text-white placeholder-purple-400/60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="h-10 px-3.5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-50 text-[#07020F] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Button with Laila's Portrait */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-3 ps-2 pe-4 py-2 rounded-full bg-[#120726]/95 backdrop-blur-xl hover:bg-[#240B4C] text-white border border-[#D4AF37]/70 shadow-2xl transition-all hover:-translate-y-0.5 cursor-pointer"
      >
        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#FACC15] shrink-0">
          <img
            src={avatarUrl}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="text-start">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-white">{name}</span>
            <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
          </div>
          <span className="block text-[11px] text-purple-200">
            {isRtl ? 'تحدث مع ليلي الآن 💜' : 'Chat with Laila 💜'}
          </span>
        </div>
        <MessageCircleHeart className="w-5 h-5 text-[#FACC15] hidden sm:block" />
      </button>
    </div>
  );
};
