
import React, { useState, createContext, useContext, useCallback } from 'react';
import { Notification } from './types';
import SonicAlchemyView from './SonicAlchemyView';

interface NotificationContextType {
    addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
    notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within provider');
    return context;
};

const App: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        const id = Math.random().toString(36).substring(7);
        const timestamp = new Date().toISOString();
        setNotifications(prev => [{ ...n, id, timestamp, isRead: false }, ...prev].slice(0, 10));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification }}>
            <div className="min-h-screen">
                <SonicAlchemyView />
                
                {/* Global Notification Tray */}
                <div className="fixed bottom-24 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                    {notifications.slice(0, 3).map(n => (
                        <div key={n.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-2xl pointer-events-auto animate-slide-in flex items-start gap-3 w-80">
                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.type === 'error' ? 'bg-rose-500' : 'bg-cyan-500'}`} />
                            <div>
                                <p className="text-sm font-semibold text-white">{n.message}</p>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{new Date(n.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
                }
            `}</style>
        </NotificationContext.Provider>
    );
};

export default App;
