"use client";

import { useEffect, useRef, useState } from "react";

export default function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="glass-surface border-t border-basile-glass-border px-3 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <div className="flex-1 overflow-hidden rounded-2xl border border-basile-glass-border bg-basile-950/50 focus-within:border-basile-500 focus-within:ring-2 focus-within:ring-basile-500/25">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Mensagem para a Basile..."
            disabled={disabled}
            className="block max-h-[140px] w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-basile-200/30 disabled:opacity-50"
          />
        </div>

        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          aria-label="Enviar mensagem"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-basile-600 to-basile-500 text-white shadow-lg shadow-basile-700/40 transition hover:from-basile-500 hover:to-basile-400 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
