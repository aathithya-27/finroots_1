

import React, { useState, useEffect, useMemo } from 'react';
import { Member, Lead, UpsellOpportunity, TodaysFocusItem, ModalTab, Tab } from '../types.ts';
import { generateTodaysFocus } from '../services/geminiService.ts';
import { Loader2, Zap, Lightbulb, TrendingUp, AlertTriangle, Phone, Star, Eye, X } from 'lucide-react';
import Button from './ui/Button.tsx';

interface TodaysFocusProps {
    members: Member[];
    leads: Lead[];
    notifications: any[];
    upsellOpportunities: UpsellOpportunity[];
    setActiveTab: (tab: Tab) => void;
    onOpenModal: (member: Member | null, initialTab?: ModalTab | null) => void;
    onOpenLeadModal: (lead: Lead | null) => void;
    dismissedFocusItems: string[];
    onDismissFocusItem: (itemId: string) => void;
}

const FocusItemCard: React.FC<{ 
    item: TodaysFocusItem, 
    members: Member[], 
    leads: Lead[],
    onOpenModal: (member: Member | null, initialTab?: ModalTab | null) => void,
    onOpenLeadModal: (lead: Lead | null) => void,
    onDismiss: (itemId: string) => void;
}> = ({ item, members, leads, onOpenModal, onOpenLeadModal, onDismiss }) => {
    const priorityStyles = {
        High: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-500',
            icon: <AlertTriangle className="text-red-500" size={20} />
        },
        Medium: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-500',
            icon: <TrendingUp className="text-orange-500" size={20} />
        },
        Low: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-500',
            icon: <Lightbulb className="text-blue-500" size={20} />
        },
    };

    const style = priorityStyles[item.priority];
    const member = members.find(m => m.id === item.relatedId);
    const lead = leads.find(l => l.id === item.relatedId);

    const handleCall = () => {
        const phone = member?.mobile || lead?.phone;
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    };

    const handleView = () => {
        if (member) {
            onOpenModal(member);
        } else if (lead) {
            onOpenLeadModal(lead);
        }
    };


    return (
        <div className={`p-4 rounded-lg border-l-4 flex flex-col md:flex-row md:items-start gap-4 ${style.bg} ${style.border} relative group`}>
             <button 
                onClick={() => onDismiss(item.id)} 
                className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Dismiss item"
            >
                <X size={14} />
            </button>
            <div className="flex-shrink-0 mt-1">
                {style.icon}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-white">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.rationale}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 self-end md:self-start">
                 <Button onClick={handleCall} variant="light" size="small" disabled={!member && !lead}><Phone size={14}/> Call</Button>
                 <Button onClick={handleView} variant="secondary" size="small" disabled={!member && !lead}><Eye size={14}/> View</Button>
            </div>
        </div>
    );
};

const TodaysFocus: React.FC<TodaysFocusProps> = ({ members, leads, notifications, upsellOpportunities, setActiveTab, onOpenModal, onOpenLeadModal, dismissedFocusItems, onDismissFocusItem }) => {
    const [focusItems, setFocusItems] = useState<TodaysFocusItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFocusItems = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const items = await generateTodaysFocus({
                    members,
                    leads,
                    notifications,
                    upsellOpportunities,
                });
                setFocusItems(items);
            } catch (e) {
                console.error("Failed to generate today's focus:", e);
                setError("Could not load AI suggestions. Please try again later.");
                setFocusItems([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFocusItems();
    }, [members, leads, notifications, upsellOpportunities]);

    const visibleItems = useMemo(() => {
        return focusItems.filter(item => !dismissedFocusItems.includes(item.id));
    }, [focusItems, dismissedFocusItems]);


    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                    <Zap size={20} className="text-brand-primary" />
                    Today's Focus
                </h3>
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    <p className="mt-3 font-semibold">Gemini is analyzing your day...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <Zap size={20} className="text-brand-primary" />
                Today's Focus
            </h3>
            <div className="max-h-80 overflow-y-auto pr-2 -mr-2">
                {error ? (
                    <div className="text-center py-10 text-red-600">{error}</div>
                ) : visibleItems.length > 0 ? (
                    <div className="space-y-4">
                        {visibleItems.map(item => <FocusItemCard key={item.id} item={item} members={members} leads={leads} onOpenModal={onOpenModal} onOpenLeadModal={onOpenLeadModal} onDismiss={onDismissFocusItem} />)}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 h-full flex flex-col justify-center">
                        <Star size={32} className="mx-auto text-gray-300 dark:text-gray-600"/>
                        <p className="mt-2 font-semibold">All Clear!</p>
                        <p className="text-sm">No high-priority actions from the AI today.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodaysFocus;
