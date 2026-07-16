export type Sender = "user" | "basile";

export interface User {
  id: number;
  name: string;
  phone: string;
  api_key: string;
  instance_id: string;
  created_at?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: Sender;
  timestamp: number;
}

export interface WsIncoming {
  type: "message" | "connected" | "error";
  sender?: Sender;
  content?: string;
  message?: string;
}
