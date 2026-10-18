import type { Conta, IgrejaParaEscolher, MensagemServidor } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8014";
const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:8014";

export class NaoAutorizado extends Error {}

export type ResultadoEntrada =
  | { token: string; conta: Conta }
  | { escolher: IgrejaParaEscolher[] };

async function detalhe(res: Response, padrao: string): Promise<string> {
  try {
    const corpo = await res.json();
    return typeof corpo?.detail === "string" ? corpo.detail : padrao;
  } catch {
    return padrao;
  }
}

/** Entra com o nome completo e o CPF do cadastro da igreja. */
export async function entrar(nome: string, cpf: string, igrejaId?: string): Promise<ResultadoEntrada> {
  const res = await fetch(`${API_BASE}/entrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, cpf, igreja_id: igrejaId }),
  });
  if (!res.ok) throw new Error(await detalhe(res, "Não foi possível entrar agora."));
  return res.json();
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

export function wsUrl(): string {
  return `${WS_BASE}/ws`;
}
