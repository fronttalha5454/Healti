import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface NotificationContextType {
  showNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {message && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#10B981', color: 'white', padding: '12px 20px',
          borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'sans-serif'
        }}>
          {message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
