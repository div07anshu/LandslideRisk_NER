import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
        <Bot size={14} strokeWidth={3} className="text-[#2563EB]" />
      </div>

      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot" style={{ "--dot-delay": "0ms" }} />
        <span className="typing-dot" style={{ "--dot-delay": "160ms" }} />
        <span className="typing-dot" style={{ "--dot-delay": "320ms" }} />
      </div>
    </div>
  );
}
