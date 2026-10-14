class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = [];
  }

  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsHost = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const wsUrl = `${wsHost}/ws/notifications/?token=${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket Connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket Message Received:', data);
        console.log('🔍 Message Type:', data.type);
        console.log('🔍 Message Entity:', data.entity);
        console.log('🔍 Message Action:', data.action);
        
        // Notify all listeners
        console.log('📢 Notifying', this.listeners.length, 'listeners');
        this.listeners.forEach((callback, index) => {
          console.log(`📤 Calling listener ${index + 1}`);
          callback(data);
        });
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket Disconnected');
        this.attemptReconnect(token);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  attemptReconnect(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(token);
      }, this.reconnectDelay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  addListener(callback) {
    console.log('➕ Adding WebSocket listener. Total listeners:', this.listeners.length + 1);
    this.listeners.push(callback);
  }

  removeListener(callback) {
    const beforeCount = this.listeners.length;
    this.listeners = this.listeners.filter(cb => cb !== callback);
    console.log('➖ Removed WebSocket listener. Listeners:', beforeCount, '->', this.listeners.length);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export default new WebSocketService();
