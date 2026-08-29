import { Bot, User } from "lucide-react";

export default function ChatBubble({ message, index }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{ "--enter-delay": `${Math.min(index, 6) * 40}ms` }}
      className={`flex items-end gap-2.5 chat-bubble-enter ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-brand-950" : "bg-[#DBEAFE]"
        }`}
      >
        {isUser ? (
          <User size={14} strokeWidth={3} className="text-white" />
        ) : (
          <Bot size={14} strokeWidth={3} className="text-[#2563EB]" />
        )}
      </div>

      <div
        className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`text-sm rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-line ${
            isUser
              ? "bg-brand-950 text-white rounded-br-sm"
              : "bg-slate-100 text-slate-700 rounded-bl-sm"
          }`}
        >
          {message.text}
        </div>
        <span className="text-[10px] text-slate-400 mt-1 px-1">
          {message.time}
        </span>
      </div>
    </div>
  );
}
