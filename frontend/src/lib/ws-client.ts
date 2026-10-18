import type { WsIncoming } from "@/types";

type Listener = (data: WsIncoming) => void;
type StatusListener = (connected: boolean) => void;

/**
 * Conexão em tempo real com o mensageiro.
 * O token vai na primeira mensagem (nunca na URL); a conexão só conta como aberta depois do "pronto".
 * Reconecta sozinha (com espera crescente) e manda um ping a cada 25s para o proxy não derrubar.
 */
export class WsClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private retryCount = 0;
  private shouldReconnect = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private ready = false;

  constructor(private url: string, private token: string, private onUnauthorized: () => void) {}

  connect() {
    this.shouldReconnect = true;
    this.open();
  }

  private open() {
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ tipo: "entrar", token: this.token }));
    };

    this.ws.onmessage = (event) => {
      let data: WsIncoming;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.tipo === "pronto") {
        this.ready = true;
        this.retryCount = 0;
        this.emitStatus(true);
        this.startPing();
      }
      this.listeners.forEach((l) => l(data));
    };

    this.ws.onclose = (event) => {
      this.ready = false;
      this.stopPing();
      this.emitStatus(false);
      if (event.code === 4401) {
        this.shouldReconnect = false;
        this.onUnauthorized();
        return;
      }
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => this.send({ tipo: "ping" }), 25000);
  }

  private stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private scheduleReconnect() {
    const delay = Math.min(1000 * 2 ** this.retryCount, 30000);
    this.retryCount += 1;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  /** Reconecta já (ex.: o app voltou para a tela). */
  wake() {
    if (this.ready || !this.shouldReconnect) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.retryCount = 0;
    this.open();
  }

  send(payload: object) {
    if (this.ws && this.ready && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  onMessage(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onStatus(fn: StatusListener) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  private emitStatus(connected: boolean) {
    this.statusListeners.forEach((l) => l(connected));
  }

  disconnect() {
    this.shouldReconnect = false;
    this.stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
    this.statusListeners.clear();
  }
}
