import React, { useState, useEffect } from 'react';
import { User, Member } from '../types.ts';
import { Shield, Users, UserPlus, HardDrive, Edit, Database, DollarSign } from 'lucide-react';
import Button from './ui/Button.tsx';

interface AdminProfileProps {
    user: User;
    users: User[];
    allMembers: Member[];
    onOpenAdvisorModal: () => void;
    onUpdateProfile: (user: User) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string; }> = ({ icon, label, value, color }) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center gap-4 border dark:border-gray-700">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);

const AdminProfile: React.FC<AdminProfileProps> = ({ user, users, allMembers, onOpenAdvisorModal, onUpdateProfile, addToast }) => {
    
    const [localUser, setLocalUser] = useState(user);

    useEffect(() => {
        setLocalUser(user);
    }, [user]);
    
    const advisors = users.filter(u => u.role === 'Advisor');
    const recentAdvisors = [...advisors].sort((a,b) => new Date(b.profile?.dateOfCreation || 0).getTime() - new Date(a.profile?.dateOfCreation || 0).getTime()).slice(0, 3);
    
    const handleSimulatedAction = (message: string) => {
        addToast(message, 'success');
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && localUser) {
            const file = e.target.files[0];
            const currentUrl = localUser.profile?.photoUrl;
            if (currentUrl && currentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentUrl);
            }
            const newUrl = URL.createObjectURL(file);
            const updatedUser = { ...localUser, profile: { ...localUser.profile, photoUrl: newUrl } as User['profile'] };
            setLocalUser(updatedUser);
            onUpdateProfile(updatedUser);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
             <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Control Center</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system settings and view key metrics.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Admin Profile Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 text-center">
                        <div className="relative w-24 h-24 mx-auto">
                            <img src={localUser.profile?.photoUrl || `https://i.pravatar.cc/150?u=${localUser.id}`} alt="Admin" className="w-24 h-24 rounded-full object-cover" />
                            <label htmlFor="admin-photo-upload" className="absolute bottom-0 right-0 bg-white dark:bg-gray-600 rounded-full p-1.5 cursor-pointer shadow-md hover:bg-gray-100 dark:hover:bg-gray-500 border dark:border-gray-500">
                                <Edit size={14} className="text-gray-600 dark:text-gray-200" />
                            </label>
                            <input
                                type="file"
                                id="admin-photo-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{localUser.name}</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{localUser.email}</p>
                        <p className="mt-2 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 inline-block px-2 py-1 rounded-full">{localUser.role}</p>
                        <Button variant="secondary" size="small" className="mt-4" onClick={() => handleSimulatedAction("Password change modal would open here.")}>
                            Change Password
                        </Button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Button onClick={onOpenAdvisorModal} variant="success" className="w-full justify-center">
                                <UserPlus size={16}/> Create New Advisor
                            </Button>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 pt-3">Recently Added Advisors:</h4>
                            {recentAdvisors.length > 0 ? (
                                <ul className="space-y-2">
                                {recentAdvisors.map(adv => (
                                    <li key={adv.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <img src={adv.profile?.photoUrl || `https://i.pravatar.cc/150?u=${adv.id}`} alt={adv.name} className="w-8 h-8 rounded-full object-cover" />
                                        <div>
                                            <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{adv.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(adv.profile?.dateOfCreation || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No advisors created yet.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-2 space-y-8">
                     {/* System Stats */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">System Health & Usage</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={<Users size={20} />} label="Total Advisors" value={advisors.length} color="bg-blue-100 text-blue-600 dark:bg-blue-900/40" />
                            <StatCard icon={<HardDrive size={20} />} label="Total Customers" value={allMembers.length} color="bg-green-100 text-green-600 dark:bg-green-900/40" />
                            <StatCard icon={<DollarSign size={20} />} label="API Calls (Month)" value="1,423" color="bg-purple-100 text-purple-600 dark:bg-purple-900/40" />
                            <StatCard icon={<Database size={20} />} label="DB Status" value="Online" color="bg-teal-100 text-teal-600 dark:bg-teal-900/40" />
                        </div>
                    </div>
                    
                    {/* System Settings */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">System Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Branding</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Upload your company logo.</p>
                                </div>
                                <Button variant="secondary" size="small" onClick={() => handleSimulatedAction("Upload modal would appear here.")}>Upload Logo</Button>
                            </div>
                             <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Data Export</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Export all system data to CSV.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="small" onClick={() => handleSimulatedAction("Exporting customer data...")}>Export Customers</Button>
                                    <Button variant="secondary" size="small" onClick={() => handleSimulatedAction("Exporting lead data...")}>Export Leads</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                     {/* Security Settings */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Security</h3>
                         <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-800 dark:text-gray-200">Two-Factor Authentication (2FA)</h4>
                                <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Enabled</p>
                            </div>
                            <Button variant="secondary" size="small" onClick={() => handleSimulatedAction("2FA settings would open.")}>Manage</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;