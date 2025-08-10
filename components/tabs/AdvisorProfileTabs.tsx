import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, AdvisorProfile, AdvisorEducation, AdvisorAddress, AdvisorSpecialization, Member, FinRootsBranch, Geography, BankMaster } from '../../types.ts';
import Input from '../ui/Input.tsx';
import Button from '../ui/Button.tsx';
import { Trash2, PlusCircle, X, Users, Copy, Banknote, KeyRound } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect.tsx';

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

const specializationsList: AdvisorSpecialization[] = ['Life', 'Health', 'Motor', 'Home', 'Travel'];

const SkillTagsInput: React.FC<{ skills: string; onSkillsChange: (skills: string) => void; }> = ({ skills, onSkillsChange }) => {
    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const removeSkill = (skillToRemove: string) => {
        onSkillsChange(skillsArray.filter(s => s !== skillToRemove).join(', '));
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            const newSkill = e.currentTarget.value.trim().replace(/,$/, '');
            if (newSkill && !skillsArray.includes(newSkill)) {
                onSkillsChange([...skillsArray, newSkill].join(', '));
            }
            e.currentTarget.value = '';
        }
    };
    return (
        <div>
            <Input label="Skillset" onKeyDown={handleKeyDown} placeholder="Type a skill and press Enter" />
            <div className="flex flex-wrap gap-2 mt-2">
                {skillsArray.map((skill, index) => (
                    <span key={index} className="flex items-center gap-1.5 bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-200">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={12} /></button>
                    </span>
                ))}
            </div>
        </div>
    );
};

