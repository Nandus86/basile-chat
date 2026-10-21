import type { Conta, IgrejaParaEscolher, MensagemServidor } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8014";
const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:8014";

export class NaoAutorizado extends Error {}

export type CodigoEnviado = {
  desafio: string;
  enviado_por: "sms" | "whatsapp";
  destino: string; // celular do cadastro, mascarado: (43) •••••-4670
  reenviar_em_segundos: number;
};

export type PedidoDeCodigo = CodigoEnviado | { escolher: IgrejaParaEscolher[] };

async function detalhe(res: Response, padrao: string): Promise<string> {
  try {
    const corpo = await res.json();
    return typeof corpo?.detail === "string" ? corpo.detail : padrao;
  } catch {
    return padrao;
  }
}

async function postar<T>(caminho: string, corpo: unknown, padrao: string): Promise<T> {
  const res = await fetch(`${API_BASE}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!res.ok) throw new Error(await detalhe(res, padrao));
  return res.json();
}

/** 1º passo: usuário = nome, celular ou CPF. O código vai para o celular do cadastro da igreja. */
export function pedirCodigo(usuario: string, igrejaId?: string): Promise<PedidoDeCodigo> {
  return postar("/entrar/codigo", { usuario, igreja_id: igrejaId }, "Não foi possível enviar o código agora.");
}

/** "Não recebi": manda um código novo, de preferência pelo outro canal (SMS ↔ WhatsApp). */
export function reenviarCodigo(desafio: string): Promise<CodigoEnviado> {
  return postar("/entrar/codigo/reenviar", { desafio }, "Não foi possível reenviar o código agora.");
}

/** 2º passo: o código recebido abre a conta. */
export function entrar(desafio: string, codigo: string): Promise<{ token: string; conta: Conta }> {
  return postar("/entrar", { desafio, codigo }, "Não foi possível entrar agora.");
}

export async function historico(token: string, antesDe?: number): Promise<MensagemServidor[]> {
  const params = new URLSearchParams({ limite: "50" });
  if (antesDe) params.set("antes_de", String(antesDe));
  const res = await fetch(`${API_BASE}/mensagens?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new NaoAutorizado();
  if (!res.ok) throw new Error(await detalhe(res, "Não consegui carregar a conversa."));
  return res.json();
}

/** Outras igrejas em que o mesmo celular está no cadastro (para o "Trocar de igreja"). */
export async function outrasIgrejas(token: string): Promise<IgrejaParaEscolher[]> {
  const res = await fetch(`${API_BASE}/igrejas`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  return res.json();
}

/** Troca de igreja sem pedir outro código (o celular já foi confirmado). */
export async function trocarIgreja(token: string, igrejaId: string): Promise<{ token: string; conta: Conta }> {
  const res = await fetch(`${API_BASE}/trocar-igreja`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ igreja_id: igrejaId }),
  });
  if (!res.ok) throw new Error(await detalhe(res, "Não foi possível trocar de igreja agora."));
  return res.json();
}

export function wsUrl(): string {
  return `${WS_BASE}/ws`;
}
