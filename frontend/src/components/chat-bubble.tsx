import type { Message } from "@/types";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatBubble({ message }: { message: Message }) {
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
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="mt-1 px-1 text-[10px] text-basile-200/30">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
