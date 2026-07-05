import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//menu-card-api-yvzycdnaqq-el.a.run.app/api/websocket/orders`;
const MAX_RECONNECT = 5;

export const useWebSocketOrders = () => {
    const [liveOrders, setLiveOrders] = useState([]);
    const [statusUpdates, setStatusUpdates] = useState([]);
    const [paymentUpdates, setPaymentUpdates] = useState([]);
    const [waitTimeUpdates, setWaitTimeUpdates] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const reconnectAttempts = useRef(0);

    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const ws = new WebSocket(`${WS_URL}?access_token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            reconnectAttempts.current = 0;
        };

        ws.onclose = () => {
            setIsConnected(false);
            if (reconnectAttempts.current < MAX_RECONNECT) {
                const delay = Math.pow(2, reconnectAttempts.current) * 1000;
                reconnectTimerRef.current = setTimeout(() => {
                    reconnectAttempts.current++;
                    connect();
                }, delay);
            }
        };

        ws.onerror = () => ws.close();

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                switch (msg.type) {
                    case 'new_order':
                        setLiveOrders(prev => [msg.data, ...prev]);
                        break;
                    case 'status_update':
                        setStatusUpdates(prev => [msg.data, ...prev]);
                        break;
                    case 'payment_status_update':
                        setPaymentUpdates(prev => [msg.data, ...prev]);
                        break;
                    case 'avg_wait_time_update':
                        setWaitTimeUpdates(prev => [msg.data, ...prev]);
                        break;
                    default:
                        break;
                }
            } catch (e) {
                console.error('WebSocket parse error:', e);
            }
        };
    }, []);

    useEffect(() => {
        connect();
        return () => {
            clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    const clearLatestStatusUpdate = useCallback(() => {
        setStatusUpdates(prev => prev.slice(1));
    }, []);

    const clearLatestPaymentUpdate = useCallback(() => {
        setPaymentUpdates(prev => prev.slice(1));
    }, []);

    const clearLatestWaitTimeUpdate = useCallback(() => {
        setWaitTimeUpdates(prev => prev.slice(1));
    }, []);

    // Manual reconnect function
    const manualReconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        reconnectAttempts.current = 0;
        connect();
    }, [connect]);

    return { 
        liveOrders, 
        statusUpdates, 
        paymentUpdates,
        waitTimeUpdates,
        isConnected, 
        clearLatestStatusUpdate,
        clearLatestPaymentUpdate,
        clearLatestWaitTimeUpdate,
        manualReconnect 
    };
};
