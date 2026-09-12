import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

function FloatingAIAssistant({ onOpenChange }) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: t("assistant.floatingWelcome"),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: t("assistant.floatingWelcome") }];
      }
      return prev;
    });
  }, [i18n.language, t]);

  const openAssistant = () => {
    setIsOpen(true);
    onOpenChange(true);
  };

  const closeAssistant = () => {
    setIsOpen(false);
    onOpenChange(false);
  };

  const sendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmedMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          language: i18n.language,
        }),
      });

      if (!response.ok) {
        if (response.status === 502) {
          throw new Error(
            "AI service is temporarily unavailable. Please try again in a moment."
          );
        } else if (response.status === 503) {
          throw new Error(
            "AI service is currently overloaded. Please try again later."
          );
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Authentication failed. Please check your connection and try again."
          );
        } else {
          throw new Error(`AI service error: ${response.status}`);
        }
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response ||
            data.message ||
            t("assistant.noResponse"),
        },
      ]);
    } catch (error) {
      console.error("AI Assistant Error:", error);

      let errorMessage = t("assistant.connectionError");

      if (error.message && error.message !== "Failed to fetch") {
        errorMessage = error.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Ask AI Button */}
      {!isOpen && (
        <button
          onClick={openAssistant}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition-all duration-200 hover:-translate-y-1 hover:bg-brand-700 hover:shadow-xl"
          aria-label={t("assistant.floatingOpen")}
        >
          <Bot size={21} strokeWidth={2.2} />
          <span>{t("assistant.floatingButton")}</span>
        </button>
      )}

      {/* AI Side Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 flex h-dvh w-[400px] max-w-[90vw] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out box-border ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white box-border border-b border-brand-800/50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600">
              <Bot size={19} strokeWidth={2.2} />
            </div>

            <div>
              <p className="text-sm font-semibold">{t("assistant.title")}</p>
              <p className="text-[11px] text-slate-300">{t("assistant.floatingSubtitle")}</p>
            </div>
          </div>

          <button
            onClick={closeAssistant}
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t("assistant.floatingClose")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar bg-[#F9F7F7] p-4 box-border">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Bot size={15} strokeWidth={2.2} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user"
                    ? "rounded-br-md bg-brand-600 text-white whitespace-pre-wrap"
                    : msg.isError
                      ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700 shadow-sm"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                  }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                {t("assistant.thinking")}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 box-border">
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2 py-1.5 focus-within:border-brand-500">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("assistant.inputPlaceholder")}
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-50"
            />

            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t("assistant.send")}
            >
              <Send size={16} />
            </button>
          </div>

          <p className="mt-2 text-center text-[10px] text-slate-400">
            {t("assistant.floatingDisclaimer")}
          </p>
        </div>
      </div>
    </>
  );
}

export default FloatingAIAssistant;