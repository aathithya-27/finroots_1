import React, { useState, useEffect, useMemo } from 'react';
import { Lead, User, LeadSource, PolicyType, GeneralInsuranceType, LeadSourceMaster, LeadActivityLog, FinRootsBranch, InsuranceTypeMaster, Member } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import { X, PlusCircle, Zap, Edit2, MessageSquare, Info, History, Plus } from 'lucide-react';
import LeadSourceSelector from './LeadSourceSelector.tsx';
import Tabs from './ui/Tabs.tsx';


const ActivityTimeline: React.FC<{ lead: Lead; userMap: Map<string, string> }> = ({ lead, userMap }) => {
    const sortedLog = useMemo(() => 
        [...(lead.activityLog || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
        [lead.activityLog]
    );

    const getIconForAction = (action: LeadActivityLog['action']) => {
        switch (action) {
            case 'Created': return <PlusCircle className="w-5 h-5 text-green-500" />;
            case 'Status Change': return <Zap className="w-5 h-5 text-blue-500" />;
            case 'Details Updated': return <Edit2 className="w-5 h-5 text-yellow-500" />;
            case 'Note Added': return <MessageSquare className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    if (!sortedLog || sortedLog.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <History size={40} className="mx-auto text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm font-semibold">No Activity Yet</p>
                <p className="mt-1 text-xs">Changes to this lead will be recorded here.</p>
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {sortedLog.map((log, index) => (
                    <li key={log.timestamp + index}>
                        <div className="relative pb-8">
                            {index !== sortedLog.length - 1 && (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-4 ring-white dark:ring-gray-800">
                                        {getIconForAction(log.action)}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            {log.details}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            by {userMap.get(log.by) || 'System'}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        <time dateTime={log.timestamp}>
                                            {new Date(log.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};


interface NewReferrerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; mobile: string; email?: string }) => Promise<void>;
    addToast: (message: string, type?: 'success' | 'error') => void;
}

const NewReferrerModal: React.FC<NewReferrerModalProps> = ({ isOpen, onClose, onSave, addToast }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');

    const handleSave = async () => {
        if (!name.trim()) return addToast('Referrer name is required.', 'error');
        if (!mobile.trim() || !/^\+?[0-9\s-]{10,15}$/.test(mobile)) return addToast('A valid mobile number is required.', 'error');
        
        await onSave({ name, mobile, email });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">Add New Referrer</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This will create a basic contact record for the referrer.</p>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
                <Input label="Full Name *" value={name} onChange={e => setName(e.target.value)} />
                <Input label="Phone Number *" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} />
                <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save Referrer</Button>
            </div>
        </Modal>
    );
};


interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onSave: (lead: Lead) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    currentUser: User | null;
    users: User[];
    leadSources: LeadSourceMaster[];
    finrootsBranches: FinRootsBranch[];
    insuranceTypes: InsuranceTypeMaster[];
    allMembers: Member[];
    onCreateReferrer: (referrerData: { name: string, mobile: string, email?: string }) => Promise<Member | null>;
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, lead, onSave, addToast, currentUser, users, leadSources, finrootsBranches, insuranceTypes, allMembers, onCreateReferrer }) => {
    const [formData, setFormData] = useState<Partial<Lead>>({});
    const [errors, setErrors] = useState<Partial<Record<keyof Lead, string>>>({});
    const [activeTab, setActiveTab] = useState('Details');
    const [isNewReferrerModalOpen, setIsNewReferrerModalOpen] = useState(false);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const TABS = ['Details', 'Activity Timeline'];

    const advisors = users.filter(u => u.role === 'Advisor');

    const generalInsuranceTypes = useMemo(() => 
        insuranceTypes.filter(it => it.active && it.name !== 'Life Insurance' && it.name !== 'Health Insurance'),
    [insuranceTypes]);

    const getInitialFormData = (lead: Lead | null): Partial<Lead> => {
        if (lead) return JSON.parse(JSON.stringify(lead)); // Deep copy
        return {
            name: '',
            phone: '',
            email: '',
            leadSource: { sourceId: null, detail: '' },
            status: 'Lead',
            estimatedValue: 0,
            notes: '',
            assignedTo: currentUser?.role === 'Advisor' ? currentUser.id : '',
            policyInterestType: undefined,
            policyInterestGeneralType: undefined,
            branchId: '',
            followUpDate: '',
            referrerId: undefined,
        };
    };

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData(lead));
            setErrors({});
            setActiveTab('Details');
        }
    }, [lead, isOpen, currentUser]);

    const handleChange = (field: keyof Lead, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };
    
    const handlePolicyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as PolicyType;
        handleChange('policyInterestType', newType);
        // Reset general type if main type is not 'General Insurance'
        if (newType !== 'General Insurance') {
            handleChange('policyInterestGeneralType', undefined);
        }
    };


    const validateForm = () => {
        const newErrors: Partial<Record<keyof Lead, string>> = {};
        if (!formData.name?.trim()) newErrors.name = 'Name is required.';
        if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required.';
        if (formData.phone && !/^\+?[0-9\s-]{10,15}$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number.';
        }
        if ((formData.estimatedValue || 0) <= 0) {
            newErrors.estimatedValue = 'Estimated value must be greater than zero.';
        }
        if (!formData.leadSource?.sourceId) {
            // @ts-ignore
            newErrors.leadSource = 'A lead source selection is required.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave(formData as Lead);
        } else {
            addToast('Please correct the errors before saving.', 'error');
        }
    };
    
    const handleSaveNewReferrer = async (referrerData: { name: string; mobile: string; email?: string }) => {
        const newReferrer = await onCreateReferrer(referrerData);
        if (newReferrer) {
            handleChange('referrerId', newReferrer.id);
            setIsNewReferrerModalOpen(false);
        }
    };

    const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-brand-dark dark:text-white">{lead ? 'Edit Lead' : 'Create New Lead'}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                     <div className="mt-4">
                        <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                     {activeTab === 'Details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="md:col-span-2">
                                <Input label="Name *" id="name" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                                {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Input label="Phone *" id="phone" type="tel" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
                                {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <Input label="Email" id="email" type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
                            </div>
                            
                            <div className="md:col-span-2">
                                <LeadSourceSelector 
                                    value={formData.leadSource}
                                    onLeadSourceChange={(newValue) => handleChange('leadSource', newValue)}
                                    leadSources={leadSources}
                                    allMembers={allMembers}
                                    currentMemberId={formData.id}
                                    referrerId={formData.referrerId}
                                    onReferrerSelect={(memberId) => handleChange('referrerId', memberId)}
                                    onAddNewReferrer={() => setIsNewReferrerModalOpen(true)}
                                />
                                {errors.leadSource && <p className="text-red-600 text-xs mt-1">{errors.leadSource as string}</p>}
                            </div>
                            
                             <div>
                                <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                                <select 
                                    id="branchId" 
                                    value={formData.branchId || ''} 
                                    onChange={(e) => handleChange('branchId', e.target.value)} 
                                    className={selectClasses}
                                >
                                  <option value="">Select Branch...</option>
                                  {finrootsBranches.map(branch => <option key={branch.id} value={branch.id}>{branch.branchName}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <Input label="Follow-up Date" id="followUpDate" type="date" value={formData.followUpDate || ''} onChange={(e) => handleChange('followUpDate', e.target.value)} />
                            </div>

                            <div>
                                <Input label="Estimated Value (Premium) *" type="number" value={formData.estimatedValue > 0 ? String(formData.estimatedValue) : ''} onChange={(e) => handleChange('estimatedValue', parseFloat(e.target.value) || 0)} />
                                {errors.estimatedValue && <p className="text-red-600 text-xs mt-1">{errors.estimatedValue}</p>}
                            </div>

                             <div className="md:col-span-2">
                                <label htmlFor="policyInterestType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy of Interest</label>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select
                                        id="policyInterestType"
                                        value={formData.policyInterestType || ''}
                                        onChange={handlePolicyTypeChange}
                                        className={selectClasses}
                                    >
                                        <option value="" disabled>Select Policy Type...</option>
                                        <option>Health Insurance</option>
                                        <option>Life Insurance</option>
                                        <option>General Insurance</option>
                                    </select>

                                    {formData.policyInterestType === 'General Insurance' && (
                                        <select
                                            id="policyInterestGeneralType"
                                            value={formData.policyInterestGeneralType || ''}
                                            onChange={(e) => handleChange('policyInterestGeneralType', e.target.value as GeneralInsuranceType)}
                                            className={`${selectClasses} animate-fade-in`}
                                        >
                                            <option value="" disabled>Select General Type...</option>
                                            {generalInsuranceTypes.map(type => (
                                                <option key={type.id} value={type.name}>{type.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                            
                            <div className="md:col-span-2">
                               <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                               <select 
                                   id="assignedTo" 
                                   value={formData.assignedTo || ''} 
                                   onChange={(e) => handleChange('assignedTo', e.target.value)} 
                                   className={selectClasses}
                                   disabled={currentUser?.role !== 'Admin'}
                               >
                                 <option value="">Unassigned</option>
                                 {advisors.map(adv => <option key={adv.id} value={adv.id}>{adv.name}</option>)}
                               </select>
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <textarea
                                    id="notes"
                                    value={formData.notes || ''}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    rows={4}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                    placeholder="Add any relevant notes about this lead..."
                                />
                            </div>
                        </div>
                    )}
                    {activeTab === 'Activity Timeline' && lead && (
                        <ActivityTimeline lead={lead} userMap={userMap} />
                    )}
                </div>

                <div className="flex-shrink-0 flex justify-end p-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} variant="primary">{lead ? 'Save Changes' : 'Create Lead'}</Button>
                </div>
            </Modal>
            
            {isNewReferrerModalOpen && (
                <NewReferrerModal
                    isOpen={isNewReferrerModalOpen}
                    onClose={() => setIsNewReferrerModalOpen(false)}
                    onSave={handleSaveNewReferrer}
                    addToast={addToast}
                />
            )}
        </>
    );
};

export default LeadModal;