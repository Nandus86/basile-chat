"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/contexts/chat-context";
import ChatWindow from "@/components/chat-window";

export default function ChatPage() {
  const router = useRouter();
  const { user } = useChat();

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  if (!user) return null;

  return <ChatWindow />;
}
