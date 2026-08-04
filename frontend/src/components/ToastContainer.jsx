import React, { useState, useEffect } from 'react';
import { subscribeApiError } from '../api/client';
import { AlertCircle, X } from 'lucide-react';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeApiError((message) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
    });

    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div 
      data-testid="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-2xl animate-slide-up border"
          style={{
            background: 'rgba(13, 21, 38, 0.95)',
            borderColor: 'rgba(244, 63, 94, 0.4)',
            color: '#e2eaf5',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#f43f5e' }} />
            <p className="text-xs font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
