import type { Anexo, Message, Opcao } from "@/types";

function Attachment({ anexo }: { anexo: Anexo }) {
  if (anexo.tipo === "imagem") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={anexo.url} alt={anexo.nome || "imagem"} className="mb-2 max-h-80 w-full rounded-xl object-contain" />;
  }
  if (anexo.tipo === "audio") return <audio controls src={anexo.url} className="mb-2 w-60 max-w-full" />;
  if (anexo.tipo === "video") return <video controls src={anexo.url} className="mb-2 max-h-80 w-full rounded-xl" />;
  return (
    <a href={anexo.url} download={anexo.nome || "documento"} target="_blank" rel="noreferrer"
       className="mb-2 block rounded-lg bg-basile-950/40 px-3 py-2 text-xs underline">
      📄 {anexo.nome || "Abrir documento"}
    </a>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatBubble({
  message,
  onChoose,
}: {
  message: Message;
  onChoose?: (opcao: Opcao) => void;   // só na última mensagem: as opções ficam tocáveis
}) {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex w-full items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-basile-500 to-basile-700 shadow-md shadow-basile-700/30">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4M8 16h.01M16 16h.01" />
          </svg>
        </div>
      )}

      <div className={`flex max-w-[78%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`animate-msg-in rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg ${
            isUser
              ? "rounded-br-md bg-gradient-to-br from-basile-600 to-basile-500 text-white shadow-basile-700/30"
              : "rounded-bl-md glass-surface text-basile-50"
          }`}
        >
          {message.attachment && <Attachment anexo={message.attachment} />}
          {message.content && (
            <p className={`whitespace-pre-wrap break-words ${message.provisional ? "italic opacity-70" : ""}`}>{message.content}</p>
          )}
        </div>
        {!!message.options?.length && (
          <div className="mt-2 flex w-full flex-col gap-1.5">
            {message.options.map((o, i) => (
              <div key={`${o.id ?? o.titulo}-${i}`}>
                {o.secao && (i === 0 || message.options?.[i - 1]?.secao !== o.secao) && (
                  <p className="mb-1 mt-1 px-1 text-[10px] uppercase tracking-wide text-basile-200/40">{o.secao}</p>
                )}
                <button
                  disabled={!onChoose}
                  onClick={() => onChoose?.(o)}
                  className="w-full rounded-xl border border-basile-500/40 bg-basile-950/40 px-3 py-2 text-left text-sm text-basile-100 transition hover:border-basile-400 hover:bg-basile-500/10 disabled:cursor-default disabled:opacity-50"
                >
                  {o.titulo}
                </button>
              </div>
            ))}
          </div>
        )}
        <span className="mt-1 px-1 text-[10px] text-basile-200/30">
          {message.pending ? "enviando…" : formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
