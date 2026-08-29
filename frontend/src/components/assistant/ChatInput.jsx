import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send } from "lucide-react";

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);

  const SpeechRecognitionCtor = getSpeechRecognitionCtor();
  const micSupported = !!SpeechRecognitionCtor;

  useEffect(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setValue(transcript);
    };

    recognition.onerror = () => {
      setMicError("Couldn't hear that. Try again.");
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMic() {
    if (!micSupported || disabled) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    setMicError("");
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch {
      // start() throws if a session is already active — ignore
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-5 py-4 border-t border-slate-100"
    >
      {micError && <p className="text-xs text-red-500 mb-2">{micError}</p>}

      <div className="flex items-center gap-2">
        {micSupported && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 ${
              listening
                ? "bg-red-500 text-white animate-pulse motion-reduce:animate-none"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {listening ? (
              <MicOff size={16} strokeWidth={3} />
            ) : (
              <Mic size={16} strokeWidth={3} />
            )}
          </button>
        )}

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            listening ? "Listening..." : "Ask about risk, factors or safety..."
          }
          disabled={disabled}
          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className="w-9 h-9 rounded-full bg-brand-950 text-white flex items-center justify-center shrink-0 hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Send size={15} strokeWidth={3} />
        </button>
      </div>
    </form>
  );
}
