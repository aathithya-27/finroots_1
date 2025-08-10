
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Bot, Send, Plus, Trash2, Edit2, Save, XCircle, MessageCircle, Tv, TestTube2, MessageSquare, Briefcase } from 'lucide-react';
import Button from './ui/Button.tsx';
import { Member } from '../types.ts';
import { getChatbotResponse, getAutomatedClientResponse } from '../services/geminiService.ts';

type BotTab = 'assistant' | 'simulator' | 'replies' | 'broadcast';

interface BotResponse {
    id: number;
    keyword: string;
    response: string;
}

interface BotAction {
    label: string;
    type: 'send_whatsapp';
    payload: {
        mobile: string;
        message: string;
    }
}

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    suggestions?: string[];
    actions?: BotAction[];
}

interface WhatsAppBotProps {
  members: Member[];
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const handleWhatsAppRedirect = (mobile: string, message: string) => {
    const cleanedMobile = mobile.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = cleanedMobile.startsWith('91') ? cleanedMobile : `91${cleanedMobile}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
};


const ChatWindow = ({ messages, onSendMessage, onSuggestionClick, isTyping, input, setInput, placeholder, initialSuggestions }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isTyping]);
    
    const lastBotMessage = messages.filter(m => m.sender === 'bot').pop();

    return (
        <div className="bg-white dark:bg-gray-900/50 border dark:border-gray-700 rounded-lg h-[60vh] min-h-[450px] max-h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" ref={chatContainerRef}>
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col max-w-lg ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                        <div className={`
                            ${msg.sender === 'user' 
                                ? 'bg-blue-500 text-white rounded-tr-none' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'}
                            rounded-xl py-2 px-3 shadow-sm animate-fade-in
                        `}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {msg.sender === 'bot' && msg.actions && msg.actions.length > 0 && (
                             <div className="flex flex-wrap gap-2 mt-2">
                                {msg.actions.map((action, index) => (
                                    <Button key={index} size="small" variant="light" onClick={() => handleWhatsAppRedirect(action.payload.mobile, action.payload.message)}>
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                 {isTyping && (
                    <div className="self-start flex items-center gap-2 animate-fade-in">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl rounded-tl-none p-3 shadow-sm">
                            <div className="flex items-center justify-center gap-1.5">
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
             {(lastBotMessage?.suggestions || (messages.length === 1 && initialSuggestions)) && !isTyping && (
                <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                    {(lastBotMessage?.suggestions || initialSuggestions).map((suggestion, index) => (
                        <button key={index} onClick={() => onSuggestionClick(suggestion)} className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/50 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900">
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={(e) => { e.preventDefault(); onSendMessage(input); }} className="flex items-center gap-2">
                    <input type="text" placeholder={placeholder} className="flex-1 bg-transparent focus:outline-none text-sm px-3 py-2 text-gray-800 dark:text-white" value={input} onChange={(e) => setInput(e.target.value)} disabled={isTyping} />
                    <button type="submit" className="text-white bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isTyping || !input.trim()} aria-label="Send message">
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};


const WhatsAppBot: React.FC<WhatsAppBotProps> = ({ members, addToast }) => {
  const [activeTab, setActiveTab] = useState<BotTab>('assistant');
  const [botResponses, setBotResponses] = useState<BotResponse[]>([
      { id: 1, keyword: 'policy', response: 'To get your policy details, could you please provide your registered mobile number? Our team will assist you shortly.' },
      { id: 2, keyword: 'renewal', response: 'For policy renewal, please provide your policy number. An agent will contact you with the renewal link and payment details.' },
      { id: 3, keyword: 'claim', response: 'To initiate a claim, please provide your policy number and a brief description of the incident. We will guide you through the next steps.' },
  ]);
  
  const [editingResponseId, setEditingResponseId] = useState<number | null>(null);
  const [editedKeyword, setEditedKeyword] = useState('');
  const [editedResponse, setEditedResponse] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  
  // AI Assistant State
  const assistantInitialMsg: Message = { id: 1, sender: 'bot', text: "Hello! I am FinBot, your AI assistant for FinRoots CRM. How can I help you today?" };
  const [assistantMessages, setAssistantMessages] = useState<Message[]>([assistantInitialMsg]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const assistantInitialSuggestions = ["Who is Priya Sharma?", "Renewals due this month", "Upsell ideas for Kavya Reddy"];

  // Client Simulator State
  const simulatorInitialMsg: Message = { id: 1, sender: 'bot', text: "Welcome to FinRoots support! How can I assist you today?" };
  const [simulatorMessages, setSimulatorMessages] = useState<Message[]>([simulatorInitialMsg]);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [isSimulatorTyping, setIsSimulatorTyping] = useState(false);
  const [simulatedClient, setSimulatedClient] = useState<Member | null>(null);
  

  const customerSegments = useMemo(() => ({
      'Silver Members': members.filter(m => m.memberType === 'Silver'),
      'Gold Members': members.filter(m => m.memberType === 'Gold'),
      'Diamond Members': members.filter(m => m.memberType === 'Diamond'),
      'Platinum Members': members.filter(m => m.memberType === 'Platinum'),
  }), [members]);

  const handleAdminSendMessage = async (text: string) => {
    if (!text.trim() || isAssistantTyping) return;

    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    setAssistantMessages(prev => [...prev, userMessage]);
    setAssistantInput('');
    setIsAssistantTyping(true);

    const botText = await getChatbotResponse(text, members, addToast);
    
    let suggestions: string[] = [];
    let actions: BotAction[] = [];

    // Simple frontend logic to find mentioned members and create actions
    members.forEach(member => {
      if (botText.toLowerCase().includes(member.name.toLowerCase())) {
        suggestions.push(`What are ${member.name}'s policies?`);
        if (botText.toLowerCase().includes('renewal')) {
            actions.push({
                label: `Send renewal reminder to ${member.name}`,
                type: 'send_whatsapp',
                payload: { mobile: member.mobile, message: `Hi ${member.name}, this is a friendly reminder about your upcoming policy renewal. Please get in touch with us to complete the process. Thank you!` }
            });
        }
      }
    });

    const botMessage: Message = { id: Date.now() + 1, text: botText, sender: 'bot', suggestions, actions };
    setAssistantMessages(prev => [...prev, botMessage]);
    setIsAssistantTyping(false);
  };
  
  const handleClientSendMessage = async (text: string) => {
    if (!text.trim() || isSimulatorTyping) return;

    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    setSimulatorMessages(prev => [...prev, userMessage]);
    setSimulatorInput('');
    setIsSimulatorTyping(true);

    let botText = '';
    // 1. Check for keyword matches
    const matchedResponse = botResponses.find(r => text.toLowerCase().includes(r.keyword.toLowerCase()));

    if (matchedResponse) {
        botText = matchedResponse.response;
    } else {
    // 2. If no keyword, use AI fallback
        botText = await getAutomatedClientResponse(text, addToast);
    }
    
    const botMessage: Message = { id: Date.now() + 1, text: botText, sender: 'bot' };
    setSimulatorMessages(prev => [...prev, botMessage]);
    setIsSimulatorTyping(false);
  };


  const handleAddNewResponse = () => {
    const newId = botResponses.length > 0 ? Math.max(...botResponses.map(r => r.id)) + 1 : 1;
    const newResponse = { id: newId, keyword: '', response: '' };
    setBotResponses([...botResponses, newResponse]);
    setEditingResponseId(newId);
    setEditedKeyword('');
    setEditedResponse('');
  };

  const handleEditClick = (response: BotResponse) => {
    setEditingResponseId(response.id);
    setEditedKeyword(response.keyword);
    setEditedResponse(response.response);
  };

  const handleCancelEdit = () => {
    const isNewUnsaved = !botResponses.find(r => r.id === editingResponseId)?.keyword;
    if (isNewUnsaved) setBotResponses(botResponses.filter(r => r.id !== editingResponseId));
    setEditingResponseId(null);
  };

  const handleSaveResponse = (id: number) => {
    if (!editedKeyword.trim() || !editedResponse.trim()) {
        addToast('Keyword and response cannot be empty.', 'error');
        return;
    }
    setBotResponses(botResponses.map(r => r.id === id ? { ...r, keyword: editedKeyword, response: editedResponse } : r));
    setEditingResponseId(null);
    addToast('Bot response saved successfully!', 'success');
  };
  
  const handleDeleteResponse = (id: number) => {
      setBotResponses(botResponses.filter(r => r.id !== id));
      addToast('Bot response deleted.', 'success');
  }
  
  const handleSegmentToggle = (segment: string) => {
      setSelectedSegments(prev => prev.includes(segment) ? prev.filter(s => s !== segment) : [...prev, segment]);
  };

  const handleSendBroadcast = () => {
    if (selectedSegments.length === 0) {
        addToast("Please select at least one customer segment.", "error");
        return;
    }
    if (!broadcastMessage.trim()) {
        addToast("Broadcast message cannot be empty.", "error");
        return;
    }

    const totalCustomers = selectedSegments.reduce((acc, segment) => acc + (customerSegments[segment]?.length || 0), 0);
    addToast(`Simulating broadcast to ${totalCustomers} customers.`, "success");
    setBroadcastMessage('');
    setSelectedSegments([]);
  };
  
  const TabButton = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex-shrink-0 w-32 flex flex-col items-center justify-center gap-1 p-3 text-sm font-semibold rounded-md transition-colors border-b-4 ${ isActive ? 'text-brand-primary border-brand-primary' : 'text-gray-500 border-transparent hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60' }`}>
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center gap-2 overflow-x-auto">
                <TabButton label="AI Assistant" icon={<Bot size={20} />} isActive={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} />
                <TabButton label="Client Simulator" icon={<TestTube2 size={20} />} isActive={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} />
                <TabButton label="Automated Replies" icon={<MessageSquare size={20} />} isActive={activeTab === 'replies'} onClick={() => setActiveTab('replies')} />
                <TabButton label="Broadcast Center" icon={<Tv size={20} />} isActive={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} />
            </div>
        </div>

        {activeTab === 'assistant' && (
            <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center"><Bot className="text-blue-600 dark:text-blue-300" /></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">FinBot AI Assistant</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your internal tool for quick customer insights and actions.</p>
                  </div>
                </div>
                <ChatWindow messages={assistantMessages} onSendMessage={handleAdminSendMessage} onSuggestionClick={handleAdminSendMessage} isTyping={isAssistantTyping} input={assistantInput} setInput={setAssistantInput} placeholder="Ask about customers, policies, renewals..." initialSuggestions={assistantInitialSuggestions} />
            </div>
        )}

        {activeTab === 'simulator' && (
             <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center"><MessageCircle className="text-green-600 dark:text-green-300" /></div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Client Conversation Simulator</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Test your automated replies from a client's perspective.</p>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Simulate as:</label>
                    <select
                        onChange={(e) => setSimulatedClient(members.find(m => m.id === e.target.value) || null)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Select a client to simulate...</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                {simulatedClient ? (
                    <ChatWindow messages={simulatorMessages} onSendMessage={handleClientSendMessage} onSuggestionClick={handleClientSendMessage} isTyping={isSimulatorTyping} input={simulatorInput} setInput={setSimulatorInput} placeholder={`Type a message as ${simulatedClient.name}...`} initialSuggestions={[]} />
                ) : (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400 border-2 border-dashed rounded-lg">Select a client to begin the simulation.</div>
                )}
            </div>
        )}

        {activeTab === 'replies' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Keyword-based Responses</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Set up automated replies for common client questions. These will be triggered in the client simulator.</p>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {botResponses.map(res => (
                        <div key={res.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
                            {editingResponseId === res.id ? (
                                <div className="space-y-2">
                                    <input type="text" value={editedKeyword} onChange={(e) => setEditedKeyword(e.target.value)} placeholder="Keyword (e.g., 'claim')" className="w-full p-2 border rounded-md font-semibold dark:bg-gray-800 dark:border-gray-500"/>
                                    <textarea value={editedResponse} onChange={(e) => setEditedResponse(e.target.value)} placeholder="Bot's automated reply" className="w-full h-24 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-500" />
                                    <div className="flex justify-end gap-2"><Button size="small" variant="secondary" onClick={handleCancelEdit}><XCircle size={14}/> Cancel</Button><Button size="small" variant="success" onClick={() => handleSaveResponse(res.id)}><Save size={14}/> Save</Button></div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div><p className="text-xs text-gray-500 dark:text-gray-400">Keyword</p><p className="font-semibold text-brand-primary dark:text-blue-400">{res.keyword || '(not set)'}</p></div>
                                    <div><p className="text-xs text-gray-500 dark:text-gray-400">Bot Response</p><p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{res.response || '(not set)'}</p></div>
                                    <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-600/50"><Button size="small" variant="light" onClick={() => handleEditClick(res)}><Edit2 size={14}/> Edit</Button><Button size="small" variant="danger" onClick={() => handleDeleteResponse(res.id)}><Trash2 size={14}/> Delete</Button></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <Button onClick={handleAddNewResponse} variant="secondary" className="mt-4"><Plus size={16}/>Add New Response</Button>
            </div>
        )}

        {activeTab === 'broadcast' && (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Broadcast Messaging</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">1. Select Customer Segments</h4>
                        <div className="space-y-2">
                            {Object.entries(customerSegments).map(([segment, segmentMembers]) => (
                                <label key={segment} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary" checked={selectedSegments.includes(segment)} onChange={() => handleSegmentToggle(segment)} />
                                    <span className="text-sm text-gray-800 dark:text-gray-200">{segment}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({segmentMembers.length} customer{segmentMembers.length !== 1 ? 's' : ''})</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                         <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">2. Compose Message</h4>
                         <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Enter your broadcast message..." className="w-full h-40 p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600" maxLength={1000} />
                         <p className="text-xs text-gray-400 text-right mt-1">{broadcastMessage.length}/1000</p>
                         <Button variant="success" onClick={handleSendBroadcast} className="w-full mt-4"><Send size={16}/>Send Broadcast</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default WhatsAppBot;
