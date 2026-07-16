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
import { buildWsUrl, registerUser } from "@/lib/api";
import { WsClient } from "@/lib/ws-client";
import type { Message, Sender, User, WsIncoming } from "@/types";

interface ChatContextValue {
  user: User | null;
  messages: Message[];
  isConnected: boolean;
  isBasileTyping: boolean;
  login: (name: string, phone: string, api_key: string, instance_id: string) => Promise<void>;
  sendMessage: (content: string) => void;
  logout: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const STORAGE_KEY = "basile_user";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isBasileTyping, setIsBasileTyping] = useState(false);
  const wsRef = useRef<WsClient | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWsMessage = useCallback((data: WsIncoming) => {
    if (data.type === "message" && data.sender === "basile" && data.content) {
      setIsBasileTyping(false);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          content: data.content as string,
          sender: "basile",
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  const connectWs = useCallback(
    (phone: string) => {
      const client = new WsClient(buildWsUrl(phone));
      client.onMessage(handleWsMessage);
      client.onStatus(setIsConnected);
      client.connect();
      wsRef.current = client;
    },
    [handleWsMessage]
  );

  const login = useCallback(
    async (name: string, phone: string, api_key: string, instance_id: string) => {
      const reg = await registerUser(name, phone, api_key, instance_id);
      setUser(reg);
      setMessages([]);
      setIsBasileTyping(false);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reg));
      }
      connectWs(reg.phone);
    },
    [connectWs]
  );

  const sendMessage = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text || !wsRef.current || !user) return;

      setMessages((prev) => [
        ...prev,
        { id: uid(), content: text, sender: "user", timestamp: Date.now() },
      ]);

      wsRef.current.send({
        type: "message",
        content: text,
        api_key: user.api_key,
        instance_id: user.instance_id,
      });

      setIsBasileTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        setIsBasileTyping(false);
      }, 30000);
    },
    [user]
  );

  const logout = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setUser(null);
    setMessages([]);
    setIsConnected(false);
    setIsBasileTyping(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: User = JSON.parse(raw);
        setUser(stored);
        connectWs(stored.phone);
      }
    } catch {
      /* ignore */
    }
    return () => {
      wsRef.current?.disconnect();
    };
  }, [connectWs]);

  const value = useMemo<ChatContextValue>(
    () => ({
      user,
      messages,
      isConnected,
      isBasileTyping,
      login,
      sendMessage,
      logout,
    }),
    [user, messages, isConnected, isBasileTyping, login, sendMessage, logout]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat deve ser usado dentro de ChatProvider");
  return ctx;
}

export type { Sender };
