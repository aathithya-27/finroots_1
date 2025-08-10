import React, { useState, useEffect } from 'react';
import { User, AdvisorModalTab, AdvisorProfile, Member, Geography, BankMaster } from '../types.ts';
import Button from './ui/Button.tsx';
import { User as UserIcon, MapPin, BookOpen, Save, Edit, KeyRound, Users } from 'lucide-react';
import { GeneralInfoTab, AddressTab, EducationTab, AdvisorCustomersTab } from './tabs/AdvisorProfileTabs.tsx';
import { ChangePasswordModal } from './ChangePasswordModal.tsx';


interface ProfilePageProps {
  user: User | null;
  onUpdateProfile: (user: User, closeModal?: boolean) => void;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  addToast: (message: string, type?: 'success' | 'error') => void;
  allMembers: Member[];
  users: User[];
  geographies: Geography[];
  onUpdateGeographies: (data: Geography[]) => void;
  bankMasters: BankMaster[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateProfile, onUpdatePassword, addToast, allMembers, users, geographies, onUpdateGeographies, bankMasters }) => {
  const [formData, setFormData] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AdvisorModalTab>(AdvisorModalTab.GeneralInfo);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  useEffect(() => { if (user) setFormData(JSON.parse(JSON.stringify(user))); }, [user]);

  const handleChange = (field: keyof User | 'profile', value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const handleSave = () => { if (formData) onUpdateProfile(formData); };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && formData) {
      const file = e.target.files[0];
      const newUrl = URL.createObjectURL(file);
      const currentUrl = formData.profile?.photoUrl;
      // Revoke old blob url to prevent memory leaks
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
      const updatedUser = { ...formData, profile: { ...formData.profile, photoUrl: newUrl } as AdvisorProfile };
      setFormData(updatedUser);
    }
  };

  const handleSavePassword = async (currentPassword: string, newPassword: string) => {
    const success = await onUpdatePassword(currentPassword, newPassword);
    if (success) {
      setIsPasswordModalOpen(false);
    }
  };

  const TABS_CONFIG = [
      { name: AdvisorModalTab.GeneralInfo, icon: <UserIcon size={16}/> },
      { name: AdvisorModalTab.Address, icon: <MapPin size={16}/> },
      { name: AdvisorModalTab.Education, icon: <BookOpen size={16}/> },
      { name: AdvisorModalTab.Customers, icon: <Users size={16}/> },
  ];

  if (!formData) return <div>Loading profile...</div>;
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account information and preferences.</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="flex justify-between items-center p-6">
            <div className="flex items-center gap-4">
                 <div className="relative flex-shrink-0">
                    <img src={formData.profile?.photoUrl || `https://i.pravatar.cc/150?u=${formData.id}`} alt={formData.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" />
                    <label htmlFor="profile-photo-upload" className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-600 rounded-full p-1.5 cursor-pointer shadow-md hover:bg-gray-100 dark:hover:bg-gray-500 border dark:border-gray-500"><Edit size={14} className="text-gray-600 dark:text-gray-200" /></label>
                    <input type="file" id="profile-photo-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{formData.name}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formData.email}</p>
                    <p className="mt-2 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 inline-block px-2 py-1 rounded-full">{formData.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsPasswordModalOpen(true)} variant="secondary"><KeyRound size={16}/> Change Password</Button>
              <Button onClick={handleSave} variant="primary"><Save size={16}/> Save Changes</Button>
            </div>
        </div>

        <div className="flex-shrink-0 px-6 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-2 sm:space-x-6 -mb-px overflow-x-auto">
              {TABS_CONFIG.map((tab) => (
                <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`inline-flex items-center gap-2 px-2 sm:px-4 py-3 font-medium text-sm rounded-t-md focus:outline-none transition-colors duration-200 whitespace-nowrap ${ activeTab === tab.name ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent' }`}>
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
        </div>
        
        <div className="p-6">
            {activeTab === AdvisorModalTab.GeneralInfo && <GeneralInfoTab data={formData} onChange={handleChange} onSave={onUpdateProfile} addToast={addToast} bankMasters={bankMasters} />}
            {activeTab === AdvisorModalTab.Address && <AddressTab data={formData} onChange={handleChange} geographies={geographies} onUpdateGeographies={onUpdateGeographies} addToast={addToast} />}
            {activeTab === AdvisorModalTab.Education && <EducationTab data={formData} onChange={handleChange} />}
            {activeTab === AdvisorModalTab.Customers && <AdvisorCustomersTab advisor={formData} allMembers={allMembers} users={users} />}
        </div>
      </div>

       <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
      />
    </div>
  );
};

export default ProfilePage;
