import React, { useState, useEffect, useRef } from 'react';
import { Member } from '../types.ts';
import { parseNaturalLanguageToMember } from '../services/geminiService.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { X, Bot, Send, User, Loader2 } from 'lucide-react';

interface ConversationalCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (memberData: Partial<Member>) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ConversationalCreatorModal: React.FC<ConversationalCreatorModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  addToast,
}) => {
  const initialMessage: Message = { id: 1, sender: 'bot', text: "Hello! Let's create a new customer. You can start by telling me their name and phone number." };
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [accumulatedData, setAccumulatedData] = useState<Partial<Member>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
        setMessages([initialMessage]);
        setInput('');
        setIsTyping(false);
        setAccumulatedData({});
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
        const { memberData, followUpQuestion } = await parseNaturalLanguageToMember(input, accumulatedData);
        
        const newAccumulatedData = { ...accumulatedData, ...memberData };
        setAccumulatedData(newAccumulatedData);

        const botMessage: Message = { id: Date.now() + 1, text: followUpQuestion, sender: 'bot' };
        setMessages(prev => [...prev, botMessage]);

    } catch (error) {
        console.error("Conversational creation failed:", error);
        addToast("The AI assistant had a problem. Please try again.", "error");
        const errorMessage: Message = { id: Date.now() + 1, text: "I'm sorry, I ran into an error. Could you please rephrase that?", sender: 'bot' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsTyping(false);
    }
  };

  const handleFinish = () => {
    if (Object.keys(accumulatedData).length === 0) {
        addToast("No data has been entered yet.", 'error');
        return;
    }
    onComplete(accumulatedData);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Bot size={24} className="text-brand-primary" />
                <h2 className="text-2xl font-bold text-brand-dark dark:text-white">Create Customer with AI</h2>
            </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto flex-grow h-96 flex flex-col" ref={chatContainerRef}>
        <div className="space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-start gap-3 max-w-md ${msg.sender === 'user' ? 'self-end ml-auto' : 'self-start'}`}>
            {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><Bot className="text-gray-600 dark:text-gray-300" size={18}/></div>}
            <div className={`
                ${msg.sender === 'user' 
                    ? 'bg-brand-primary text-white' 
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200'}
                rounded-lg py-2 px-3 shadow-sm animate-fade-in
            `}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
            {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0"><User className="text-blue-600 dark:text-blue-300" size={18}/></div>}
          </div>
        ))}
        {isTyping && (
             <div className="flex items-start gap-3 max-w-md self-start">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><Bot className="text-gray-600 dark:text-gray-300" size={18}/></div>
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg py-3 px-4 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-center gap-1.5">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                    </div>
                </div>
            </div>
        )}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
         <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
            <input type="text" placeholder="e.g., His name is Raj and phone is 9988776655" className="flex-1 bg-gray-100 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg text-sm px-4 py-2 text-gray-800 dark:text-white" value={input} onChange={(e) => setInput(e.target.value)} disabled={isTyping} />
            <button type="submit" className="text-white bg-brand-primary hover:bg-blue-700 p-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isTyping || !input.trim()} aria-label="Send message">
                <Send size={18} />
            </button>
        </form>
        <div className="flex justify-end p-2">
            <Button onClick={handleFinish} variant="success">
                Finish & Review Details
            </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConversationalCreatorModal;
