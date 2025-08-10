import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, AdvisorProfile, AdvisorModalTab, Member, FinRootsBranch, Geography, BankMaster } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import { X, User as UserIcon, MapPin, BookOpen, Edit, Users, FileText as FileTextIcon } from 'lucide-react';
import { GeneralInfoTab, AddressTab, EducationTab, AdvisorCustomersTab } from './tabs/AdvisorProfileTabs.tsx';
import { AdvisorDocumentsTab } from './tabs/AdvisorDocumentsTab.tsx';

// --- Main Modal Component ---

interface AdvisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    advisor: User | null;
    onSave: (advisor: User, closeModal?: boolean) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    users: User[];
    finrootsBranches: FinRootsBranch[];
    currentUser: User | null;
    geographies: Geography[];
    onUpdateGeographies: (data: Geography[]) => void;
    bankMasters: BankMaster[];
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({ isOpen, onClose, advisor, onSave, addToast, allMembers, users, finrootsBranches, currentUser, geographies, onUpdateGeographies, bankMasters }) => {
    const [activeTab, setActiveTab] = useState<AdvisorModalTab>(AdvisorModalTab.GeneralInfo);
    const [formData, setFormData] = useState<Partial<User>>({});
    const formDataRef = useRef(formData);
    formDataRef.current = formData;

    const getInitialFormData = (adv: User | null): Partial<User> => {
        if (adv) return JSON.parse(JSON.stringify(adv)); // Deep copy

        const companyAdvisorIds = users
            .filter(u => u.companyId === currentUser?.companyId && u.role === 'Advisor' && !isNaN(parseInt(u.employeeId, 10)))
            .map(u => parseInt(u.employeeId, 10));
    
        const nextIdNumber = companyAdvisorIds.length > 0 ? Math.max(...companyAdvisorIds) + 1 : 1001;

        const today = new Date().toISOString().split('T')[0];
        return {
            name: '',
            email: '',
            employeeId: String(nextIdNumber),
            role: 'Advisor',
            company: currentUser?.company || '',
            companyId: currentUser?.companyId || '',
            profile: {
                status: 'Active',
                dateOfCreation: today,
                dateOfJoining: today,
                educationDetails: [],
                permanentAddress: {},
                localAddress: {},
                companyId: currentUser?.companyId || '',
                documents: [],
            }
        };
    };

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData(advisor));
            setActiveTab(AdvisorModalTab.GeneralInfo);
        }
    }, [advisor, isOpen, users, currentUser]);

    useEffect(() => {
      // This effect runs only when the modal is mounted and cleans up when it's unmounted.
      return () => {
          const url = formDataRef.current?.profile?.photoUrl;
          if (url && url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
          }
      };
    }, []);

    const handleChange = useCallback((field: keyof User | 'profile', value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const currentUrl = formData.profile?.photoUrl;
            if (currentUrl && currentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentUrl);
            }
            const newUrl = URL.createObjectURL(file);
            handleChange('profile', { ...formData.profile, photoUrl: newUrl });
        }
    };

    const validateForm = () => {
        if (!formData.name?.trim()) { addToast('Employee Name is required.', 'error'); return false; }
        if (!formData.email?.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) { addToast('A valid email is required.', 'error'); return false; }
        if (!formData.employeeId?.trim()) { addToast('Employee ID is required.', 'error'); return false; }
        return true;
    };

    const handleSave = () => {
        if (validateForm()) {
            if (!advisor && users.some(u => u.employeeId === formData.employeeId && u.companyId === formData.companyId)) {
                addToast('An advisor with this Employee ID already exists for this company.', 'error');
                return;
            }
            onSave(formData as User, true);
        }
    };
    
    const TABS_CONFIG = [
        { name: AdvisorModalTab.GeneralInfo, icon: <UserIcon size={16}/> },
        { name: AdvisorModalTab.Address, icon: <MapPin size={16}/> },
        { name: AdvisorModalTab.Education, icon: <BookOpen size={16}/> },
        { name: AdvisorModalTab.Documents, icon: <FileTextIcon size={16}/> },
        { name: AdvisorModalTab.Customers, icon: <Users size={16}/> },
    ];
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white">{advisor ? 'Edit Advisor Details' : 'Create New Advisor'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col items-center">
                        <div className="relative">
                            {formData.profile?.photoUrl ? (
                                <img src={formData.profile.photoUrl} alt="Advisor" className="h-32 w-32 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" />
                            ) : (
                                <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 text-5xl">
                                    {formData.initials || '?'}
                                </div>
                            )}
                             <label htmlFor="advisor-photo-upload" className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-600 rounded-full p-2 cursor-pointer shadow-md hover:bg-gray-100 dark:hover:bg-gray-500 border dark:border-gray-500">
                                <Edit size={16} className="text-gray-600 dark:text-gray-200" />
                                <input
                                    type="file"
                                    id="advisor-photo-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                            </label>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</p>
                            {advisor ? (
                                <p className="text-lg font-semibold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 rounded-md px-4 py-2">
                                    {formData.employeeId}
                                </p>
                            ) : (
                                <Input
                                    value={formData.employeeId || ''}
                                    onChange={(e) => handleChange('employeeId', e.target.value)}
                                    className="text-center text-lg font-semibold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 rounded-md px-4 py-2 border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <Input label="Employee Name" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                        <Input label="Email" type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
                        <Input label="PAN No." value={formData.profile?.panNo || ''} onChange={(e) => handleChange('profile', { ...formData.profile, panNo: e.target.value })} />
                        <Input label="Aadhar No." value={formData.profile?.aadhaarNo || ''} onChange={(e) => handleChange('profile', { ...formData.profile, aadhaarNo: e.target.value })} />
                    </div>
                </div>

                <div className="mt-8">
                     <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-2 -mb-px overflow-x-auto">
                          {TABS_CONFIG.map((tab) => (
                            <button
                              key={tab.name}
                              onClick={() => setActiveTab(tab.name)}
                              className={`inline-flex items-center gap-2 px-3 py-3 font-medium text-sm rounded-t-md focus:outline-none transition-colors duration-200 whitespace-nowrap
                                ${
                                  activeTab === tab.name
                                    ? 'border-b-2 border-brand-primary text-brand-primary'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent'
                                }`}
                            >
                              {tab.icon} {tab.name}
                            </button>
                          ))}
                        </nav>
                    </div>
                    <div className="pt-6">
                        {activeTab === AdvisorModalTab.GeneralInfo && <GeneralInfoTab data={formData} onChange={handleChange} onSave={onSave} finrootsBranches={finrootsBranches} addToast={addToast} bankMasters={bankMasters} />}
                        {activeTab === AdvisorModalTab.Address && <AddressTab data={formData} onChange={handleChange} geographies={geographies} onUpdateGeographies={onUpdateGeographies} addToast={addToast} />}
                        {activeTab === AdvisorModalTab.Education && <EducationTab data={formData} onChange={handleChange} />}
                        {activeTab === AdvisorModalTab.Documents && <AdvisorDocumentsTab data={formData} onChange={handleChange} addToast={addToast} />}
                        {activeTab === AdvisorModalTab.Customers && <AdvisorCustomersTab advisor={formData} allMembers={allMembers} users={users} />}
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 flex justify-end p-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                <Button onClick={onClose} variant="secondary">Cancel</Button>
                <Button onClick={handleSave} variant="primary">{advisor ? 'Save Changes' : 'Create Advisor'}</Button>
            </div>
        </Modal>
    );
};