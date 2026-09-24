import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TiLocationArrow } from "react-icons/ti";
import { apiUrl } from "../lib/apiBase.js";

const MAX_LEN = 2000;

const AVATAR_URL =
  "https://my-blog-static-1464122491.cos.ap-guangzhou.myqcloud.com/%E5%A4%B4%E5%83%8F/02.jpg";

const WELCOME = {
  role: "assistant",
  content: "欢迎光临星光咖啡馆~我是夏目。今天想聊些什么呢？请慢用。",
  isWelcome: true,
};

const QUICK_QUESTIONS = [
  "推荐一杯好喝的咖啡",
  "最近有什么有趣的事？",
  "你会做什么甜点？",
  "讲个温暖的故事吧",
];

const Petal = ({ i }) => {
  const colors = ["#e8f0fa", "#f0f4fc", "#e0eaf5", "#f5f0ff"];
  const c = colors[i % colors.length];
  const left = (i * 5.5 + 3) % 100;
  const delay = (i * 1.3) % 8;
  const dur = 9 + (i % 4) * 2;
  const size = 6 + (i % 3) * 3;
  return (
    <span
      className="animate-petal-fall"
      style={{
        left: `${left}%`,
        animationDuration: `${dur}s`,
        animationDelay: `${delay}s`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(ellipse at center, ${c} 0%, transparent 70%)`,
        borderRadius: "50% 0 50% 50%",
        opacity: 0.4,
      }}
    />
  );
};

const Sparkle = ({ i }) => {
  const pos = [
    { l: 10, t: 8 },
    { l: 88, t: 12 },
    { l: 25, t: 75 },
    { l: 70, t: 82 },
    { l: 50, t: 5 },
    { l: 92, t: 55 },
  ][i] || { l: 50, t: 50 };
  return (
    <span
      className="animate-sparkle-pure"
      style={{
        left: `${pos.l}%`,
        top: `${pos.t}%`,
        width: "4px",
        height: "4px",
        background:
          "radial-gradient(circle, rgba(255,215,130,0.6) 0%, transparent 70%)",
        borderRadius: "50%",
      }}
    />
  );
};

const Avatar = ({ size, url, alt, onError }) => (
  <div
    className={`chat-pure-avatar${size === "mini" ? " chat-pure-avatar-mini" : ""}`}
  >
    <img
      src={url}
      alt={alt}
      loading="eager"
      width={size === "mini" ? 32 : 56}
      height={size === "mini" ? 32 : 56}
      className="h-full w-full rounded-full object-cover"
      style={{ objectPosition: size === "mini" ? "center 20%" : "center top" }}
      onError={onError}
    />
  </div>
);

const ChatPage = () => {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
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

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
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
          content: "抱歉，似乎连接出了点问题...请稍后再试一次吧~",
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
    setTimeout(() => inputRef.current?.focus(), 50);
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
  const quotaExhausted =
    !quota.unlimited && quota.limit > 0 && quota.remaining <= 0;

  const avatarUrl = avatarError
    ? ""
    : AVATAR_URL;

  return (
    <div className="chat-pure-page">
      {/* 白色清纯渐变背景 */}
      <div className="chat-pure-bg" />

      {/* 单个暖色光晕 */}
      <div className="chat-pure-glow animate-pure-glow" />

      {/* 花瓣飘落 — 精简为 10 片 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 10 }, (_, i) => (
          <Petal key={i} i={i} />
        ))}
      </div>

      {/* 光点闪烁 — 精简为 6 个 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Sparkle key={i} i={i} />
        ))}
      </div>

      {/* 底部柔和渐变 */}
      <div className="chat-pure-bottom-fade" />

      {/* 日文水印 — 仅保留一个 */}
      <div className="pointer-events-none absolute right-6 top-28 select-none">
        <span
          className="text-[100px] font-black leading-none"
          style={{
            fontFamily: "'ZCOOL XiaoWei', serif",
            color: "rgba(100,130,180,0.06)",
          }}
        >
          星
        </span>
      </div>

      {/* 内容区 */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-5 pt-24 pb-4 md:px-10 md:pt-28">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <Avatar
                size="large"
                url={avatarUrl}
                alt="夏目 — 博客助手头像"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="chat-pure-avatar">
                <span className="chat-pure-avatar-fallback">夏</span>
              </div>
            )}
            <div>
              <p className="chat-pure-subtitle">
                ✦ ひだまりのカフェ ✦
              </p>
              <h1 className="chat-pure-title">星光咖啡馆</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span
              className={`chat-pure-badge ${
                quota.chatEnabled
                  ? "chat-pure-badge--active"
                  : "chat-pure-badge--error"
              }`}
            >
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle animate-pulse" />
              {quota.chatEnabled ? "营业中" : "未配置"}
            </span>
            <span
              className={`chat-pure-badge ${
                quotaExhausted
                  ? "chat-pure-badge--error"
                  : quotaLow
                    ? "chat-pure-badge--warn"
                    : "chat-pure-badge--active"
              }`}
            >
              ✦ 今日剩余 {remainingText}
            </span>
            <Link
              to="/"
              className="chat-pure-link"
            >
              返回首页
            </Link>
          </div>
        </header>

        {/* 次数进度条 */}
        {!quota.unlimited && quota.limit > 0 && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-4 md:px-10">
            <div className="h-[3px] overflow-hidden rounded-full bg-blue-100/50">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${quotaPct}%`,
                  background: quotaExhausted
                    ? "linear-gradient(90deg, #e57373, #c62828)"
                    : quotaLow
                      ? "linear-gradient(90deg, #ffb74d, #ff8a65)"
                      : "linear-gradient(90deg, #4a6ba8, #6a8aca)",
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
              <MessageBubble
                key={i}
                msg={msg}
                avatarUrl={avatarUrl}
                onAvatarError={() => setAvatarError(true)}
              />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-blue-600/50">
                <div className="pure-typing">
                  <div className="pure-typing__dot" />
                  <div className="pure-typing__dot" />
                  <div className="pure-typing__dot" />
                </div>
                <span className="text-sm">正在准备回复...</span>
              </div>
            )}
          </div>
        </div>

        {/* 快捷问题 */}
        {messages.length <= 1 && (
          <div className="mx-auto w-full max-w-3xl px-4 md:px-10">
            <p className="chat-pure-hint">✦ 试试这些话题吧</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendQuick(q)}
                  className="chat-pure-quick-btn"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="chat-pure-input-bar">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="chat-pure-input-wrap">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={MAX_LEN}
                placeholder="说点什么吧~ Enter 发送，Shift+Enter 换行"
                aria-label="输入消息"
                className="chat-pure-textarea"
                style={{
                  height: "auto",
                  overflow: input.length > 80 ? "auto" : "hidden",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
              <span className="ml-2 shrink-0 text-[10px] text-blue-700/30">
                {input.length}/{MAX_LEN}
              </span>
            </div>
            <button
              onClick={send}
              disabled={!input.trim() || sending || !quota.chatEnabled || quotaExhausted}
              aria-label="发送消息"
              className="chat-pure-send-btn"
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

const MessageBubble = ({ msg, avatarUrl, onAvatarError }) => {
  const isUser = msg.role === "user";
  const isError = msg.isError;
  const isWelcome = msg.isWelcome;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}
    >
      {!isUser && (
        <div className="mr-3 mt-1 shrink-0">
          {avatarUrl ? (
            <Avatar
              size="mini"
              url={avatarUrl}
              alt="夏目"
              onError={onAvatarError}
            />
          ) : (
            <div className="chat-pure-avatar chat-pure-avatar-mini">
              <span className="chat-pure-avatar-fallback">夏</span>
            </div>
          )}
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "chat-pure-bubble--user"
            : isError
              ? "chat-pure-bubble--error"
              : isWelcome
                ? "chat-pure-bubble--welcome"
                : "chat-pure-bubble--assistant"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
      </div>
      {isUser && (
        <div className="chat-pure-user-avatar ml-3 mt-1">我</div>
      )}
    </div>
  );
};

export default ChatPage;
