

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
    Bell, Gift, Shield, Calendar as CalendarIcon, Mic, StopCircle, Trash2, AlertCircle, CheckSquare, MessageSquare, 
    Link, MessageCircle as WhatsAppIcon, Save, Star, X, Check, Loader2, User, Send, Watch, History, 
    Cog, Clock, Workflow, Plus, Edit2, Zap, FileArchive
} from 'lucide-react';
import Button from './ui/Button.tsx';
import { Member, ActivityLog, Appointment, Task, UpsellOpportunity, CustomScheduledMessage, AutomationRule, ProcessStage, DocTemplate, User as UserType, Notification, ModalTab } from '../types.ts';
import Input from './ui/Input.tsx';
import DocumentHub from './DocumentHub.tsx';
import Modal from './ui/Modal.tsx';

// Helper components & functions from original files, slightly adapted
const handleSendMessage = (type: 'sms' | 'whatsapp', mobile: string, message: string) => {
    const cleanedMobile = mobile.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    let url = '';
    if (type === 'sms') {
        url = `sms:${cleanedMobile}?body=${encodedMessage}`;
    } else {
        const whatsappNumber = cleanedMobile.startsWith('91') ? cleanedMobile : `91${cleanedMobile}`;
        url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    }
    window.open(url, '_blank');
};

const CustomMessageScheduler: React.FC<{ members: Member[]; onSchedule: (message: Omit<CustomScheduledMessage, 'id'>) => void; addToast: (message: string, type?: 'success' | 'error') => void; }> = ({ members, onSchedule, addToast }) => {
    const [memberId, setMemberId] = useState<string>('');
    const [dateTime, setDateTime] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!memberId || !dateTime || !message) {
            addToast('Please fill all fields to schedule a message.', 'error');
            return;
        }
        onSchedule({ memberId, dateTime, message });
        setMemberId('');
        setDateTime('');
        setMessage('');
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <Watch /> Custom Message Scheduler
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="member-select-msg" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Member</label>
                        <select id="member-select-msg" value={memberId} onChange={(e) => setMemberId(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="" disabled>-- Choose a member --</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="schedule-datetime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date & Time</label>
                        <Input type="datetime-local" id="schedule-datetime" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label htmlFor="schedule-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                    <textarea id="schedule-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Your personalized message..."/>
                </div>
                <div className="text-right">
                    <Button type="submit" variant="primary"><Send size={16} /> Schedule Message</Button>
                </div>
            </form>
        </div>
    );
};

const AppointmentScheduler: React.FC<{ members: Member[]; onSchedule: (details: { memberId: string, dateTime: string }) => void; addToast: (message: string, type?: 'success' | 'error') => void; }> = ({ members, onSchedule, addToast }) => {
    const [memberId, setMemberId] = useState<string>('');
    const [dateTime, setDateTime] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!memberId || !dateTime) {
            addToast('Please select a member and a date/time to schedule an appointment.', 'error');
            return;
        }
        onSchedule({ memberId, dateTime });
        setMemberId('');
        setDateTime('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <CalendarIcon /> Appointment Scheduler
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="member-select-appt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Member</label>
                        <select id="member-select-appt" value={memberId} onChange={(e) => setMemberId(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="" disabled>-- Choose a member --</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.processStage})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="appt-datetime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date & Time</label>
                        <Input type="datetime-local" id="appt-datetime" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
                    </div>
                </div>
                <div className="text-right">
                    <Button type="submit" variant="primary"><CalendarIcon size={16} /> Schedule Appointment</Button>
                </div>
            </form>
        </div>
    );
};

