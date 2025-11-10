import React, { createContext, useContext } from 'react';
import { notification } from 'antd';
import type { NotificationInstance } from 'antd/es/notification/interface';

interface NotificationContextType {
  api: NotificationInstance;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = (): NotificationInstance => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context.api;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  return (
    <NotificationContext.Provider value={{ api }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};
