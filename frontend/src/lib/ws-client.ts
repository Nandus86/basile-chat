import type { WsIncoming } from "@/types";

type Listener = (data: WsIncoming) => void;
type StatusListener = (connected: boolean) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private retryCount = 0;
  private maxRetries = 5;
  private shouldReconnect = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string) {
    this.url = url;
  }

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
      this.retryCount = 0;
      this.emitStatus(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WsIncoming = JSON.parse(event.data);
        this.listeners.forEach((l) => l(data));
      } catch {
        /* ignore malformed */
      }
    };

    this.ws.onclose = () => {
      this.emitStatus(false);
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) return;
    const delay = Math.min(1000 * 2 ** this.retryCount, 15000);
    this.retryCount += 1;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  send(payload: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
    this.statusListeners.clear();
  }
}
