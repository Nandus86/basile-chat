export type Sender = "user" | "basile";

/** A pessoa logada: uma conta por pessoa e igreja (vem do cadastro da igreja). */
export interface Conta {
  id: number;
  nome: string;
  igreja_id: string;
  igreja_nome: string;
}

export interface IgrejaParaEscolher {
  igreja_id: string;
  igreja_nome: string;
}

/** Mensagem como o mensageiro guarda e entrega. */
export interface MensagemServidor {
  id: number;
  conta_id: number;
  autor: "pessoa" | "igreja";
  texto: string;
  em: string;
  provisoria: boolean;
}

/** Mensagem como a tela mostra. */
export interface Message {
  id: string;
  serverId?: number;
  content: string;
  sender: Sender;
  timestamp: number;
  provisional?: boolean;   // "só um instante…" enquanto o Basile pensa
  pending?: boolean;       // enviada, esperando o servidor confirmar
}

export type WsIncoming =
  | { tipo: "pronto" }
  | { tipo: "pong" }
  | { tipo: "erro"; detalhe: string }
  | { tipo: "mensagem"; mensagem: MensagemServidor };