export const GeneralInfoTab: React.FC<{ 
    data: Partial<User>; 
    onChange: (field: keyof User | 'profile', value: any) => void;
    onSave: (advisor: User, closeModal?: boolean) => void;
    finrootsBranches?: FinRootsBranch[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    bankMasters: BankMaster[];
}> = ({ data, onChange, onSave, finrootsBranches, addToast, bankMasters }) => {
    const profile = data.profile || { status: 'Active' };
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const handleProfileChange = (field: keyof AdvisorProfile, value: any) => {
        onChange('profile', { ...profile, [field]: value });
    };

    const handleSpecializationChange = (spec: AdvisorSpecialization, checked: boolean) => {
        const currentSpecs = profile.specializations || [];
        const newSpecs = checked
            ? [...currentSpecs, spec]
            : currentSpecs.filter(s => s !== spec);
        handleProfileChange('specializations', newSpecs);
    };

    const handleSavePassword = () => {
        if (newPassword.length < 6) {
            addToast('New password must be at least 6 characters.', 'error');
            return;
        }
        // Create an updated user object to save
        const updatedUser = { ...data, password: newPassword } as User;
        
        // Use the onSave prop passed down from App.tsx, with closeModal = false
        onSave(updatedUser, false);
        
        // Reset local state
        setNewPassword('');
        setIsResettingPassword(false);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <Input label="Date of Birth" type="date" value={profile.dateOfBirth || ''} onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)} />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Branch</label>
                    <select
                        value={profile.employeeBranchId || ''}
                        onChange={(e) => handleProfileChange('employeeBranchId', e.target.value)}
                        className={selectClasses}
                        disabled={!finrootsBranches}
                    >
                        <option value="">{finrootsBranches ? 'Select Branch...' : 'Branch Info Unavailable'}</option>
                        {finrootsBranches?.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.branchName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Group</label>
                    <select value={profile.employeeGroup || ''} onChange={(e) => handleProfileChange('employeeGroup', e.target.value as any)} className={selectClasses}>
                        <option value="" disabled>Select...</option>
                        <option value="LI">Life Insurance (LI)</option>
                        <option value="HI">Health Insurance (HI)</option>
                        <option value="GI">General Insurance (GI)</option>
                    </select>
                </div>
                <Input label="Date of Joining" type="date" value={profile.dateOfJoining || ''} onChange={(e) => handleProfileChange('dateOfJoining', e.target.value)} />
                <Input label="Date of Leaving" type="date" value={profile.dateOfLeaving || ''} onChange={(e) => handleProfileChange('dateOfLeaving', e.target.value)} />
                
                 <div className="md:col-span-2 p-4 border rounded-lg dark:border-gray-600 space-y-3">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><KeyRound size={16}/> Password Management</h4>
                    {!data.id ? ( // Only for new advisors
                        <Input
                            label="Set Initial Password"
                            type="password"
                            value={data.password || ''}
                            onChange={(e) => onChange('password', e.target.value)}
                            placeholder="Min. 6 characters"
                        />
                    ) : ( // For existing advisors
                        <div className="space-y-3">
                            <Input
                                label="Current Password"
                                type="password"
                                value={data.password || ''}
                                onChange={() => {}} // This is a display field, not for user input
                                readOnly
                            />
                            {isResettingPassword ? (
                                <div className="animate-fade-in space-y-2">
                                    <Input 
                                        label="New Password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button variant="primary" size="small" onClick={handleSavePassword}>Save New Password</Button>
                                        <Button variant="secondary" size="small" onClick={() => setIsResettingPassword(false)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="secondary" onClick={() => setIsResettingPassword(true)}>
                                    Reset Password
                                </Button>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border p-4 rounded-lg dark:border-gray-600">
                    <h4 className="col-span-full font-semibold text-gray-700 dark:text-gray-300">Expertise & Capacity</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specializations</label>
                        <div className="space-y-2">
                            {specializationsList.map(spec => (
                                <label key={spec} className="flex items-center gap-2 text-gray-800 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={profile.specializations?.includes(spec) || false}
                                        onChange={(e) => handleSpecializationChange(spec, e.target.checked)}
                                        className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary border-gray-300 dark:border-gray-500"
                                    />
                                    {spec}
                                </label>
                            ))}
                        </div>
                    </div>
                    <Input
                        label="Max Client Capacity"
                        type="number"
                        value={profile.maxCapacity || ''}
                        onChange={e => handleProfileChange('maxCapacity', parseInt(e.target.value, 10) || 0)}
                        placeholder="e.g., 25"
                    />
                </div>

                <Input label="Father/Mother Name" value={profile.fatherMotherName || ''} onChange={(e) => handleProfileChange('fatherMotherName', e.target.value)} />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                    <div className="flex gap-4 pt-2">
                        {(['Male', 'Female', 'Other'] as const).map(g => (
                            <label key={g} className="flex items-center gap-2 text-gray-800 dark:text-gray-300"><input type="radio" name="gender" value={g} checked={profile.gender === g} onChange={(e) => handleProfileChange('gender', e.target.value as any)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 dark:border-gray-600"/> {g}</label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driving Licence?</label>
                    <input type="checkbox" checked={!!profile.drivingLicenceObtained} onChange={(e) => handleProfileChange('drivingLicenceObtained', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"/>
                </div>
                <Input label="Driving Licence No" value={profile.drivingLicenceNo || ''} onChange={(e) => handleProfileChange('drivingLicenceNo', e.target.value)} disabled={!profile.drivingLicenceObtained}/>
                <Input label="DL Expiry Date" type="date" value={profile.dlExpiryDate || ''} onChange={(e) => handleProfileChange('dlExpiryDate', e.target.value)} disabled={!profile.drivingLicenceObtained}/>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border p-4 rounded-lg dark:border-gray-600">
                    <h4 className="col-span-full font-semibold text-gray-700 dark:text-gray-300">Work Experience</h4>
                    <Input label="Months" type="number" value={profile.workExperienceMonths || ''} onChange={e => handleProfileChange('workExperienceMonths', parseInt(e.target.value, 10))} />
                    <Input label="Years" type="number" value={profile.workExperienceYears || ''} onChange={e => handleProfileChange('workExperienceYears', parseInt(e.target.value, 10))} />
                    <Input label="Industry" value={profile.industry || ''} onChange={e => handleProfileChange('industry', e.target.value)} />
                </div>
                <div className="md:col-span-2"><SkillTagsInput skills={profile.computerSkills || ''} onSkillsChange={(skills) => handleProfileChange('computerSkills', skills)}/></div>
            </div>

            <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Banknote /> Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                        <select
                            value={profile.bankDetails?.bankName || ''}
                            onChange={e => handleProfileChange('bankDetails', { ...profile.bankDetails, bankName: e.target.value })}
                            className={selectClasses}
                        >
                            <option value="">Select a Bank...</option>
                            {bankMasters.filter(b => b.active).map(b => <option key={b.id} value={b.bankName}>{b.bankName}</option>)}
                        </select>
                    </div>
                    <Input label="Account Number" value={profile.bankDetails?.accountNumber || ''} onChange={(e) => handleProfileChange('bankDetails', { ...profile.bankDetails, accountNumber: e.target.value })} />
                    <Input label="IFSC Code" value={profile.bankDetails?.ifscCode || ''} onChange={(e) => handleProfileChange('bankDetails', { ...profile.bankDetails, ifscCode: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                        <select
                            value={profile.bankDetails?.accountType || ''}
                            onChange={e => handleProfileChange('bankDetails', { ...profile.bankDetails, accountType: e.target.value as any })}
                            className={selectClasses}
                        >
                            <option value="">Select Account Type...</option>
                            <option>Current Account</option>
                            <option>Overdraft Account</option>
                            <option>Cash Credit Account</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddressForm: React.FC<{
  title: string;
  addressType: 'permanentAddress' | 'localAddress';
  formData: AdvisorAddress;
  onFormChange: (addressType: 'permanentAddress' | 'localAddress', newAddressData: AdvisorAddress) => void;
  onCopyPermanent?: () => void;
  geographies: Geography[];
  onUpdateGeographies: (data: Geography[]) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}> = React.memo(({ title, addressType, formData, onFormChange, onCopyPermanent, geographies, onUpdateGeographies, addToast }) => {
  const handleChange = (field: keyof AdvisorAddress, value: string) => {
    onFormChange(addressType, { ...formData, [field]: value });
  };

  const states = useMemo(() => {
    const country = geographies.find(g => g.type === 'Country' && g.name === 'India');
    if (!country) return [];
    return geographies.filter(g => g.parentId === country.id && g.type === 'State' && g.active !== false)
      .map(s => ({ value: s.name, label: s.name }));
  }, [geographies]);

  const selectedStateObject = useMemo(() => {
    return geographies.find(g => g.name === formData.state && g.type === 'State');
  }, [formData.state, geographies]);

  const cities = useMemo(() => {
    if (!selectedStateObject) return [];
    return geographies.filter(g => g.parentId === selectedStateObject.id && (g.type === 'City' || g.type === 'District') && g.active !== false)
      .map(c => ({ value: c.name, label: c.name }));
  }, [selectedStateObject, geographies]);

  const handleStateChange = (newStateName: string) => {
    onFormChange(addressType, { ...formData, state: newStateName, city: '' });
  };
  
  const handleCityChange = (newCityName: string) => {
    onFormChange(addressType, { ...formData, city: newCityName });
  };

  const handleCreateGeography = (name: string, type: 'State' | 'City') => {
    if (type === 'State') {
        const country = geographies.find(g => g.type === 'Country' && g.name === 'India');
        if (!country) return addToast("Country 'India' not found.", "error");
        const newState: Geography = { id: `geo-${Date.now()}`, name, type: 'State', parentId: country.id, active: true };
        onUpdateGeographies([...geographies, newState]);
        handleStateChange(name);
        addToast(`State "${name}" created.`, 'success');
    } else { // City
        if (!selectedStateObject) return addToast("Please select a state first.", "error");
        const newCity: Geography = { id: `geo-${Date.now()}`, name, type: 'City', parentId: selectedStateObject.id, active: true };
        onUpdateGeographies([...geographies, newCity]);
        handleCityChange(name);
        addToast(`City "${name}" created.`, 'success');
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg dark:border-gray-600">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
            {onCopyPermanent && (
                <Button type="button" size="small" variant="light" onClick={onCopyPermanent}>
                    <Copy size={14} /> Same as Permanent
                </Button>
            )}
        </div>
        <Input label="Line 1" value={formData.line1 || ''} onChange={(e) => handleChange('line1', e.target.value)} />
        <Input label="Line 2" value={formData.line2 || ''} onChange={(e) => handleChange('line2', e.target.value)} />
        <Input label="Line 3" value={formData.line3 || ''} onChange={(e) => handleChange('line3', e.target.value)} />
        <SearchableSelect
            label="State"
            options={states}
            value={formData.state || ''}
            onChange={handleStateChange}
            onCreate={(name) => handleCreateGeography(name, 'State')}
            placeholder="Select or type to create..."
        />
        <SearchableSelect
            label="City / District"
            options={cities}
            value={formData.city || ''}
            onChange={handleCityChange}
            onCreate={(name) => handleCreateGeography(name, 'City')}
            placeholder="Select or type to create..."
            disabled={!formData.state}
        />
        <Input label="Pin Code" value={formData.pinCode || ''} onChange={(e) => handleChange('pinCode', e.target.value)} />
        <Input label="Phone 1" value={formData.phone1 || ''} onChange={(e) => handleChange('phone1', e.target.value)} />
        <Input label="Phone 2" value={formData.phone2 || ''} onChange={(e) => handleChange('phone2', e.target.value)} />
        <Input label="FAX No" value={formData.faxNo || ''} onChange={(e) => handleChange('faxNo', e.target.value)} />
        <Input label="Email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
    </div>
  );
});


export const AddressTab: React.FC<{
  data: Partial<User>;
  onChange: (field: 'profile', value: any) => void;
  geographies: Geography[];
  onUpdateGeographies: (data: Geography[]) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}> = ({ data, onChange, geographies, onUpdateGeographies, addToast }) => {
    const profile = data.profile || { status: 'Active' };

    const handleFormChange = useCallback((addressType: 'permanentAddress' | 'localAddress', newAddressData: AdvisorAddress) => {
        onChange('profile', {
            ...profile,
            [addressType]: newAddressData
        });
    }, [profile, onChange]);

    const copyPermanentToLocal = useCallback(() => {
        onChange('profile', {
            ...profile,
            localAddress: { ...(profile.permanentAddress || {}) }
        });
    }, [profile, onChange]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AddressForm
                title="Permanent Address"
                addressType="permanentAddress"
                formData={profile.permanentAddress || {}}
                onFormChange={handleFormChange}
                geographies={geographies}
                onUpdateGeographies={onUpdateGeographies}
                addToast={addToast}
            />
            <AddressForm
                title="Local Address"
                addressType="localAddress"
                formData={profile.localAddress || {}}
                onFormChange={handleFormChange}
                onCopyPermanent={copyPermanentToLocal}
                geographies={geographies}
                onUpdateGeographies={onUpdateGeographies}
                addToast={addToast}
            />
        </div>
    );
};

export const EducationTab: React.FC<{ data: Partial<User>; onChange: (field: 'profile', value: any) => void; }> = ({ data, onChange }) => {
    const profile = data.profile || { status: 'Active' };
    const educationDetails = profile.educationDetails || [];

    const handleAddEducation = () => {
        const newEducation: AdvisorEducation = { id: `edu-${Date.now()}`, education: '', specialization: '', instituteName: '', university: '', fromDate: '', toDate: '', grade: '', totalMarks: 0, marksObtained: 0 };
        onChange('profile', { ...profile, educationDetails: [...educationDetails, newEducation] });
    };

    const handleRemoveEducation = (id: string) => {
        onChange('profile', { ...profile, educationDetails: educationDetails.filter(edu => edu.id !== id) });
    };

    const handleEducationChange = (id: string, field: keyof AdvisorEducation, value: any) => {
        const updatedEducation = educationDetails.map(edu => edu.id === id ? { ...edu, [field]: value } : edu);
        onChange('profile', { ...profile, educationDetails: updatedEducation });
    };

    return (
        <div className="space-y-4">
            {educationDetails.map(edu => (
                <div key={edu.id} className="p-4 border rounded-lg dark:border-gray-600 space-y-4 relative">
                    <Button variant="danger" size="small" onClick={() => handleRemoveEducation(edu.id)} className="absolute top-2 right-2 !p-2"><Trash2 size={16} /></Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Education" value={edu.education} onChange={(e) => handleEducationChange(edu.id, 'education', e.target.value)} />
                        <Input label="Specialization" value={edu.specialization} onChange={(e) => handleEducationChange(edu.id, 'specialization', e.target.value)} />
                        <Input label="Institute Name" value={edu.instituteName} onChange={(e) => handleEducationChange(edu.id, 'instituteName', e.target.value)} />
                        <Input label="University" value={edu.university} onChange={(e) => handleEducationChange(edu.id, 'university', e.target.value)} />
                        <Input label="From Date" type="date" value={edu.fromDate} onChange={(e) => handleEducationChange(edu.id, 'fromDate', e.target.value)} />
                        <Input label="To Date" type="date" value={edu.toDate} onChange={(e) => handleEducationChange(edu.id, 'toDate', e.target.value)} />
                        <Input label="Grade/Class" value={edu.grade} onChange={(e) => handleEducationChange(edu.id, 'grade', e.target.value)} />
                        <Input label="Total Marks" type="number" value={edu.totalMarks} onChange={(e) => handleEducationChange(edu.id, 'totalMarks', parseInt(e.target.value, 10))} />
                        <Input label="Marks Obtained" type="number" value={edu.marksObtained} onChange={(e) => handleEducationChange(edu.id, 'marksObtained', parseInt(e.target.value, 10))} />
                    </div>
                </div>
            ))}
            <Button variant="secondary" onClick={handleAddEducation}><PlusCircle size={16} /> Add Education</Button>
        </div>
    );
};

export const AdvisorCustomersTab: React.FC<{
    advisor: Partial<User>;
    allMembers: Member[];
    users: User[];
}> = ({ advisor, allMembers, users }) => {
    const assignedCustomers = useMemo(() => {
        return allMembers.filter(m => m.assignedTo?.includes(advisor.id || ''));
    }, [advisor, allMembers]);

    const MemberTierBadge = ({ memberType }: { memberType: Member['memberType']}) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            memberType === 'Gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
            memberType === 'Silver' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
            memberType === 'Diamond' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
            'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
        }`}>
            {memberType}
        </span>
      );

    return (
        <div className="space-y-4">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Policies</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {assignedCustomers.map(member => (
                            <tr key={member.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{member.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><MemberTierBadge memberType={member.memberType} /></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.city}, {member.state}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.policies.length}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {assignedCustomers.length === 0 && <div className="text-center py-10 text-gray-500 dark:text-gray-400"><Users size={32} className="mx-auto text-gray-300 dark:text-gray-600"/>No customers assigned.</div>}
            </div>
        </div>
    );
};