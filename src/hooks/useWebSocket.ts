import { useState, useEffect, useRef, useCallback } from 'react';

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const getWebSocketBaseUrl = (): string => {
  const wsEnvBase = import.meta.env.VITE_WS_BASE_URL as string | undefined;
  if (wsEnvBase) {
    return wsEnvBase.replace(/\/$/, '');
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || window.location.origin;

  try {
    const parsed = new URL(apiBase, window.location.origin);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}`;
  } catch {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}`;
  }
};

export const buildWebSocketUrl = (path: string): string => {
  return `${getWebSocketBaseUrl()}${normalizePath(path)}`;
};

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface AuctionBidMessage {
  type: 'place_bid';
  action: string;
  auction_id: number;
  amount: number;
  user: string;
}

interface UseWebSocketOptions {
  url: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: WebSocketMessage) => void;
  shouldReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  sendMessage: (message: WebSocketMessage) => void;
  disconnect: () => void;
  connect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  error: Event | null;
}

export const useWebSocket = ({
  url,
  onOpen,
  onClose,
  onError,
  onMessage,
  shouldReconnect = true,
  reconnectInterval = 3000
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(shouldReconnect);

  // Update ref when shouldReconnect changes
  useEffect(() => {
    shouldReconnectRef.current = shouldReconnect;
  }, [shouldReconnect]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        onOpen?.();
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        
        // Only attempt to reconnect if the closure wasn't intentional
        if (shouldReconnectRef.current && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
        
        onClose?.();
      };

      ws.current.onerror = (error) => {
        setError(error);
        onError?.(error);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

    } catch (err) {
      setIsConnecting(false);
      setError(err as Event);
      onError?.(err as Event);
    }
  }, [url, onOpen, onClose, onError, onMessage, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, disconnect]);

  return {
    sendMessage,
    disconnect,
    connect,
    isConnected,
    isConnecting,
    lastMessage,
    error
  };
};

// Specific hooks for different WebSocket endpoints
export const useAuctionWebSocket = (auctionId: number, onMessage?: (data: WebSocketMessage) => void) => {
  const wsUrl = buildWebSocketUrl(`/ws/auction/${auctionId}/`);
  
  return useWebSocket({
    url: wsUrl,
    onMessage: (data) => {
      // Handle auction-specific messages
      if (data.auction_id === auctionId) {
        onMessage?.(data);
      }
    }
  });
};

export const useTestWebSocket = (onMessage?: (data: WebSocketMessage) => void) => {
  const wsUrl = buildWebSocketUrl('/ws/test/');
  
  return useWebSocket({
    url: wsUrl,
    onMessage
  });
};

export const useAuctionUpdatesWebSocket = (onMessage?: (data: WebSocketMessage) => void) => {
  const wsUrl = buildWebSocketUrl('/ws/auction-updates/');
  
  return useWebSocket({
    url: wsUrl,
    onMessage
  });
};