
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, contentClassName }) => {
  if (!isOpen) return null;

  const defaultClasses = "bg-white rounded-lg shadow-xl w-full max-w-5xl transform transition-all dark:bg-gray-800 flex flex-col max-h-[90vh]";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex justify-center items-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={contentClassName || defaultClasses}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
