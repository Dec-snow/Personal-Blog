import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TiLocationArrow } from "react-icons/ti";
import { apiUrl } from "../lib/apiBase.js";

const MAX_LEN = 2000;

const WELCOME = {
  role: "assistant",
  content: "你好呀～我是博客小精灵，有什么想聊的尽管说！(｡･ω･｡)ﾉ♡",
  isWelcome: true,
};

// 快捷问题（二次元风格）
const QUICK_QUESTIONS = [
  "给我讲个冷笑话吧～",
  "今天天气怎么样？",
  "推荐几部好看的番剧",
  "你觉得什么是温柔呢？",
];

const ChatPage = () => {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [quota, setQuota] = useState({
    limit: 5,
    used: 0,
    remaining: 5,
    isLogin: false,
    unlimited: false,
    chatEnabled: true,
  });

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const node = scrollRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetch(apiUrl("/api/chat"))
      .then((r) => r.json())
      .then((d) => setQuota(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    if (msg.length > MAX_LEN) return;

    const userMsg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          pageUrl: window.location.href,
          pageTitle: "博客助手",
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message, isError: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }

      if (data.limit !== undefined) {
        setQuota((prev) => ({
          ...prev,
          limit: data.limit,
          used: data.used,
          remaining: data.remaining,
          isLogin: data.isLogin,
          unlimited: data.unlimited,
          chatEnabled: data.chatEnabled ?? prev.chatEnabled,
        }));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "网络出了点小问题，请稍后再试～(＞﹏＜)",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const sendQuick = (q) => {
    setInput(q);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const remainingText = quota.unlimited
    ? "无限"
    : `${quota.remaining}/${quota.limit}`;

  const quotaPct = quota.unlimited
    ? 100
    : quota.limit > 0
      ? Math.max(0, Math.min(100, (quota.remaining / quota.limit) * 100))
      : 100;

  const quotaLow = !quota.unlimited && quota.limit > 0 && quota.remaining <= 2;
  const quotaExhausted = !quota.unlimited && quota.limit > 0 && quota.remaining <= 0;

  // 樱花花瓣 - 更多花瓣，更丰富的颜色
  const sakuraPetals = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      animationDuration: `${7 + Math.random() * 8}s`,
      animationDelay: `${Math.random() * 10}s`,
      transform: `scale(${0.5 + Math.random() * 1})`,
    },
    color: ["#ffb7c5", "#ffc8d4", "#ffd9e0", "#ff9eb5", "#ff8fab"][i % 5],
    opacity: 0.3 + Math.random() * 0.35,
  }));

  // 星星闪烁
  const sparkles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    style: {
      left: `${5 + Math.random() * 90}%`,
      top: `${5 + Math.random() * 90}%`,
      animationDuration: `${2 + Math.random() * 3}s`,
      animationDelay: `${Math.random() * 3}s`,
    },
    size: 4 + Math.random() * 6,
  }));

  return (
    <div className="chat-sakura-page">
      {/* 粉樱渐变背景 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #FFF0F5 0%, #FFE4EC 15%, #FFD9E6 30%, #FFE8F0 50%, #FFF5F8 70%, #FFF0F5 85%, #FFE4EC 100%)",
        }}
      />

      {/* 樱花花瓣飘落 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {sakuraPetals.map((p) => (
          <span
            key={p.id}
            className="animate-sakura-fall absolute"
            style={p.style}
          >
            <svg width="18" height="18" viewBox="0 0 20 20">
              <g fill={p.color} opacity={p.opacity}>
                <ellipse cx="10" cy="5" rx="3" ry="4.5" />
                <ellipse cx="15" cy="8.5" rx="3" ry="4.5" transform="rotate(72 15 8.5)" />
                <ellipse cx="13" cy="14.5" rx="3" ry="4.5" transform="rotate(144 13 14.5)" />
                <ellipse cx="7" cy="14.5" rx="3" ry="4.5" transform="rotate(-144 7 14.5)" />
                <ellipse cx="5" cy="8.5" rx="3" ry="4.5" transform="rotate(-72 5 8.5)" />
                <circle cx="10" cy="10" r="1.5" fill="#fff" opacity="0.6" />
              </g>
            </svg>
          </span>
        ))}
      </div>

      {/* 星星闪烁 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="animate-sparkle absolute"
            style={s.style}
          >
            <svg width={s.size} height={s.size} viewBox="0 0 20 20">
              <path
                d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
                fill="#fff"
                opacity="0.8"
              />
            </svg>
          </span>
        ))}
      </div>

      {/* 浮动光晕 */}
      <div
        className="animate-sakura-glow pointer-events-none absolute -left-16 top-1/4 size-72 rounded-full bg-[#ffb7c5]/30 blur-[60px]"
      />
      <div
        className="animate-sakura-glow pointer-events-none absolute -right-10 bottom-1/3 size-64 rounded-full bg-[#ffd9e0]/40 blur-[50px]"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="animate-sakura-glow pointer-events-none absolute left-1/4 bottom-20 size-48 rounded-full bg-[#ffc8d4]/25 blur-[40px]"
        style={{ animationDelay: "1s" }}
      />

      {/* 日文水印装饰 */}
      <div className="pointer-events-none absolute right-6 top-28 select-none">
        <span
          className="text-[120px] font-black leading-none text-[#ffb7c5]/10"
          style={{ fontFamily: "'ZCOOL XiaoWei', serif" }}
        >
          桜
        </span>
      </div>
      <div className="pointer-events-none absolute left-8 bottom-32 select-none">
        <span
          className="text-[80px] font-black leading-none text-[#ffc8d4]/10"
          style={{ fontFamily: "'ZCOOL XiaoWei', serif" }}
        >
          春
        </span>
      </div>

      {/* 内容区 */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-24 pb-4 md:px-10 md:pt-28">
          <div className="flex items-center gap-3">
            {/* 助手头像 — 二次元萌系风格 */}
            <div className="chat-sakura-avatar animate-float-slow">
              <svg width="48" height="48" viewBox="0 0 60 60">
                {/* 脸 */}
                <ellipse cx="30" cy="32" rx="18" ry="17" fill="#FFF5F8" stroke="#FFB7C5" strokeWidth="1.5" />
                {/* 头发 - 刘海 */}
                <path d="M14 26 Q16 12 30 10 Q44 12 46 26 Q44 22 38 22 Q36 16 30 15 Q24 16 22 22 Q16 22 14 26 Z" fill="#FFB7C5" />
                {/* 头发 - 两侧 */}
                <ellipse cx="14" cy="34" rx="4" ry="10" fill="#FFB7C5" />
                <ellipse cx="46" cy="34" rx="4" ry="10" fill="#FFB7C5" />
                {/* 眼睛 */}
                <ellipse cx="23" cy="33" rx="3.5" ry="4.5" fill="#FF8FAB" />
                <ellipse cx="37" cy="33" rx="3.5" ry="4.5" fill="#FF8FAB" />
                <circle cx="24" cy="32" r="1.2" fill="#fff" />
                <circle cx="38" cy="32" r="1.2" fill="#fff" />
                {/* 腮红 */}
                <ellipse cx="19" cy="39" rx="3" ry="1.5" fill="#FFB7C5" opacity="0.5" />
                <ellipse cx="41" cy="39" rx="3" ry="1.5" fill="#FFB7C5" opacity="0.5" />
                {/* 嘴巴 - 微笑 */}
                <path d="M27 41 Q30 44 33 41" stroke="#FF8FAB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* 头顶小花装饰 */}
                <g transform="translate(30, 8)">
                  <circle cx="0" cy="-3" r="2.5" fill="#fff" />
                  <circle cx="-3" cy="0" r="2.5" fill="#fff" />
                  <circle cx="3" cy="0" r="2.5" fill="#fff" />
                  <circle cx="0" cy="0" r="1.5" fill="#FFD43B" />
                </g>
              </svg>
            </div>
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#FF8FAB]/60"
                style={{ fontFamily: "'ZCOOL XiaoWei', serif" }}
              >
                ✦ 桜の精霊 ✦
              </p>
              <h1
                className="mt-1 text-2xl font-black md:text-3xl"
                style={{
                  background: "linear-gradient(135deg, #FF6B9D 0%, #FF8FAB 50%, #FFB7C5 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                博客小精灵
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                quota.chatEnabled
                  ? "border-[#FF8FAB]/30 bg-white/60 text-[#FF6B9D]"
                  : "border-red-400/30 bg-red-400/10 text-red-400"
              }`}
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle animate-pulse" />
              {quota.chatEnabled ? "在线中" : "未配置"}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs backdrop-blur-sm ${
                quotaExhausted
                  ? "border-red-400/30 bg-red-400/8 text-red-400"
                  : quotaLow
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-500"
                    : "border-[#FFB7C5]/40 bg-white/50 text-[#FF8FAB]"
              }`}
            >
              ✿ 今日剩余 {remainingText}
            </span>
            <Link
              to="/"
              className="rounded-full border border-[#FFB7C5]/40 bg-white/60 px-4 py-1 text-xs font-semibold text-[#FF6B9D] backdrop-blur-sm transition hover:border-[#FF8FAB]/60 hover:bg-white/80 hover:shadow-lg hover:shadow-[#FFB7C5]/20"
            >
              🏠 返回首页
            </Link>
          </div>
        </header>

        {/* 次数进度条 */}
        {!quota.unlimited && quota.limit > 0 && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-4 md:px-10">
            <div className="h-[4px] overflow-hidden rounded-full bg-[#FFB7C5]/20">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${quotaPct}%`,
                  background: quotaExhausted
                    ? "linear-gradient(90deg, #ff6b6b, #ee5a5a)"
                    : quotaLow
                      ? "linear-gradient(90deg, #ffd93d, #ffb347)"
                      : "linear-gradient(90deg, #FF6B9D, #FFB7C5, #FFD4E0)",
                }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pb-4 md:px-10"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-[#FF8FAB]/60">
                <div className="sakura-typing">
                  <div className="sakura-typing__dot" />
                  <div className="sakura-typing__dot" />
                  <div className="sakura-typing__dot" />
                </div>
                <span className="text-sm">小精灵思考中...(〃'▽'〃)</span>
              </div>
            )}
          </div>
        </div>

        {/* 快捷问题 */}
        {messages.length <= 1 && (
          <div className="mx-auto w-full max-w-3xl px-4 md:px-10">
            <p className="mb-2 text-xs text-[#FF8FAB]/60">
              ✨ 试试问这些问题吧～
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendQuick(q)}
                  className="rounded-full border border-[#FFB7C5]/40 bg-white/60 px-3 py-1.5 text-xs text-[#FF6B9D] backdrop-blur-sm transition hover:border-[#FF8FAB]/60 hover:bg-white/90 hover:shadow-md hover:shadow-[#FFB7C5]/20"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[#FFB7C5]/30 bg-white/50 px-4 py-4 backdrop-blur-md md:px-10">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="flex flex-1 items-end rounded-2xl border border-[#FFB7C5]/40 bg-white/80 px-4 py-2.5 shadow-lg shadow-[#FFB7C5]/10 backdrop-blur-sm transition focus-within:border-[#FF8FAB]/60 focus-within:shadow-xl focus-within:shadow-[#FFB7C5]/20">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={MAX_LEN}
                placeholder="输入消息，Enter 发送，Shift+Enter 换行 ♪(´▽｀)"
                className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-[#4A4A4A] placeholder:text-[#FFB7C5]/60 focus:outline-none"
                style={{
                  height: "auto",
                  overflow: input.length > 80 ? "auto" : "hidden",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
              <span className="ml-2 shrink-0 text-[10px] text-[#FFB7C5]/60">
                {input.length}/{MAX_LEN}
              </span>
            </div>
            <button
              onClick={send}
              disabled={!input.trim() || sending || !quota.chatEnabled}
              className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-[#FF8FAB]/30 bg-gradient-to-br from-[#FF8FAB] to-[#FF6B9D] px-5 text-sm font-bold text-white shadow-lg shadow-[#FFB7C5]/30 transition hover:from-[#FF6B9D] hover:to-[#FF8FAB] hover:shadow-xl hover:shadow-[#FFB7C5]/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <TiLocationArrow />
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  const isError = msg.isError;
  const isWelcome = msg.isWelcome;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}>
      {!isUser && (
        <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#FFB7C5]/40 bg-white/80 shadow-md shadow-[#FFB7C5]/10 backdrop-blur-sm">
          <svg width="18" height="18" viewBox="0 0 60 60">
            <ellipse cx="30" cy="32" rx="18" ry="17" fill="#FFF5F8" />
            <path d="M14 26 Q16 12 30 10 Q44 12 46 26 Q44 22 38 22 Q36 16 30 15 Q24 16 22 22 Q16 22 14 26 Z" fill="#FFB7C5" />
            <ellipse cx="23" cy="33" rx="3" ry="3.5" fill="#FF8FAB" />
            <ellipse cx="37" cy="33" rx="3" ry="3.5" fill="#FF8FAB" />
            <circle cx="24" cy="32" r="0.8" fill="#fff" />
            <circle cx="38" cy="32" r="0.8" fill="#fff" />
            <path d="M27 41 Q30 44 33 41" stroke="#FF8FAB" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed backdrop-blur-sm ${
          isUser
            ? "border border-[#FF8FAB]/30 bg-gradient-to-br from-[#FF8FAB] to-[#FF6B9D] text-white shadow-lg shadow-[#FFB7C5]/20"
            : isError
              ? "border border-red-300/40 bg-red-50/80 text-red-500"
              : isWelcome
                ? "border border-[#FFB7C5]/40 bg-white/80 text-[#FF6B9D] shadow-md shadow-[#FFB7C5]/10"
                : "border border-[#FFE4EC]/60 bg-white/85 text-[#4A4A4A] shadow-md shadow-[#FFB7C5]/10"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
      </div>
      {isUser && (
        <div className="ml-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#FFB7C5]/30 bg-white/60 text-xs font-bold text-[#FF8FAB] backdrop-blur-sm">
          我
        </div>
      )}
    </div>
  );
};

export default ChatPage;
