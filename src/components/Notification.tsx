"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

type NotificationType = "success" | "error" | "warning" | "info";

type Notification = {
  id: number;
  message: string;
  type: NotificationType;
};

type NotificationContextType = {
  showNotification: (message: string, type: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg shadow-lg max-w-md ${
                notification.type === "error"
                  ? "bg-red-50 border border-red-200 text-red-600"
                  : notification.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-600"
                  : notification.type === "warning"
                  ? "bg-yellow-50 border border-yellow-200 text-yellow-600"
                  : "bg-blue-50 border border-blue-200 text-blue-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <p>{notification.message}</p>
                <button
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.filter((n) => n.id !== notification.id)
                    )
                  }
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
} 