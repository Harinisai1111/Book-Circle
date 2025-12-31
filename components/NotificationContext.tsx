import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../supabaseClient';
import { getUnreadCount } from '../services/messageService';

interface NotificationContextType {
    unreadCount: number;
    refreshUnread: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnread = async () => {
        if (user) {
            const count = await getUnreadCount(user.id);
            setUnreadCount(count);
        }
    };

    useEffect(() => {
        if (user) {
            refreshUnread();

            // Subscribe to all messages where the user is the receiver
            const channel = supabase
                .channel(`notifications-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen for inserts (new msg) and updates (marking as read)
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${user.id}`
                    },
                    () => {
                        refreshUnread();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnread }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
