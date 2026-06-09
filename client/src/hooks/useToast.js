import { useState, useCallback } from 'react';

let id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const toastId = ++id;
    setToasts(prev => [...prev, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, duration);
  }, []);

  return { toasts, toast };
}
