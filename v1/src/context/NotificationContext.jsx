import React, { createContext, useContext, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const addNotification = useCallback((notification) => {
        const id = Date.now();
        setNotifications(prev => [{
            id,
            timestamp: new Date(),
            read: false,
            ...notification
        }, ...prev]);
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === id ? { ...notif, read: true } : notif
            )
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map(notif => ({ ...notif, read: true }))
        );
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev =>
            prev.filter(notif => notif.id !== id)
        );
    }, []);

    const toggleNotifications = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const value = {
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        isOpen,
        toggleNotifications,
        unreadCount: notifications.filter(n => !n.read).length
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const NotificationBell = () => {
    const { unreadCount, toggleNotifications } = useNotifications();

    return (
        <button
            onClick={toggleNotifications}
            className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center transform -translate-y-1/2 translate-x-1/2">
          {unreadCount}
        </span>
            )}
        </button>
    );
};
