import { useState } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";

function AIAssistant() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "bot",
            text: "Hello! I am the NER Landslide AI Assistant. I can help you understand landslide risks, risk factors, warning signs, and safety measures.",
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const handleSend = async () => {
        const trimmedMessage = message.trim();

        if (!trimmedMessage || isTyping) return;

        const userMessage = {
            id: Date.now(),
            sender: "user",
            text: trimmedMessage,
        };

        setMessages((prev) => [...prev, userMessage]);
        setMessage("");
        setIsTyping(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: trimmedMessage,
                }),
            });

            if (!response.ok) {
                throw new Error("AI service request failed");
            }

            const data = await response.json();

            const botMessage = {
                id: Date.now() + 1,
                sender: "bot",
                text:
                    data.response ||
                    "Sorry, I could not generate a response.",
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("AI Assistant Error:", error);

            const botMessage = {
                id: Date.now() + 1,
                sender: "bot",
                text: "Sorry, I couldn't connect to the AI service. Please make sure the backend server is running.",
            };

            setMessages((prev) => [...prev, botMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col p-6">
            {/* Page Header */}
            <div className="mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                        <Bot
                            size={24}
                            strokeWidth={2.5}
                            className="text-blue-600"
                        />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            AI Assistant
                        </h1>

                        <p className="text-sm text-slate-500">
                            Ask questions about landslide risk, factors and safety.
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Card */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
                        <Sparkles
                            size={18}
                            className="text-white"
                            strokeWidth={2.5}
                        />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Landslide Risk Assistant
                        </p>

                        <p className="text-xs text-green-600">
                            ● Ready to help
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/50 p-5">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-3 ${msg.sender === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                        >
                            {/* Bot Icon */}
                            {msg.sender === "bot" && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                    <Bot
                                        size={16}
                                        className="text-white"
                                        strokeWidth={2.5}
                                    />
                                </div>
                            )}

                            {/* Message */}
                            <div
                                className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.sender === "user"
                                        ? "rounded-tr-sm bg-[#3F72AF] text-white"
                                        : "rounded-tl-sm border border-slate-200 bg-white text-slate-700 shadow-sm"
                                    }`}
                            >
                                {msg.text}
                            </div>

                            {/* User Icon */}
                            {msg.sender === "user" && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700">
                                    <User
                                        size={16}
                                        className="text-white"
                                        strokeWidth={2.5}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                <Bot
                                    size={16}
                                    className="text-white"
                                    strokeWidth={2.5}
                                />
                            </div>

                            <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-200 bg-white p-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSend();
                                }
                            }}
                            placeholder="Ask about landslide risk..."
                            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || isTyping}
                            className="flex items-center gap-2 rounded-xl bg-[#3F72AF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#315f96] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send size={17} strokeWidth={2.5} />
                            <span>Send</span>
                        </button>
                    </div>

                    <p className="mt-2 text-center text-[11px] text-slate-400">
                        AI responses are for informational purposes. Always follow
                        official disaster-management guidance during emergencies.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AIAssistant;