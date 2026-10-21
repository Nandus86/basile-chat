"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/contexts/chat-context";
import ChatBubble from "@/components/chat-bubble";
import MessageInput from "@/components/message-input";

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-basile-500 to-basile-700 shadow-md shadow-basile-700/30">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4M8 16h.01M16 16h.01" />
        </svg>
      </div>
      <div className="glass-surface flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3.5">
        <span className="typing-dot h-2 w-2 rounded-full bg-basile-300" />
        <span className="typing-dot [animation-delay:0.2s] h-2 w-2 rounded-full bg-basile-300" />
        <span className="typing-dot [animation-delay:0.4s] h-2 w-2 rounded-full bg-basile-300" />
      </div>
    </div>
  );
}

export default function ChatWindow() {
  const { conta, messages, isBasileTyping, isConnected, sendMessage, logout, outras, trocarIgreja } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [trocando, setTrocando] = useState(false);

  const escolher = async (igrejaId: string) => {
    setTrocando(true);
    try {
      await trocarIgreja(igrejaId);
      setMenuAberto(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível trocar de igreja agora.");
    } finally {
      setTrocando(false);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isBasileTyping]);

  const initial = conta?.igreja_nome?.charAt(0).toUpperCase() ?? "?";
  // a mensagem provisória ("só um instante…") some quando chega a resposta de verdade
  const visiveis = messages.filter(
    (m, i) => !m.provisional || !messages.slice(i + 1).some((n) => n.sender === "basile")
  );

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="glass-surface z-20 flex items-center gap-3 border-b border-basile-glass-border px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-basile-500 to-basile-700 text-sm font-semibold text-white shadow-md shadow-basile-700/30">
          {initial}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-basile-50">{conta?.igreja_nome}</h2>
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"} shadow-sm`} />
          </div>
          <p className="text-xs text-basile-200/40">
            {isConnected ? "Conectado" : "Reconectando..."} · {conta?.nome}
          </p>
        </div>
        {outras.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuAberto((v) => !v)}
              aria-label="Trocar de igreja"
              title="Trocar de igreja"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-basile-200/60 transition hover:bg-basile-500/10 hover:text-basile-200"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
            {menuAberto && (
              <div className="glass-surface absolute right-0 top-11 z-30 w-64 rounded-2xl p-2 shadow-xl shadow-basile-950/50">
                <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-basile-200/50">Trocar de igreja</p>
                {outras.map((ig) => (
                  <button
                    key={ig.igreja_id}
                    disabled={trocando}
                    onClick={() => escolher(ig.igreja_id)}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-basile-50 transition hover:bg-basile-500/15 disabled:opacity-50"
                  >
                    {ig.igreja_nome || "Igreja"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          onClick={logout}
          aria-label="Sair"
          title="Sair"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-basile-200/60 transition hover:bg-basile-500/10 hover:text-basile-200"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </header>

      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {visiveis.length === 0 && !isBasileTyping && (
            <div className="mt-10 flex flex-col items-center text-center">
              <div className="animate-pulse-glow mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-basile-500 to-basile-700 shadow-lg shadow-basile-700/40">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4M8 16h.01M16 16h.01" />
                </svg>
              </div>
              <p className="text-sm font-medium text-basile-100/80">Olá! Como podemos ajudar?</p>
              <p className="mt-1 text-xs text-basile-200/40">Pergunte sobre cultos, células, pedidos de oração e mais</p>
            </div>
          )}

          {visiveis.map((m, i) => (
            <ChatBubble
              key={m.id}
              message={m}
              onChoose={
                i === visiveis.length - 1 && isConnected ? (o) => sendMessage(o.titulo, o.id) : undefined
              }
            />
          ))}

          {isBasileTyping && <TypingIndicator />}
        </div>
      </div>

      <MessageInput onSend={(texto) => sendMessage(texto)} disabled={!isConnected} />
    </div>
  );
}
