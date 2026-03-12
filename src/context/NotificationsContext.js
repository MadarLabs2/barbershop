import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUnreadNotificationsCount, markNotificationAsRead as markReadApi } from '../lib/notificationsData';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const userPhone = user?.phone ? String(user.phone).replace(/\D/g, '') : null;

  const refreshUnreadCount = useCallback(async () => {
    if (!userPhone) {
      setUnreadCount(0);
      return;
    }
    const count = await getUnreadNotificationsCount(userPhone);
    setUnreadCount(count);
  }, [userPhone]);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!notificationId || !userPhone) return false;
      const ok = await markReadApi(notificationId, userPhone);
      if (ok) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return ok;
    },
    [userPhone]
  );

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const value = {
    unreadCount,
    refreshUnreadCount,
    markAsRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
