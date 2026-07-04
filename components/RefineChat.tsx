"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { GuideResponse, RefineResponse } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  isTyping?: boolean;
}

interface RefineChatProps {
  guideData: GuideResponse;
  onGuideUpdated: (newGuide: GuideResponse) => void;
}

const EXAMPLE_CHIPS = [
  "Make it more food-focused",
  "Add a hidden gem",
  "Swap Day 1 evening",
  "Make it more relaxed",
];

const INITIAL_AI_MESSAGE: ChatMessage = {
  id: "init",
  role: "ai",
  text: "Hi! I can tweak your itinerary — try things like \"make day 2 more food-focused\" or \"add a hidden gem to day 1\".",
};

export default function RefineChat({ guideData, onGuideUpdated }: RefineChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_AI_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: "user", text: trimmed };
    const typingMsg: ChatMessage = { id: `typing-${Date.now()}`, role: "ai", text: "", isTyping: true };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch("/api/refine-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentGuide: guideData,
          instruction: trimmed,
          destination: guideData.destination,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errText = (err as { error?: string }).error || "Something went wrong. Please try again.";
        setMessages((prev) =>
          prev.map((m) => m.isTyping ? { ...m, text: errText, isTyping: false } : m)
        );
      } else {
        const result = (await response.json()) as RefineResponse;
        onGuideUpdated(result.guide);
        try { sessionStorage.setItem("cultureGuideData", JSON.stringify(result.guide)); } catch { /* ignore */ }
        setMessages((prev) =>
          prev.map((m) => m.isTyping ? { ...m, text: result.changeSummary, isTyping: false } : m)
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.isTyping ? { ...m, text: "Couldn't reach the server. Check your connection and try again.", isTyping: false } : m
        )
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); }
  };

  return (
    <div className="space-y-4">
      {/* Chat message list */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1 scroll-smooth"
        role="log"
        aria-live="polite"
        aria-label="Itinerary refinement chat"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] px-4 py-2.5 rounded-xl text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-accent/85 text-background rounded-br-sm font-medium"
                  : "bg-surface-3 text-foreground/85 rounded-bl-sm"
              }`}
            >
              {msg.isTyping ? (
                <span className="flex items-center gap-1.5 py-0.5" aria-label="AI is thinking">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/35 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/35 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/35 animate-bounce" />
                </span>
              ) : msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Quick-action chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick instruction suggestions">
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={isSending}
            onClick={() => { setInputValue(chip); inputRef.current?.focus(); }}
            className="px-3 py-1.5 text-xs rounded-lg text-foreground/55 bg-surface-2 border border-[var(--border)] hover:border-accent/40 hover:text-accent hover:bg-surface-3 transition-all duration-200 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input + Send */}
      <div className="flex gap-2 items-center">
        <label htmlFor="refine-chat-input" className="sr-only">Type a refinement instruction</label>
        <input
          ref={inputRef}
          id="refine-chat-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder="e.g. Make day 2 more food-focused…"
          className="flex-1 px-4 py-3 bg-surface-2 rounded-xl text-foreground placeholder-foreground/35 border border-[var(--border)] focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 transition-all disabled:opacity-40 text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isSending}
          aria-label="Send refinement instruction"
          className={`shrink-0 p-3 rounded-xl transition-all duration-200 ${
            inputValue.trim() && !isSending
              ? "bg-accent text-background hover:brightness-110 hover:shadow-accent cursor-pointer active:scale-95 shadow-sm"
              : "bg-foreground/5 text-foreground/20 cursor-not-allowed"
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
