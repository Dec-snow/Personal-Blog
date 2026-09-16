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
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#1a1330_0%,#241322_40%,#1a1330_100%)]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-24 pb-4 md:px-10 md:pt-28">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-pink-100/60">
            AI Assistant
          </p>
          <h1 className="mt-2 text-2xl font-black text-[#ffe7ef] md:text-3xl">
            博客小精灵
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              quota.chatEnabled
                ? "border-green-400/30 bg-green-400/10 text-green-300"
                : "border-red-400/30 bg-red-400/10 text-red-300"
            }`}
          >
            {quota.chatEnabled ? "在线" : "未配置"}
          </span>
          <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-blue-50/70">
            今日剩余 {remainingText}
          </span>
          <Link
            to="/"
            className="rounded-full border border-white/15 bg-white/8 px-4 py-1 text-xs font-semibold text-blue-50/80 transition hover:bg-white/15"
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
            <div className="flex items-center gap-2 text-blue-50/50">
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
      <div className="border-t border-white/8 bg-[#241322]/80 px-4 py-4 backdrop-blur-md md:px-10">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <div className="flex flex-1 items-end rounded-2xl border border-white/12 bg-white/6 px-4 py-2.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={MAX_LEN}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-[#ffe7ef] placeholder:text-blue-50/30 focus:outline-none"
              style={{
                height: "auto",
                overflow: input.length > 80 ? "auto" : "hidden",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
              }}
            />
            <span className="ml-2 shrink-0 text-[10px] text-blue-50/30">
              {input.length}/{MAX_LEN}
            </span>
          </div>
          <button
            onClick={send}
            disabled={!input.trim() || sending || !quota.chatEnabled}
            className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-[#ffe7ef] px-5 text-sm font-bold text-[#241322] transition disabled:cursor-not-allowed disabled:opacity-30"
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
        <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6BAA] to-[#7C5CFF] text-xs font-bold text-white">
          精
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[#ffe7ef] text-[#241322]"
            : isError
              ? "border border-red-400/25 bg-red-400/8 text-red-200"
              : isWelcome
                ? "border border-pink-300/20 bg-pink-300/8 text-pink-100"
                : "border border-white/10 bg-white/6 text-blue-50/90"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
      </div>
      {isUser && (
        <div className="ml-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-xs font-bold text-blue-50/60">
          我
        </div>
      )}
    </div>
  );
};

export default ChatPage;
