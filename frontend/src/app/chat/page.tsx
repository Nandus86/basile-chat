"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/contexts/chat-context";
import ChatWindow from "@/components/chat-window";

export default function ChatPage() {
  const router = useRouter();
  const { conta, carregando } = useChat();

  useEffect(() => {
    if (!carregando && !conta) router.replace("/");
  }, [carregando, conta, router]);

  if (!conta) return null;

  return <ChatWindow />;
}
