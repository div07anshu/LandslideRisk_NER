import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

import SectionHeader from "../common/SectionHeader";
import Card from "../common/Card";

import ChatBubble from "../components/assistant/ChatBubble";
import TypingIndicator from "../components/assistant/TypingIndicator";
import ChatInput from "../components/assistant/ChatInput";

import {
  WELCOME_MESSAGE,
  SUGGESTED_PROMPTS,
  getMockResponse,
} from "../data/assistantData";

function makeMessage(role, text) {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    makeMessage("assistant", WELCOME_MESSAGE),
  ]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages((prev) => [...prev, makeMessage("user", trimmed)]);
    setThinking(true);

    const delay = 600 + Math.random() * 700;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        makeMessage("assistant", getMockResponse(trimmed)),
      ]);
      setThinking(false);
    }, delay);
  }

  return (
    <div className="p-6 flex-1 flex flex-col">
      <SectionHeader
        title="AI ASSISTANT"
        subtitle="Ask questions about risk, factors and safety across North East Region"
      />

      <Card className="flex flex-col h-[72vh] overflow-hidden">
        <style>{`
          @keyframes chatBubbleIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .chat-bubble-enter {
            animation: chatBubbleIn 250ms ease-out both;
            animation-delay: var(--enter-delay, 0ms);
          }
          @keyframes typingDotBounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-3px); opacity: 1; }
          }
          .typing-dot {
            width: 6px;
            height: 6px;
            border-radius: 9999px;
            background-color: #94A3B8;
            animation: typingDotBounce 1000ms ease-in-out infinite;
            animation-delay: var(--dot-delay, 0ms);
          }
          @media (prefers-reduced-motion: reduce) {
            .chat-bubble-enter { animation: none; }
            .typing-dot { animation: none; opacity: 0.8; }
          }
        `}</style>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
            <Bot size={18} strokeWidth={3} className="text-[#2563EB]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Landslide Risk Assistant
            </p>
            <p className="text-xs text-slate-400">
              Mock responses based on monitored NER data
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          {messages.map((m, i) => (
            <ChatBubble key={m.id} message={m} index={i} />
          ))}

          {thinking && <TypingIndicator />}
        </div>

        {/* Suggested prompts — only before the first user message */}
        {messages.length === 1 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2 shrink-0">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full px-3 py-1.5 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="shrink-0">
          <ChatInput onSend={sendMessage} disabled={thinking} />
        </div>
      </Card>
    </div>
  );
}
