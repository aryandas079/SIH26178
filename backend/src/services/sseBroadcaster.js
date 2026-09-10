/** Manages active Server-Sent Events (SSE) client connections. */

class SSEBroadcaster {
  constructor() {
    this.clients = new Set();
    this.heartbeatInterval = null;
    this.startHeartbeat();
  }

  addClient(res) {
    this.clients.add(res);
  }

  removeClient(res) {
    this.clients.delete(res);
  }

  broadcast(payload) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(data);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const ping = `: ping - ${new Date().toISOString()}\n\n`;
      for (const client of this.clients) {
        try {
          client.write(ping);
        } catch {
          this.clients.delete(client);
        }
      }
    }, 15000);
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const sseBroadcaster = new SSEBroadcaster();
export default sseBroadcaster;
