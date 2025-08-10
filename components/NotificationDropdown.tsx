

import React from 'react';
import { Gift, Shield, MessageSquare, Bell, ArrowRight, X, Star } from 'lucide-react';
import Button from './ui/Button.tsx';
import { Notification } from '../types.ts';

interface NotificationDropdownProps {
  notifications: Notification[];
  isCleared: boolean;
  onViewAll: () => void;
  onClearAll: () => void;
}

const getIconForType = (type: Notification['type']) => {
    switch (type) {
        case 'Birthday': return <Gift className="text-pink-500 flex-shrink-0" size={20}/>;
        case 'Anniversary': return <MessageSquare className="text-purple-500 flex-shrink-0" size={20} />;
        case 'Policy Renewal': return <Shield className="text-blue-500 flex-shrink-0" size={20}/>;
        case 'Custom': return <Bell className="text-teal-500 flex-shrink-0" size={20}/>;
        case 'Special Occasion': return <Star className="text-yellow-500 flex-shrink-0" size={20}/>;
        default: return <Bell className="text-gray-500 flex-shrink-0" size={20} />;
    }
};

const getShortMessage = (notification: Notification) => {
    switch (notification.type) {
        case 'Birthday': return `Birthday: ${notification.member.name}`;
        case 'Anniversary': return `Anniversary: ${notification.member.name}`;
        case 'Policy Renewal': return `Renewal due for ${notification.policy?.policyType}`;
        case 'Special Occasion': return `${notification.occasionName || 'Special Occasion'}: ${notification.member.name}`;
        default: 
            const shortMessage = notification.message || '';
            return shortMessage.substring(0, 40) + (shortMessage.length > 40 ? '...' : '');
    }
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, isCleared, onViewAll, onClearAll }) => {
  const visibleNotifications = notifications.filter(n => !n.dismissed);
  const showEmptyState = visibleNotifications.length === 0 || isCleared;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-fade-in origin-top-right dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
            {!showEmptyState && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onClearAll();
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                  aria-label="Clear all notifications"
                >
                  <X size={12}/> Clear All
                </button>
            )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
            {showEmptyState ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600"/>
                    <p className="mt-2 text-sm">You're all caught up!</p>
                </div>
            ) : (
                <ul className="divide-y divide-y-gray-100 dark:divide-gray-700">
                    {visibleNotifications.slice(0, 7).map(notification => ( // Show a limited number
                        <li key={notification.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                            <button onClick={onViewAll} className="w-full flex items-start gap-3 text-left">
                                {getIconForType(notification.type)}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{getShortMessage(notification)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        For: {notification.member.name} on {new Date(notification.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        
        <div className="p-2 border-t border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 rounded-b-xl">
            <Button
                variant="light"
                onClick={onViewAll}
                className="w-full !justify-center !bg-transparent !border-0 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-brand-primary !font-medium"
            >
                View all in Action Hub <ArrowRight size={14} className="ml-1"/>
            </Button>
        </div>
    </div>
  );
};

export default NotificationDropdown;