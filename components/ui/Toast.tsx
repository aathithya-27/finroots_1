
import React, { useEffect, useState, useRef } from 'react';
import { ToastData } from '../../types.ts';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  toast: ToastData;
  onRemove: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to handle closing and removal, used by both the timer and the close button
  const handleClose = () => {
    // Prevent the function from running multiple times
    if (isExiting) return;

    // If an auto-dismiss timer is running, clear it
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Trigger the exit animation
    setIsExiting(true);

    // After the exit animation completes, call the parent to remove the toast from the state
    setTimeout(() => {
      onRemove(toast.id);
    }, 400); // Animation is 300ms, giving a small buffer
  };

  // Set up the auto-dismiss timer when the component mounts
  useEffect(() => {
    timerRef.current = setTimeout(handleClose, 5000);

    // Clean up the timer if the component unmounts for any other reason
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const isSuccess = toast.type === 'success';
  const icon = isSuccess ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />;
  
  const containerClasses = `
    flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg
    ring-1 ring-black ring-opacity-5
    transform transition-all duration-300 ease-in-out
    dark:bg-gray-800 dark:text-gray-400 dark:ring-white/10
    ${isExiting ? 'opacity-0 translate-y-2' : 'animate-fade-in' }
  `;
  
  return (
    <div className={containerClasses}>
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
        {icon}
      </div>
      <div className="ml-3 text-sm font-normal text-gray-700 dark:text-gray-200">{toast.message}</div>
      <button 
        type="button" 
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-700" 
        aria-label="Close"
        onClick={handleClose}
      >
        <span className="sr-only">Close</span>
        <X size={20} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-5 right-5 z-[2000] w-full max-w-xs space-y-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default ToastContainer;
