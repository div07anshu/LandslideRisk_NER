import { useState } from "react";
import { Bot, Send, X } from "lucide-react";

function FloatingAIAssistant({ onOpenChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "Hello! I’m Landslide AI. Ask me anything about landslide risk, warning signs, or safety measures.",
        },
    ]);
    const [loading, setLoading] = useState(false);

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
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: trimmedMessage,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to get AI response");
            }

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        data.response ||
                        data.message ||
                        "Sorry, I could not generate a response.",
                },
            ]);
        } catch (error) {
            console.error("AI Assistant Error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "Sorry, I couldn't connect to the AI service. Please make sure the backend is running.",
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
                    aria-label="Open AI Assistant"
                >
                    <Bot size={21} strokeWidth={2.2} />
                    <span>Ask AI</span>
                </button>
            )}

            {/* AI Side Panel */}
            <div
                className={`fixed right-0 top-0 z-50 flex h-screen w-[400px] max-w-[90vw] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between bg-brand-900 px-4 py-3 text-white">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600">
                            <Bot size={19} strokeWidth={2.2} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">Landslide AI</p>
                            <p className="text-[11px] text-slate-300">
                                AI Risk Assistant
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={closeAssistant}
                        className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Close AI Assistant"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto bg-[#F9F7F7] p-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user"
                                        ? "rounded-br-md bg-brand-600 text-white"
                                        : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                                AI is thinking...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2 py-1.5 focus-within:border-brand-500">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about landslides..."
                            disabled={loading}
                            className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-50"
                        />

                        <button
                            onClick={sendMessage}
                            disabled={!message.trim() || loading}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Send message"
                        >
                            <Send size={16} />
                        </button>
                    </div>

                    <p className="mt-2 text-center text-[10px] text-slate-400">
                        AI responses are for assistance and do not replace official
                        emergency warnings.
                    </p>
                </div>
            </div>
        </>
    );
}

export default FloatingAIAssistant;