"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useChat } from "@/contexts/chat-context";
import type { IgrejaParaEscolher } from "@/types";

const digitsOnly = (v: string) => v.replace(/\D/g, "");

// 12345678901 → 123.456.789-01 (enquanto digita)
function mascaraCpf(v: string): string {
  const d = digitsOnly(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

const campo =
  "w-full rounded-xl border border-basile-glass-border bg-basile-950/40 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-basile-200/30 focus:border-basile-500 focus:ring-2 focus:ring-basile-500/30";
const rotulo = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-basile-200/60";

export default function LoginForm() {
  const router = useRouter();
  const { conta, carregando, login } = useChat();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [igrejas, setIgrejas] = useState<IgrejaParaEscolher[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!carregando && conta) router.replace("/chat");
  }, [carregando, conta, router]);

  const tentar = async (igrejaId?: string) => {
    setError("");
    setLoading(true);
    try {
      const escolher = await login(digitsOnly(usuario), digitsOnly(senha), igrejaId);
      if (escolher) {
        setIgrejas(escolher);
        return;
      }
      router.push("/chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar agora.");
      setIgrejas(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (digitsOnly(usuario).length !== 11) {
      setError("O usuário é o seu CPF (11 números).");
      return;
    }
    if (!senha) {
      setError("Digite a sua senha.");
      return;
    }
    await tentar();
  };

  if (carregando) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-basile-700/30 blur-3xl animate-orb" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-basile-500/25 blur-3xl animate-orb [animation-delay:-5s]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-basile-400/15 blur-3xl animate-orb [animation-delay:-9s]" />

      <div className="glass-surface relative z-10 w-full max-w-sm rounded-3xl p-8 shadow-2xl shadow-basile-950/50">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="animate-pulse-glow mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-basile-500 to-basile-700 shadow-lg shadow-basile-700/40">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h1 className="bg-gradient-to-r from-basile-200 via-basile-300 to-basile-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent text-glow">
            Basile
          </h1>
          <p className="mt-1.5 text-sm text-basile-200/50">A sua igreja, a uma mensagem de distância</p>
        </div>

        {igrejas ? (
          <div className="space-y-3">
            <p className="text-sm text-basile-100/80">Encontramos você em mais de uma igreja. Com qual quer conversar?</p>
            {igrejas.map((ig) => (
              <button
                key={ig.igreja_id}
                disabled={loading}
                onClick={() => tentar(ig.igreja_id)}
                className="w-full rounded-xl border border-basile-glass-border bg-basile-950/40 px-4 py-3 text-left text-sm text-basile-50 transition hover:border-basile-500 disabled:opacity-60"
              >
                {ig.igreja_nome || "Igreja"}
              </button>
            ))}
            <button onClick={() => setIgrejas(null)} className="w-full text-center text-xs text-basile-200/50 hover:text-basile-200">
              Voltar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={rotulo}>Usuário</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(mascaraCpf(e.target.value))}
                placeholder="Seu CPF"
                autoComplete="username"
                inputMode="numeric"
                className={campo}
              />
            </div>

            <div>
              <label className={rotulo}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Por enquanto, também o seu CPF"
                autoComplete="current-password"
                className={campo}
              />
            </div>

            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-basile-600 to-basile-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-basile-700/40 transition hover:from-basile-500 hover:to-basile-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-basile-200/30">
          Ao entrar, você concorda em conversar com a sua igreja por aqui. Os seus dados vêm do cadastro da igreja.
        </p>
      </div>
    </div>
  );
}
