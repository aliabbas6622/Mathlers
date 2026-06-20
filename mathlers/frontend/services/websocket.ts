export type WebSocketEventType = 'match_started' | 'new_question' | 'opponent_answer' | 'match_results' | 'error';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
}

export interface IWebSocketService {
  connect(matchId: string, token: string): void;
  disconnect(): void;
  send(payload: any): void;
  onMessage(callback: (event: WebSocketEvent) => void): void;
}

export class WebSocketService implements IWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(baseUrl: string = "ws://localhost:8000/api/v1") {
    this.url = baseUrl;
  }

  connect(matchId: string, token: string): void {
    if (this.ws) return;

    this.ws = new WebSocket(`${this.url}/matches/${matchId}/live`);

    this.ws.onopen = () => {
      this.send({ type: 'auth', token });
    };

    this.ws.onclose = () => {
      this.ws = null;
      console.log('WebSocket connection closed.');
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  onMessage(callback: (event: WebSocketEvent) => void): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };
  }
}
