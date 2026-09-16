import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TiLocationArrow } from "react-icons/ti";
import { apiUrl } from "../lib/apiBase.js";

const MAX_LEN = 2000;

const WELCOME = {
  role: "assistant",
  content: "你好呀～我是博客小精灵，有什么想聊的尽管说！",
  isWelcome: true,
};

const ChatPage = () => {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [quota, setQuota] = useState({
    limit: 10,
    used: 0,
    remaining: 10,
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
          pageTitle: "博客小精灵",
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
          content: "网络出了点小问题，请稍后再试～",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
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

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#fff8f1_0%,#ffeef5_48%,#f6fbff_100%)]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-24 pb-4 md:px-10 md:pt-28">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#b8a8af]">
            AI Assistant
          </p>
          <h1 className="mt-2 text-2xl font-black text-[#241322] md:text-3xl">
            博客小精灵
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              quota.chatEnabled
                ? "border-[#ff8fab]/30 bg-[#ff8fab]/10 text-[#b76e79]"
                : "border-red-400/30 bg-red-400/10 text-red-500"
            }`}
          >
            {quota.chatEnabled ? "在线" : "未配置"}
          </span>
          <span className="rounded-full border border-[#ff8fab]/20 bg-white/60 px-3 py-1 text-xs text-[#8a7680]">
            今日剩余 {remainingText}
          </span>
          <Link
            to="/"
            className="rounded-full border border-[#ff8fab]/20 bg-white/60 px-4 py-1 text-xs font-semibold text-[#5f4b52] transition hover:bg-white/90"
          >
            返回首页
          </Link>
        </div>
      </header>

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
            <div className="flex items-center gap-2 text-[#b8a8af]">
              <div className="three-body">
                <div className="three-body__dot" />
                <div className="three-body__dot" />
                <div className="three-body__dot" />
              </div>
              <span className="text-sm">小精灵正在思考...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#ff8fab]/12 bg-[#fffaf3]/80 px-4 py-4 backdrop-blur-md md:px-10">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <div className="flex flex-1 items-end rounded-2xl border border-[#ff8fab]/15 bg-white/70 px-4 py-2.5 shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={MAX_LEN}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-[#241322] placeholder:text-[#b8a8af] focus:outline-none"
              style={{
                height: "auto",
                overflow: input.length > 80 ? "auto" : "hidden",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
              }}
            />
            <span className="ml-2 shrink-0 text-[10px] text-[#b8a8af]">
              {input.length}/{MAX_LEN}
            </span>
          </div>
          <button
            onClick={send}
            disabled={!input.trim() || sending || !quota.chatEnabled}
            className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-[#241322] px-5 text-sm font-bold text-[#fffaf3] transition hover:bg-[#3a1f33] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <TiLocationArrow />
            发送
          </button>
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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8fab] to-[#7c5cff] text-xs font-bold text-white shadow-sm">
          精
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-[#241322] text-[#fffaf3]"
            : isError
              ? "border border-red-300/40 bg-red-50 text-red-600"
              : isWelcome
                ? "border border-[#ff8fab]/25 bg-[#ff8fab]/8 text-[#b76e79]"
                : "border border-[#ff8fab]/12 bg-white/70 text-[#241322]"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
      </div>
      {isUser && (
        <div className="ml-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#241322] text-xs font-bold text-[#fffaf3]">
          我
        </div>
      )}
    </div>
  );
};

export default ChatPage;
