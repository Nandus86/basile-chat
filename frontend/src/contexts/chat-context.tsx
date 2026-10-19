"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NaoAutorizado, entrar, historico, wsUrl } from "@/lib/api";
import { WsClient } from "@/lib/ws-client";
import type { Conta, IgrejaParaEscolher, Message, MensagemServidor, Sender, WsIncoming } from "@/types";

interface ChatContextValue {
  conta: Conta | null;
  carregando: boolean;
  messages: Message[];
  isConnected: boolean;
  isBasileTyping: boolean;
  /** Devolve as igrejas para escolher quando a pessoa está em mais de uma. */
  login: (usuario: string, senha: string, igrejaId?: string) => Promise<IgrejaParaEscolher[] | null>;
  sendMessage: (content: string, optionId?: string | null) => void;
  logout: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const STORAGE_KEY = "basile_sessao";
const ESPERA_RESPOSTA_MS = 90000;

interface SessaoSalva {
  token: string;
  conta: Conta;
}

function uid(): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function paraTela(m: MensagemServidor): Message {
  return {
    id: `s-${m.id}`,
    serverId: m.id,
    content: m.texto,
    sender: m.autor === "pessoa" ? "user" : "basile",
    timestamp: new Date(m.em).getTime(),
    provisional: m.provisoria,
    options: m.opcoes ?? [],
    attachment: m.anexo ?? null,
  };
}

/** Junta uma mensagem do servidor na lista: sem repetir, trocando a "enviando…" pela confirmada. */
function juntar(lista: Message[], nova: Message): Message[] {
  if (lista.some((m) => m.serverId === nova.serverId)) return lista;
  let base = lista;
  if (nova.sender === "user") {
    const i = lista.findIndex((m) => m.pending && m.content === nova.content);
    if (i >= 0) base = [...lista.slice(0, i), ...lista.slice(i + 1)];
  }
  return [...base, nova].sort((a, b) => a.timestamp - b.timestamp);
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<SessaoSalva | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isBasileTyping, setIsBasileTyping] = useState(false);
  const wsRef = useRef<WsClient | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pararDeDigitar = useCallback(() => {
    setIsBasileTyping(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  const logout = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setSessao(null);
    setMessages([]);
    setIsConnected(false);
    pararDeDigitar();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* navegador sem armazenamento */
    }
  }, [pararDeDigitar]);

  const handleWsMessage = useCallback(
    (data: WsIncoming) => {
      if (data.tipo !== "mensagem") return;
      const nova = paraTela(data.mensagem);
      if (nova.sender === "basile" && !nova.provisional) pararDeDigitar();
      setMessages((prev) => juntar(prev, nova));
    },
    [pararDeDigitar]
  );

  const abrir = useCallback(
    async (s: SessaoSalva) => {
      wsRef.current?.disconnect();
      setSessao(s);
      try {
        const lista = await historico(s.token);
        setMessages(lista.map(paraTela));
      } catch (erro) {
        if (erro instanceof NaoAutorizado) {
          logout();
          return;
        }
      }
      const client = new WsClient(wsUrl(), s.token, logout);
      client.onMessage(handleWsMessage);
      client.onStatus(setIsConnected);
      client.connect();
      wsRef.current = client;
    },
    [handleWsMessage, logout]
  );

  const login = useCallback(
    async (usuario: string, senha: string, igrejaId?: string) => {
      const r = await entrar(usuario, senha, igrejaId);
      if ("escolher" in r) return r.escolher;
      const s = { token: r.token, conta: r.conta };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        /* navegador sem armazenamento: vale só nesta aba */
      }
      await abrir(s);
      return null;
    },
    [abrir]
  );

  const sendMessage = useCallback(
    (content: string, optionId?: string | null) => {
      const text = content.trim();
      if (!text || !wsRef.current) return;
      if (!wsRef.current.send({ tipo: "mensagem", texto: text, opcao_id: optionId ?? undefined })) return;
      setMessages((prev) => [
        ...prev,
        { id: uid(), content: text, sender: "user" as Sender, timestamp: Date.now(), pending: true },
      ]);
      setIsBasileTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsBasileTyping(false), ESPERA_RESPOSTA_MS);
    },
    []
  );

  // volta a conectar quando o app volta para a tela (celular bloqueado, troca de aba)
  useEffect(() => {
    const acordar = () => {
      if (document.visibilityState === "visible") wsRef.current?.wake();
    };
    document.addEventListener("visibilitychange", acordar);
    window.addEventListener("online", acordar);
    return () => {
      document.removeEventListener("visibilitychange", acordar);
      window.removeEventListener("online", acordar);
    };
  }, []);

  useEffect(() => {
    let salva: SessaoSalva | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      salva = raw ? (JSON.parse(raw) as SessaoSalva) : null;
    } catch {
      salva = null;
    }
    if (salva?.token && salva.conta) {
      abrir(salva).finally(() => setCarregando(false));
    } else {
      setCarregando(false);
    }
    return () => {
      wsRef.current?.disconnect();
    };
  }, [abrir]);

  const value = useMemo<ChatContextValue>(
    () => ({
      conta: sessao?.conta ?? null,
      carregando,
      messages,
      isConnected,
      isBasileTyping,
      login,
      sendMessage,
      logout,
    }),
    [sessao, carregando, messages, isConnected, isBasileTyping, login, sendMessage, logout]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat deve ser usado dentro de ChatProvider");
  return ctx;
}

export type { Sender };