const OneTimeAudioRecorder: React.FC<{ savedGreetingUrl: string | null; setSavedGreetingUrl: (url: string | null) => void; addToast: (message: string, type?: 'success' | 'error') => void; }> = ({ savedGreetingUrl, setSavedGreetingUrl, addToast }) => {
    const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = event => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const url = URL.createObjectURL(audioBlob);
                setAudioBlobUrl(url);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            addToast('Recording started...', 'success');
        } catch (err) {
            console.error("Error starting recording:", err);
            addToast("Could not start recording. Please ensure microphone permissions are granted.", "error");
        }
    };
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };
    const handleSaveGreeting = () => {
        if (audioBlobUrl) {
            setSavedGreetingUrl(audioBlobUrl);
            addToast("Generic voice greeting saved!", 'success');
        }
    };
    const handleClearGreeting = () => {
        if(savedGreetingUrl) URL.revokeObjectURL(savedGreetingUrl);
        setSavedGreetingUrl(null);
        if(audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
        setAudioBlobUrl(null);
        addToast("Saved greeting cleared.", "success");
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <Save size={20} className="text-brand-primary" /> One-Time Audio Recordings
            </h3>
            {savedGreetingUrl ? (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">You have a saved generic greeting. It can be sent from the Automation Hub.</p>
                    <audio src={savedGreetingUrl} controls className="w-full" />
                    <Button onClick={handleClearGreeting} variant="danger" size="small"><Trash2 size={14} /> Clear Saved Greeting</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Record a single voice message to use as a generic greeting for multiple customers. This adds a personal touch to automated birthday and anniversary wishes.</p>
                    <div className="flex items-center gap-4">
                        {!isRecording ? <Button onClick={startRecording} disabled={isRecording} variant="primary"><Mic size={16} /> Record Greeting</Button> : <Button onClick={stopRecording} disabled={!isRecording} variant="danger"><StopCircle size={16} /> Stop Recording</Button>}
                        {isRecording && <span className="text-red-500 font-medium animate-pulse flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Recording...</span>}
                    </div>
                    {audioBlobUrl && !savedGreetingUrl && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3 animate-fade-in">
                            <p className="text-sm font-medium">Your new recording:</p>
                            <audio src={audioBlobUrl} controls className="w-full" />
                            <Button onClick={handleSaveGreeting} variant="success"><Save size={16} /> Save as Generic Greeting</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ChannelTag: React.FC<{ channel: 'whatsapp' | 'sms' | 'email' | 'call' | string }> = ({ channel }) => {
    const style = {
        whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        sms: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
        email: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
        call: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
    }[channel] || 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    return <span className={`px-2 py-1 text-xs font-medium rounded ${style}`}>{channel}</span>;
};

// Main Component Props
interface ActionAutomationHubProps {
    notifications: Notification[];
    onRenewPolicy: (memberId: string, policyId: string) => Promise<boolean>;
    activityLog: ActivityLog[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    onNotificationSent: (notificationId: string) => void;
    appointments: Appointment[];
    tasks: Task[];
    onToggleTask: (taskId: string) => void;
    onDeleteAppointment: (appointmentId: string) => void;
    savedGreetingUrl: string | null;
    setSavedGreetingUrl: (url: string | null) => void;
    upsellOpportunities: UpsellOpportunity[];
    onDismissOpportunity: (opportunityId: string) => void;
    members: Member[];
    onScheduleMessage: (message: Omit<CustomScheduledMessage, 'id'>) => void;
    onClearAll: () => void;
    onScheduleAppointment: (details: { memberId: string; dateTime: string }) => void;
    rules: AutomationRule[];
    onUpdateRule: (rule: AutomationRule) => void;
    onAddRule: (rule: Omit<AutomationRule, 'id' | 'icon'>) => void;
    processFlow: ProcessStage[];
    onUpdateProcessFlow: (newFlow: ProcessStage[]) => void;
    docTemplates: DocTemplate[];
    onUpdateTemplates: (templates: DocTemplate[]) => void;
    currentUser: UserType | null;
    users: UserType[];
    onViewMember: (member: Member, initialTab?: ModalTab) => void;
}

const AddRuleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddRule: (rule: Omit<AutomationRule, 'id' | 'icon'>) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}> = ({ isOpen, onClose, onAddRule, addToast }) => {
    const [type, setType] = useState<AutomationRule['type']>('Birthday Messages');
    const [timingValue, setTimingValue] = useState(7);
    const [timingUnit, setTimingUnit] = useState<'days' | 'weeks'>('days');
    const [template, setTemplate] = useState('');
    const [channels, setChannels] = useState<('whatsapp' | 'sms' | 'email' | 'call')[]>([]);

    const handleChannelChange = (channel: 'whatsapp' | 'sms' | 'email' | 'call') => {
        setChannels(prev => 
            prev.includes(channel) 
                ? prev.filter(c => c !== channel)
                : [...prev, channel]
        );
    };

    const handleSave = () => {
        if (!template.trim()) {
            addToast('Template message cannot be empty.', 'error');
            return;
        }
        if (channels.length === 0) {
            addToast('Please select at least one channel.', 'error');
            return;
        }

        onAddRule({
            type,
            timing: { value: timingValue, unit: timingUnit, relation: 'before' },
            template,
            channels,
            enabled: true,
        });
        onClose();
    };

    const allChannels: ('whatsapp' | 'sms' | 'email' | 'call')[] = ['whatsapp', 'sms', 'email', 'call'];

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">Add New Automation Rule</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Type</label>
                        <select value={type} onChange={e => setType(e.target.value as AutomationRule['type'])} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option>Birthday Messages</option>
                            <option>Anniversary Messages</option>
                            <option>Policy Renewal Messages</option>
                            <option>Special Occasion Messages</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger Timing</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={timingValue}
                                onChange={e => setTimingValue(parseInt(e.target.value) || 0)}
                                className="w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <select value={timingUnit} onChange={e => setTimingUnit(e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                            </select>
                            <span className="text-gray-600 dark:text-gray-300">before</span>
                        </div>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channels</label>
                    <div className="flex flex-wrap gap-3">
                        {allChannels.map(channel => (
                             <label key={channel} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                                <input type="checkbox" checked={channels.includes(channel)} onChange={() => handleChannelChange(channel)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                {channel.charAt(0).toUpperCase() + channel.slice(1)}
                            </label>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Template</label>
                    <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={4} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Placeholders: {'{name}, {policyType}, {days}, {premium}, {renewalLink}'}</p>
                </div>
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Add Rule</Button>
            </div>
        </Modal>
    );
}

type HubTab = 'actions' | 'automation' | 'workflow' | 'tools';

const UpsellOpportunityCard: React.FC<{
    opportunity: UpsellOpportunity;
    onDismiss: (id: string) => void;
    onViewMember: (member: Member, initialTab?: ModalTab) => void;
    members: Member[];
}> = ({ opportunity, onDismiss, onViewMember, members }) => {
    const member = members.find(m => m.id === opportunity.memberId);
    
    const handleViewClick = () => {
        if(member) {
            onViewMember(member, ModalTab.Policies);
        }
    }

    return (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Star className="text-yellow-500 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-indigo-800 dark:text-indigo-200">{opportunity.memberName}</p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">{opportunity.suggestions}</p>
                </div>
            </div>
            <div className="w-full md:w-auto flex-shrink-0 flex items-center justify-end gap-2 flex-wrap">
                <Button variant="danger" size="small" onClick={() => onDismiss(opportunity.id)}>
                    <X size={14} /> Dismiss
                </Button>
                <Button variant="light" size="small" onClick={handleViewClick} disabled={!member}>
                    <User size={14} /> View Customer
                </Button>
            </div>
        </div>
    );
};

// Main Component
export const ActionAutomationHub: React.FC<ActionAutomationHubProps> = ({
    notifications, onRenewPolicy, activityLog, addToast, onNotificationSent, appointments, tasks, onToggleTask,
    onDeleteAppointment, savedGreetingUrl, setSavedGreetingUrl, upsellOpportunities, onDismissOpportunity, members,
    onScheduleMessage, onClearAll, onScheduleAppointment, rules, onUpdateRule, onAddRule, processFlow, onUpdateProcessFlow,
    docTemplates, onUpdateTemplates, currentUser, users, onViewMember
}) => {
    const [activeHubTab, setActiveHubTab] = useState<HubTab>('actions');

    // --- State for Automation Rules ---
    const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
    const [editedTemplate, setEditedTemplate] = useState('');
    const [editedTiming, setEditedTiming] = useState<{ value: number; unit: 'days' | 'weeks' }>({ value: 7, unit: 'days' });
    const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);

    // --- State for Workflow Management ---
    const [editingStage, setEditingStage] = useState<{ index: number; name: string } | null>(null);
    const [newStageName, setNewStageName] = useState('');

    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [overdue, setOverdue] = useState<any[]>([]);
    
    // --- State for Task Filtering (Admin) ---
    const [adminTaskFilter, setAdminTaskFilter] = useState('all');

    useEffect(() => {
        const upcomingNotifications: any[] = [];
        const overdueNotifications: any[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        notifications.forEach(n => {
            const eventDate = new Date(n.date);
            eventDate.setHours(0, 0, 0, 0);
            if (n.type.includes('Renewal') && eventDate < today) {
                overdueNotifications.push(n);
            } else {
                upcomingNotifications.push(n);
            }
        });
        
        setUpcoming(upcomingNotifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setOverdue(overdueNotifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }, [notifications]);

    // --- Automation Rules Logic ---
    const toggleRule = (id: number) => {
        if(editingRuleId === id) handleCancelClick();
        const ruleToUpdate = rules.find(r => r.id === id);
        if(ruleToUpdate) onUpdateRule({ ...ruleToUpdate, enabled: !ruleToUpdate.enabled });
    };
    const handleEditClick = (rule: AutomationRule) => {
        setEditingRuleId(rule.id);
        setEditedTemplate(rule.template);
        setEditedTiming({ value: rule.timing.value, unit: rule.timing.unit });
    };
    const handleSaveClick = (ruleId: number) => {
        const ruleToUpdate = rules.find(r => r.id === ruleId);
        if(ruleToUpdate) onUpdateRule({ ...ruleToUpdate, template: editedTemplate, timing: { ...ruleToUpdate.timing, ...editedTiming } });
        setEditingRuleId(null);
    };
    const handleCancelClick = () => setEditingRuleId(null);

    // --- Workflow Management Logic ---
    const handleAddStage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newStageName.trim() === '') return addToast('Stage name cannot be empty.', 'error');
        onUpdateProcessFlow([...processFlow, newStageName.trim()]);
        setNewStageName('');
    };
    const handleRenameStage = () => {
        if (!editingStage) return;
        if (editingStage.name.trim() === '') return addToast('Stage name cannot be empty.', 'error');
        const newFlow = [...processFlow];
        newFlow[editingStage.index] = editingStage.name.trim();
        onUpdateProcessFlow(newFlow);
        setEditingStage(null);
    };
    const handleDeleteStage = (index: number) => {
        if (processFlow.length <= 1) return addToast('Cannot delete the last stage.', 'error');
        if (window.confirm(`Are you sure you want to delete the stage "${processFlow[index]}"?`)) {
            const newFlow = processFlow.filter((_, i) => i !== index);
            onUpdateProcessFlow(newFlow);
        }
    };
    
    // --- Notification Center Logic ---
    const handleAction = (notificationId: string) => onNotificationSent(notificationId);
    const handleRenew = async (memberId: string, policyId: string, notificationId: string) => {
        if (await onRenewPolicy(memberId, policyId)) handleAction(notificationId);
    };
    const handleSendGenericMessage = (mobile: string, message: string, notificationId: string) => {
        handleSendMessage('whatsapp', mobile, message);
        addToast('Message opened in WhatsApp.', 'success');
        handleAction(notificationId);
    };
    
    const visibleTasks = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'Admin') {
            if (adminTaskFilter === 'all') {
                return tasks;
            }
            return tasks.filter(task => task.primaryContactPerson === adminTaskFilter);
        }
        const assignedMemberIds = new Set(members.filter(m => m.assignedTo?.includes(currentUser.id)).map(m => m.id));
        return tasks.filter(task => 
            task.primaryContactPerson === currentUser.id || 
            (task.memberId && assignedMemberIds.has(task.memberId))
        );
    }, [tasks, currentUser, members, adminTaskFilter]);

    const hasNotifications = overdue.length > 0 || upcoming.length > 0;
    
    const SummaryCard: React.FC<{title: string, value: number, icon: React.ReactNode, color: string}> = ({ title, value, icon, color }) => (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border dark:border-gray-700 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
            <div className={`p-3 bg-gray-100 dark:bg-gray-700 rounded-lg ${color}`}>{icon}</div>
        </div>
    );
    
    const TabButton: React.FC<{label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void}> = ({ label, icon, isActive, onClick }) => (
        <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${ isActive ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/60' }`}>
            {icon}
            {label}
        </button>
    );

    const renderNotificationCard = (n: Notification) => {
        const isWish = n.type.includes('Birthday') || n.type.includes('Anniversary');
        const isRenewal = n.type.includes('Renewal');
        const isCustom = n.source === 'custom';
        const icon = isCustom ? <Send className="text-teal-500" /> : isWish ? (n.type.includes('Birthday') ? <Gift className="text-pink-500" /> : <MessageSquare className="text-purple-500" />) : isRenewal ? <Shield className="text-blue-500" /> : n.type === 'Special Occasion' ? <Star className="text-yellow-500" /> : <Bell className="text-gray-500"/>;
        return (
            <div key={n.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-4">{icon}<div>
                    <p className="font-semibold text-gray-800 dark:text-white">{n.member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{isRenewal ? `Policy Renewal: ${n.policy?.policyType}` : n.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1"><CalendarIcon className="inline w-3 h-3 mr-1" />{new Date(n.date).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div></div>
                <div className="w-full md:w-auto flex-shrink-0 flex items-center justify-end gap-2 flex-wrap">
                    {(isWish || isCustom || n.type === 'Special Occasion') ? (<Button variant="success" size="small" onClick={() => handleSendGenericMessage(n.member.mobile, n.message, n.id)}><WhatsAppIcon size={14} /> Send Wish</Button>)
                    : isRenewal && n.policy ? (<>
                        <Button variant="light" size="small" onClick={() => { handleSendMessage('sms', n.member.mobile, n.message); handleAction(n.id); }}><MessageSquare size={14} /> SMS</Button>
                        <Button variant="success" size="small" onClick={() => { handleSendMessage('whatsapp', n.member.mobile, n.message); handleAction(n.id); }}><WhatsAppIcon size={14} /> WhatsApp</Button>
                        {n.policy.renewalLink && (<Button variant="secondary" size="small" onClick={() => { window.open(n.policy.renewalLink, '_blank'); }}><Link size={14} /> View Link</Button>)}
                        <Button variant="primary" size="small" onClick={() => handleRenew(n.member.id, n.policy!.id, n.id)}><Check size={14} /> Mark as Renewed</Button>
                    </>) : null}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Action & Automation Hub</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage notifications, automation rules, and workflows.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Pending Actions" value={notifications.length} icon={<Clock size={24} />} color="text-orange-500" />
                <SummaryCard title="Active Rules" value={rules.filter(r => r.enabled).length} icon={<Cog size={24} />} color="text-blue-500" />
                <SummaryCard title="Workflow Stages" value={processFlow.length} icon={<Workflow size={24} />} color="text-purple-500" />
                <SummaryCard title="Upcoming Appts" value={appointments.length} icon={<CalendarIcon size={24} />} color="text-green-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex items-center gap-2 overflow-x-auto">
                    <TabButton label="Action Center" icon={<Bell size={16}/>} isActive={activeHubTab === 'actions'} onClick={() => setActiveHubTab('actions')} />
                    <TabButton label="Automation & Docs" icon={<Cog size={16}/>} isActive={activeHubTab === 'automation'} onClick={() => setActiveHubTab('automation')} />
                    <TabButton label="Workflow" icon={<Workflow size={16}/>} isActive={activeHubTab === 'workflow'} onClick={() => setActiveHubTab('workflow')} />
                    <TabButton label="Other Tools" icon={<Zap size={16}/>} isActive={activeHubTab === 'tools'} onClick={() => setActiveHubTab('tools')} />
                </div>
            </div>
            
            {activeHubTab === 'actions' && <div className="space-y-6 animate-fade-in">
                <div className="flex justify-end">
                    <Button variant="danger" onClick={onClearAll} disabled={!hasNotifications}><Trash2 size={16} /> Clear All Notifications</Button>
                </div>
                {overdue.length > 0 && <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800/50">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 flex items-center gap-2 mb-3"><AlertCircle /> Overdue Renewals ({overdue.length})</h3>
                    <div className="space-y-3">{overdue.map(n => renderNotificationCard(n))}</div>
                </div>}

                {upsellOpportunities.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                            <Star className="text-yellow-500" /> AI Upsell Opportunities ({upsellOpportunities.length})
                        </h3>
                        <div className="space-y-3">
                            {upsellOpportunities.map(opp => (
                                <UpsellOpportunityCard key={opp.id} opportunity={opp} onDismiss={onDismissOpportunity} onViewMember={onViewMember} members={members} />
                            ))}
                        </div>
                    </div>
                )}

                {upcoming.length > 0 && <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4"><Bell /> Upcoming Notifications ({upcoming.length})</h3>
                    <div className="space-y-3">{upcoming.map(n => renderNotificationCard(n))}</div>
                </div>}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">Your Dashboard</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Tasks</h4>
                                {currentUser?.role === 'Admin' && (
                                    <div className="mb-4">
                                        <label htmlFor="task-advisor-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by Advisor:</label>
                                        <select
                                            id="task-advisor-filter"
                                            value={adminTaskFilter}
                                            onChange={(e) => setAdminTaskFilter(e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded-lg shadow-sm text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="all">All Advisors</option>
                                            {users.filter(u => u.role === 'Advisor').map(adv => (
                                                <option key={adv.id} value={adv.id}>{adv.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {visibleTasks.length > 0 ? visibleTasks.map(task => (
                                    <div key={task.id} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={task.isCompleted} 
                                                    onChange={() => onToggleTask(task.id)} 
                                                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary bg-gray-100 dark:bg-gray-900 mt-1" 
                                                />
                                                <div>
                                                    <span className={`font-medium ${task.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {task.taskDescription}
                                                    </span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Due: {new Date(task.expectedCompletionDateTime).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${task.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {task.isCompleted ? 'Completed' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <CheckSquare size={24} className="mx-auto text-gray-300 dark:text-gray-500" />
                                        <p className="mt-1 font-medium">No tasks found.</p>
                                    </div>
                                )}
                            </div>
                            <div><h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">Appointments</h4>
                                {appointments.length > 0 ? appointments.map(appt => (<div key={appt.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"><div><p className="text-sm text-gray-800 dark:text-gray-200">{appt.memberName}</p><p className="text-xs text-gray-500 dark:text-gray-400">{new Date(appt.dateTime).toLocaleString('en-GB')}</p></div><Button size="small" variant="danger" onClick={() => onDeleteAppointment(appt.id)}><Trash2 size={12}/></Button></div>)) : (<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400"><CalendarIcon size={24} className="mx-auto text-gray-300 dark:text-gray-500" /><p className="mt-1 font-medium">No upcoming appointments.</p></div>)}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">Recent Activity</h3>
                        <ul className="space-y-3">{activityLog.length > 0 ? activityLog.map(log => (<li key={log.id} className="flex items-start gap-3 text-sm"><CheckSquare className="w-4 h-4 text-green-500 mt-1 flex-shrink-0"/><div><p className="text-gray-700 dark:text-gray-300">{log.message}</p><p className="text-xs text-gray-400 dark:text-gray-500">{new Date(log.timestamp).toLocaleString()}</p></div></li>)) : (<li className="text-center py-10 text-sm text-gray-500 dark:text-gray-400"><History size={24} className="mx-auto text-gray-300 dark:text-gray-500" /><p className="mt-1 font-medium">No recent activity.</p></li>)}</ul>
                    </div>
                </div>
            </div>}

            {activeHubTab === 'automation' && <div className="space-y-8 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <Cog className="text-blue-500" /> Automation Rules
                        </h3>
                        <Button onClick={() => setIsAddRuleModalOpen(true)} variant="secondary" size="small"><Plus size={14}/> Add New Rule</Button>
                    </div>
                    <div className="space-y-6">
                        {rules.map(rule => (<div key={rule.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
                            <div className="flex justify-between items-start"><div className="flex items-center gap-4">{rule.icon}<div><h4 className="font-semibold text-gray-800 dark:text-white">{rule.type}</h4><p className="text-sm text-gray-500 dark:text-gray-400">{editingRuleId !== rule.id && `Trigger: ${rule.timing.value === 0 ? 'On the day' : `${rule.timing.value} ${rule.timing.unit} before`}`}</p></div></div><div className="flex items-center gap-3"><span className="text-sm font-medium text-gray-600 dark:text-gray-300">Enabled</span><button onClick={() => toggleRule(rule.id)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'}`}><div className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-300 ${rule.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div></button></div></div>
                            <div className="mt-4 space-y-3">{editingRuleId === rule.id && (<div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trigger Timing</label><div className="flex items-center gap-2 mt-1"><input type="number" value={editedTiming.value} onChange={(e) => setEditedTiming(t => ({...t, value: parseInt(e.target.value, 10) || 0}))} className="w-20 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/><select value={editedTiming.unit} onChange={(e) => setEditedTiming(t => ({...t, unit: e.target.value as 'days' | 'weeks' }))} className="p-2 border border-gray-300 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="days">Days</option><option value="weeks">Weeks</option></select><span className="text-gray-600 dark:text-gray-300">before event</span></div></div>)}
                                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message Template</label><textarea value={editingRuleId === rule.id ? editedTemplate : rule.template} readOnly={editingRuleId !== rule.id} onChange={(e) => setEditedTemplate(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm h-24 p-2 text-sm focus:ring-brand-primary focus:border-brand-primary dark:border-gray-600 dark:text-gray-300 ${editingRuleId === rule.id ? 'bg-white dark:bg-gray-800 ring-2 ring-brand-primary' : 'bg-gray-50 dark:bg-gray-700 cursor-default'}`}/><p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use placeholders: {'{name}, {policyType}, {days}, {premium}, {renewalLink}'}</p></div>
                                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Channels</label><div className="mt-2 flex gap-2">{rule.channels.map(c => <ChannelTag key={c} channel={c} />)}</div></div>
                            </div><div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-end gap-2">{editingRuleId === rule.id ? (<><Button variant="secondary" size="small" onClick={handleCancelClick}><X size={14}/> Cancel</Button><Button variant="success" size="small" onClick={() => handleSaveClick(rule.id)}><Save size={14}/> Save Changes</Button></>) : (<Button variant="light" size="small" onClick={() => handleEditClick(rule)} disabled={!rule.enabled}><Edit2 size={14}/> Edit Rule</Button>)}</div>
                        </div>))}
                    </div>
                </div>
                <DocumentHub templates={docTemplates} onUpdateTemplates={onUpdateTemplates}/>
            </div>}
            
            {activeHubTab === 'workflow' && <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Workflow className="text-purple-500" /> Workflow Management</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize the stages of your customer journey. Changes will apply to all customers.</p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">{processFlow.map((stage, index) => (<div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"><span className="font-bold text-gray-500 dark:text-gray-400">{index + 1}.</span>{editingStage?.index === index ? (<Input value={editingStage.name} onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleRenameStage()} className="flex-grow"/>) : (<p className="flex-grow text-gray-700 dark:text-gray-200">{stage}</p>)}<div className="flex items-center gap-2">{editingStage?.index === index ? (<><Button size="small" variant="light" onClick={() => setEditingStage(null)}><X size={14}/></Button><Button size="small" variant="success" onClick={handleRenameStage}><Save size={14}/></Button></>) : (<><Button size="small" variant="light" onClick={() => setEditingStage({ index, name: stage })}><Edit2 size={14}/></Button><Button size="small" variant="danger" onClick={() => handleDeleteStage(index)}><Trash2 size={14}/></Button></>)}</div></div>))}</div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50"><form onSubmit={handleAddStage} className="flex items-center gap-2"><input type="text" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="New stage name" aria-label="New stage name" className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"/><Button type="submit" variant="secondary"><Plus size={16}/> Add Stage</Button></form></div>
            </div>}
            
            {activeHubTab === 'tools' && <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in">
                <AppointmentScheduler members={members} onSchedule={onScheduleAppointment} addToast={addToast} />
                <CustomMessageScheduler members={members} onSchedule={onScheduleMessage} addToast={addToast} />
                <div className="xl:col-span-2">
                    <OneTimeAudioRecorder savedGreetingUrl={savedGreetingUrl} setSavedGreetingUrl={setSavedGreetingUrl} addToast={addToast} />
                </div>
            </div>}
            
            <AddRuleModal isOpen={isAddRuleModalOpen} onClose={() => setIsAddRuleModalOpen(false)} onAddRule={onAddRule} addToast={addToast} />
        </div>
    );
};
