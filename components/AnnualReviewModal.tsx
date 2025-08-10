
import React from 'react';
import { Member } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { X, Loader2, Clipboard, ClipboardCheck, Shield } from 'lucide-react';

interface AnnualReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  isLoading: boolean;
  reviewContent: string;
  setReviewContent: (content: string) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const AnnualReviewModal: React.FC<AnnualReviewModalProps> = ({ isOpen, onClose, member, isLoading, reviewContent, setReviewContent, addToast }) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reviewContent).then(() => {
      setIsCopied(true);
      addToast('Report copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }, (err) => {
      addToast('Failed to copy report.', 'error');
      console.error('Could not copy text: ', err);
    });
  };

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-brand-primary animate-spin" />
        <Shield className="w-8 h-8 text-brand-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-gray-800 dark:text-white">Generating Annual Review...</h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Gemini is analyzing the client's profile to create a personalized report. This might take a moment.</p>
    </div>
  );

  const ContentState = () => (
    <>
      <div className="p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900">
        <textarea
          value={reviewContent}
          onChange={(e) => setReviewContent(e.target.value)}
          className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary focus:outline-none"
          placeholder="AI-generated review will appear here..."
        />
      </div>
      <div className="flex-shrink-0 flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 gap-3">
        <Button onClick={handleCopy} variant="light">
          {isCopied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
          {isCopied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
        <Button onClick={onClose} variant="primary">Close</Button>
      </div>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex-shrink-0 p-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-brand-dark dark:text-white">
              AI Annual Review for {member?.name || 'Client'}
            </h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {isLoading ? <LoadingState /> : <ContentState />}
    </Modal>
  );
};

export default AnnualReviewModal;