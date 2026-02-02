  import { Client, IMessage } from '@stomp/stompjs';
import { SERVER_URL } from '../constants/url.constant';

  export type ItemUpdateCallback = (item: any) => void;
  export type ItemDeleteCallback = (itemCode: string) => void;

  class WebSocketService {
    private client: Client | null = null;
    private connected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 3000;

    // Callbacks for different event types
    private onItemCreatedCallbacks: ItemUpdateCallback[] = [];
    private onItemUpdatedCallbacks: ItemUpdateCallback[] = [];
    private onItemDeletedCallbacks: ItemDeleteCallback[] = [];
    private onConnectionChangeCallbacks: ((connected: boolean) => void)[] = [];

    constructor() {
      // this.ItemWsconnect();
    }

    /**
     * Establish WebSocket connection using native WebSocket (no SockJS)
     */
    ItemWsconnect(path:string) {
      if (this.connected) {
        return;
      }
      // Create STOMP client with NATIVE WebSocket
      this.client = new Client({
        // For production, use: wss://yourdomain.com/ws/items/websocket
        brokerURL: SERVER_URL.WS+path, // Note: /websocket suffix for native
        
        debug: (str) => {
          // console.log('[STOMP Debug]:', str);
        },

        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.notifyConnectionChange(true);
          this.subscribeToTopics();
        },

        onStompError: (frame) => {
          console.error('❌ STOMP Error:', frame.headers['message']);
          console.error('Details:', frame.body);
        },

        onWebSocketClose: () => {
          console.warn('⚠️ WebSocket Connection Closed');
          this.connected = false;
          this.notifyConnectionChange(false);
          this.handleReconnect();
        },

        onWebSocketError: (error) => {
          console.error('❌ WebSocket Error:', error);
        }
      });

      this.client.activate();
    }

    /**
     * Subscribe to all item-related topics
     */
    private subscribeToTopics() {
      if (!this.client) return;

      // Subscribe to item creation events
      this.client.subscribe('/topic/items/created', (message: IMessage) => {
        const item = JSON.parse(message.body);
        this.notifyItemCreated(item);
      });

      // Subscribe to item update events
      this.client.subscribe('/topic/items/updated', (message: IMessage) => {
        const item = JSON.parse(message.body);
        this.notifyItemUpdated(item);
      });

      // Subscribe to item deletion events
      this.client.subscribe('/topic/items/deleted', (message: IMessage) => {
        const itemCode = message.body.replace(/"/g, ''); // Remove quotes if present
        this.notifyItemDeleted(itemCode);
      });
    }

    /**
     * Handle reconnection logic
     */
    private handleReconnect() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        return;
      }

      this.reconnectAttempts++;
      
      setTimeout(() => {
      }, this.reconnectDelay * this.reconnectAttempts);
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
      if (this.client) {
        this.client.deactivate();
        this.connected = false;
      }
    }

    /**
     * Check connection status
     */
    isConnected(): boolean {
      return this.connected;
    }

    // ============================================
    // Event Registration Methods
    // ============================================

    onItemCreated(callback: ItemUpdateCallback) {
      this.onItemCreatedCallbacks.push(callback);
      return () => {
        this.onItemCreatedCallbacks = this.onItemCreatedCallbacks.filter(cb => cb !== callback);
      };
    }

    onItemUpdated(callback: ItemUpdateCallback) {
      this.onItemUpdatedCallbacks.push(callback);
      return () => {
        this.onItemUpdatedCallbacks = this.onItemUpdatedCallbacks.filter(cb => cb !== callback);
      };
    }

    onItemDeleted(callback: ItemDeleteCallback) {
      this.onItemDeletedCallbacks.push(callback);
      return () => {
        this.onItemDeletedCallbacks = this.onItemDeletedCallbacks.filter(cb => cb !== callback);
      };
    }

    onConnectionChange(callback: (connected: boolean) => void) {
      this.onConnectionChangeCallbacks.push(callback);
      return () => {
        this.onConnectionChangeCallbacks = this.onConnectionChangeCallbacks.filter(cb => cb !== callback);
      };
    }

    // ============================================
    // Notification Methods (Internal)
    // ============================================

    private notifyItemCreated(item: any) {
      this.onItemCreatedCallbacks.forEach(callback => callback(item));
    }

    private notifyItemUpdated(item: any) {
      this.onItemUpdatedCallbacks.forEach(callback => callback(item));
    }

    private notifyItemDeleted(itemCode: string) {
      this.onItemDeletedCallbacks.forEach(callback => callback(itemCode));
    }

    private notifyConnectionChange(connected: boolean) {
      this.onConnectionChangeCallbacks.forEach(callback => callback(connected));
    }
  }

  // Export singleton instance
  export const websocketService = new WebSocketService();