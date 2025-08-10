import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Member, User, LeadSource, Route, LeadSourceMaster, Geography, CustomerCategory, CustomerSubCategory, CustomerGroup } from '../../types.ts';
import Input from '../ui/Input.tsx';
import Button from '../ui/Button.tsx';
import { ShieldCheck, Search, Loader2, Info, MapPin, Copy, Target, BrainCircuit, Link as LinkIcon } from 'lucide-react';
import { bloodGroups } from '../../constants.tsx';
import { findMemberByMobile } from '../../services/apiService.ts';
import { generateDigipinFromCoords, enrichDigipinLocation, getCoordsFromDigipin } from '../../services/geminiService.ts';
import ToggleSwitch from '../ui/ToggleSwitch.tsx';
import LeadSourceSelector from '../LeadSourceSelector.tsx';
import SearchableSelect from '../ui/SearchableSelect.tsx';

interface BasicInfoTabProps {
  data: Partial<Member>;
  onChange: (field: keyof Member, value: any) => void;
  errors: Partial<Record<keyof Member | 'bankDetailsError', string>>;
  addToast: (message: string, type?: 'success' | 'error') => void;
  currentUser: User | null;
  users: User[];
  routes: Route[];
  onUpdateRoutes: (data: Route[]) => void; // Add this prop
  allMembers: Member[];
  leadSources: LeadSourceMaster[];
  geographies: Geography[];
  onUpdateGeographies: (data: Geography[]) => void;
  customerCategories: CustomerCategory[];
  customerSubCategories: CustomerSubCategory[];
  customerGroups: CustomerGroup[];
  onAddNewReferrer?: () => void;
}

// Custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


const MemberTypeBadge = ({ memberType }: { memberType: Member['memberType']}) => (
    <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full ${
        memberType === 'Gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
        memberType === 'Silver' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
        memberType === 'Diamond' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
        'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
    }`}>
        {memberType}
    </span>
);


export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ data, onChange, errors, addToast, currentUser, users, routes, onUpdateRoutes, allMembers, leadSources, geographies, onUpdateGeographies, customerCategories, customerSubCategories, customerGroups, onAddNewReferrer }) => {
  const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [otp, setOtp] = useState('');
  
  // --- NEW: State for location sync ---
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [isSyncingDigipin, setIsSyncingDigipin] = useState(false);
  const [isSyncingCoords, setIsSyncingCoords] = useState(false);
  
  // Refs to prevent sync loops
  const lastCoordsSetByAI = useRef<{ lat?: number, lng?: number }>({});
  const lastDigipinSetByAI = useRef<string | undefined>(undefined);
  
  // --- NEW: Debounce inputs to avoid excessive API calls ---
  const debouncedLat = useDebounce(data.lat, 800);
  const debouncedLng = useDebounce(data.lng, 800);
  const debouncedDigipin = useDebounce(data.digipin, 800);
  
  const advisors = useMemo(() => users.filter(u => u.role === 'Advisor'), [users]);
  const advisorOptions = useMemo(() => advisors.map(adv => ({ value: adv.id, label: adv.name })), [advisors]);
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  const canDeactivate = useMemo(() => {
    if (!data.policies || data.policies.length === 0) {
        return true; 
    }
    return data.policies.every(p => p.status === 'Inactive');
  }, [data.policies]);

  const hasFamilyPolicy = useMemo(() => {
    return (data.policies || []).some(p => p.policyHolderType === 'Family');
  }, [data.policies]);
  
  const potentialSpocs = useMemo(() => {
    const spocs = [{ id: data.id, name: data.name, mobile: data.mobile }];
    if (hasFamilyPolicy) {
        const coveredMembers = (data.policies || [])
            .filter(p => p.policyHolderType === 'Family')
            .flatMap(p => p.coveredMembers || []);
        
        coveredMembers.forEach(cm => {
            if (!spocs.some(s => s.name === cm.name)) { // Avoid duplicates
                spocs.push({ id: `cm-${cm.id}`, name: cm.name, mobile: cm.mobile });
            }
        });
    }
    return spocs;
  }, [data, hasFamilyPolicy]);

  const handleStatusToggle = (newStatus: boolean) => {
    if (newStatus === false && !canDeactivate) {
        addToast("Cannot deactivate member. All of their policies must be set to 'Inactive' first.", "error");
        return;
    }
    onChange('active', newStatus);
  };
  
    const states = useMemo(() => {
        const country = geographies.find(g => g.type === 'Country' && g.name === 'India');
        if (!country) return [];
        return geographies.filter(g => g.parentId === country.id && g.type === 'State' && g.active !== false);
    }, [geographies]);

    const selectedStateObject = useMemo(() => {
        return geographies.find(g => g.name === data.state && g.type === 'State' && g.active !== false);
    }, [data.state, geographies]);

    const districts = useMemo(() => {
        if (!selectedStateObject) return [];
        return geographies.filter(g => g.parentId === selectedStateObject.id && g.type === 'District' && g.active !== false);
    }, [selectedStateObject, geographies]);

    const selectedDistrictObject = useMemo(() => {
        return geographies.find(g => g.name === data.district && g.parentId === selectedStateObject?.id && g.type === 'District' && g.active !== false);
    }, [data.district, selectedStateObject, geographies]);

    const cities = useMemo(() => {
        if (!selectedDistrictObject) return [];
        return geographies.filter(g => g.parentId === selectedDistrictObject.id && g.type === 'City' && g.active !== false);
    }, [selectedDistrictObject, geographies]);

    const handleStateChange = (newStateName: string) => {
        onChange('state', newStateName);
        onChange('district', '');
        onChange('city', '');
    };

    const handleDistrictChange = (newDistrictName: string) => {
        onChange('district', newDistrictName);
        onChange('city', '');
    };

    const handleCreateState = (newStateName: string) => {
        const country = geographies.find(g => g.type === 'Country' && g.name === 'India');
        if (!country) {
            addToast("Cannot create state: Country 'India' not found in master data.", "error");
            return;
        }
        const newState: Geography = {
            id: `geo-${Date.now()}`,
            name: newStateName,
            type: 'State',
            parentId: country.id,
            active: true,
        };
        onUpdateGeographies([...geographies, newState]);
        handleStateChange(newStateName);
        addToast(`State "${newStateName}" created and added to master data.`, 'success');
    };
    
    const handleCreateDistrict = (newDistrictName: string) => {
        if (!selectedStateObject) {
            addToast("Please select a state before creating a new district.", "error");
            return;
        }
        const newDistrict: Geography = {
            id: `geo-${Date.now()}`,
            name: newDistrictName,
            type: 'District',
            parentId: selectedStateObject.id,
            active: true,
        };
        onUpdateGeographies([...geographies, newDistrict]);
        handleDistrictChange(newDistrictName);
        addToast(`District "${newDistrictName}" created and added to master data.`, 'success');
    };

    const handleCreateCity = (newCityName: string) => {
        if (!selectedDistrictObject) {
            addToast("Please select a district before creating a new city.", "error");
            return;
        }
        const newCity: Geography = {
            id: `geo-${Date.now()}`,
            name: newCityName,
            type: 'City',
            parentId: selectedDistrictObject.id,
            active: true,
        };
        onUpdateGeographies([...geographies, newCity]);
        onChange('city', newCityName);
        addToast(`City "${newCityName}" created and added to master data.`, 'success');
    };


  useEffect(() => {
    // CRITICAL FIX: Only generate a new memberId for new customers.
    // For existing customers, the memberId must remain stable to prevent breaking links.
    if (data.id) {
        return;
    }

    // New memberId format as requested by the user.
    const namePart = (data.name || '')
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 2)
        .toUpperCase()
        .padEnd(2, '_');

    const addressDigits = (data.address || '').replace(/[^0-9]/g, '');
    const addressPart = addressDigits.slice(0, 2).padEnd(2, '0');

    const mobilePart = (data.mobile || '')
        .replace(/[^0-9]/g, '')
        .slice(-5)
        .padEnd(5, '_');

    const newId = `${namePart}${addressPart}${mobilePart}`;
        
    // Only update if it's different to prevent re-renders.
    if (newId !== data.memberId) {
        onChange('memberId', newId);
    }
  }, [data.id, data.name, data.address, data.mobile, data.memberId, onChange]);

  useEffect(() => {
    // Reset verification status when member changes or modal opens
    setIsVerified(false);
    setIsVerifying(false);
    setOtp('');
  }, [data.id]);

  const handleVerifyClick = () => {
    setIsVerifying(true);
    // In a real app, an API call would be made to send an OTP
    addToast("Simulated OTP sent: 123456", "success");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456') {
      setIsVerified(true);
      setIsVerifying(false);
      addToast("Mobile number verified successfully!", "success");
    } else {
      addToast("Invalid OTP. Please try again.", "error");
    }
  };

  const handleFetchDetails = async () => {
    if (!data.mobile || errors.mobile) {
        addToast("Please enter a valid mobile number first.", "error");
        return;
    }
    setIsFetchingDetails(true);
    const foundMember = await findMemberByMobile(data.mobile);
    if(foundMember) {
        (Object.keys(foundMember) as Array<keyof Member>).forEach(key => {
            onChange(key, foundMember[key]);
        });
        addToast("Pre-filled member details found!", "success");
    } else {
        addToast("No pre-registered member found with this mobile.", "error");
    }
    setIsFetchingDetails(false);
  };
  
  const handleMultiAssigneeChange = (advisorId: string) => {
      onChange('assignedTo', advisorId ? [advisorId] : []);
  };
  
    const filteredSubCategories = useMemo(() => {
    if (!data.customerCategoryId) return [];
    return customerSubCategories.filter(sc => sc.parentId === data.customerCategoryId);
  }, [data.customerCategoryId, customerSubCategories]);
  
  const handleSpocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSpocId = e.target.value;
    const spoc = potentialSpocs.find(s => s.id === selectedSpocId);
    onChange('spocMemberId', selectedSpocId);
    onChange('spocMobile', spoc?.mobile || '');
  };

  // --- NEW: Coords -> Digipin Sync ---
  useEffect(() => {
    const isValidCoord = (c: number | undefined) => typeof c === 'number' && !isNaN(c);
    
    // Prevent running if the values were just set by the other sync effect
    if (lastCoordsSetByAI.current.lat === debouncedLat && lastCoordsSetByAI.current.lng === debouncedLng) {
      return;
    }
    
    if (isValidCoord(debouncedLat) && isValidCoord(debouncedLng)) {
        const syncDigipin = async () => {
            setIsSyncingDigipin(true);
            try {
                const digipin = await generateDigipinFromCoords(debouncedLat!, debouncedLng!, addToast);
                lastDigipinSetByAI.current = digipin; // Store to prevent loop
                onChange('digipin', digipin);
                
                // Also enrich the location
                const enrichment = await enrichDigipinLocation(debouncedLat!, debouncedLng!, addToast);
                onChange('digipinDetails', enrichment);
            } catch (error) {
                addToast('Failed to generate Digipin from coordinates.', 'error');
            } finally {
                setIsSyncingDigipin(false);
            }
        };
        syncDigipin();
    }
  }, [debouncedLat, debouncedLng, onChange, addToast]);

  // --- NEW: Digipin -> Coords Sync ---
  useEffect(() => {
    const digipinRegex = /^[2-9CFGHJMPQRVWX]{8}\+[2-9CFGHJMPQRVWX]{2,3}$/i;

    // Prevent running if the value was just set by the other sync effect
    if (lastDigipinSetByAI.current === debouncedDigipin) {
      return;
    }

    if (debouncedDigipin && digipinRegex.test(debouncedDigipin)) {
        const syncCoords = async () => {
            setIsSyncingCoords(true);
            try {
                const coords = await getCoordsFromDigipin(debouncedDigipin, addToast);
                if (coords) {
                    lastCoordsSetByAI.current = coords; // Store to prevent loop
                    onChange('lat', coords.lat);
                    onChange('lng', coords.lng);

                    // Also enrich the location
                    const enrichment = await enrichDigipinLocation(coords.lat, coords.lng, addToast);
                    onChange('digipinDetails', enrichment);
                }
            } catch (error) {
                addToast('Failed to resolve Digipin to coordinates.', 'error');
            } finally {
                setIsSyncingCoords(false);
            }
        };
        syncCoords();
    }
  }, [debouncedDigipin, onChange, addToast]);
  
  // --- FIXED: GPS Capture ---
  const handleGpsCapture = useCallback(() => {
    if (!navigator.geolocation) {
        addToast("Geolocation is not supported by this browser.", "error");
        return;
    }
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            // Set the lat/lng. The debounced effect will handle generating the digipin.
            onChange('lat', latitude);
            onChange('lng', longitude);
            addToast("Location captured successfully! Generating Digipin...", 'success');
            setIsCapturingGps(false);
        },
        (error) => {
            let errorMessage = "Could not get your location. Please check browser settings.";
            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = "Location access was denied. Please enable it in your browser settings.";
            }
            addToast(errorMessage, "error");
            setIsCapturingGps(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // More robust options
    );
  }, [addToast, onChange]);

  const handleCopyDigipin = () => {
    if (data.digipin) {
        navigator.clipboard.writeText(data.digipin);
        addToast('Digipin copied to clipboard!', 'success');
    }
  };

  const [addressLine1, addressLine2 = ''] = useMemo(() => (data.address || '').split('\n'), [data.address]);

  const handleAddressChange = useCallback((line: 1 | 2, value: string) => {
      let lines = (data.address || '').split('\n');
      if (lines.length < 2) {
          lines = [lines[0] || '', ''];
      }
      if (line === 1) {
          lines[0] = value;
      } else {
          lines[1] = value;
      }
      onChange('address', lines.slice(0, 2).join('\n'));
  }, [data.address, onChange]);

  const handleCreateRoute = (newRouteName: string) => {
      if (routes.some(r => r.name.toLowerCase() === newRouteName.toLowerCase())) {
          addToast(`Route "${newRouteName}" already exists.`, "error");
          return;
      }
      const newRoute: Route = {
          id: `route-${Date.now()}`,
          name: newRouteName,
          active: true,
          order: routes.length,
      };
      onUpdateRoutes([...routes, newRoute]);
      onChange('routeId', newRoute.id); // Automatically select the new route
      addToast(`Route "${newRouteName}" created and selected.`, 'success');
  };

  return (
    <div className="space-y-6">
        {/* Section: Family Grouping (SPOC) */}
        <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg border border-blue-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Family Grouping (SPOC)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={!!data.isSPOC}
                            onChange={(e) => onChange('isSPOC', e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">This member is the primary contact (SPOC)</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-7">Check this if this member manages the family policies.</p>
                </div>

                {hasFamilyPolicy ? (
                    <div className="animate-fade-in">
                        <label htmlFor="spocMemberId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Point of Contact</label>
                        <select
                            id="spocMemberId"
                            value={data.spocMemberId || ''}
                            onChange={handleSpocChange}
                            className={selectClasses}
                        >
                            <option value="">Select a SPOC...</option>
                            {potentialSpocs.map(spoc => (
                                <option key={spoc.id} value={spoc.id}>
                                    {spoc.name} {spoc.mobile ? `(${spoc.mobile})` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select who should be contacted for this family's policies.</p>
                    </div>
                ) : (
                    <div>
                        <Input
                            label="Family Name (Optional)"
                            id="familyName"
                            value={data.familyName || ''} 
                            onChange={(e) => onChange('familyName', e.target.value)}
                            placeholder="e.g., The Kumar Family"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Section: Customer ID & Tier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Customer ID" id="memberId" value={data.memberId || ''} readOnly disabled />
            <div>
                <label htmlFor="memberType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Membership Tier</label>
                <div className="h-10 flex items-center">
                    <MemberTypeBadge memberType={data.memberType || 'Silver'} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tier is automatically calculated based on policies.</p>
            </div>
        </div>

        {/* Section: Customer Segmentation */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Segmentation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="customerCategoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select id="customerCategoryId" value={data.customerCategoryId || ''} onChange={e => { onChange('customerCategoryId', e.target.value); onChange('customerSubCategoryId', ''); }} className={selectClasses}>
                        <option value="">Select Category...</option>
                        {customerCategories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="customerSubCategoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Category</label>
                    <select id="customerSubCategoryId" value={data.customerSubCategoryId || ''} onChange={e => onChange('customerSubCategoryId', e.target.value)} className={selectClasses} disabled={!data.customerCategoryId}>
                        <option value="">Select Sub-Category...</option>
                        {filteredSubCategories.filter(sc => sc.active).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="customerGroupId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group</label>
                    <select id="customerGroupId" value={data.customerGroupId || ''} onChange={e => onChange('customerGroupId', e.target.value)} className={selectClasses}>
                        <option value="">Select Group...</option>
                        {customerGroups.filter(g => g.active).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
        
        {/* Section: Personal & Contact Info */}
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <Input label="Name *" id="name" value={data.name || ''} onChange={(e) => onChange('name', e.target.value)} />
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <Input label="Date of Birth *" id="dob" type="date" value={data.dob || ''} onChange={(e) => onChange('dob', e.target.value)} />
                    {errors.dob && <p className="text-red-600 text-xs mt-1">{errors.dob}</p>}
                </div>
                <div>
                    <Input label="Wedding Anniversary" id="anniversary" type="date" value={data.anniversary || ''} onChange={(e) => onChange('anniversary', e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                    <div className="flex items-center gap-4 pt-2">
                        {(['Male', 'Female', 'Transgender', 'Other'] as const).map(g => (
                            <label key={g} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300">
                                <input type="radio" name="gender" value={g} checked={data.gender === g} onChange={(e) => onChange('gender', e.target.value as any)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 dark:border-gray-600" />
                                {g}
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                    <select id="bloodGroup" value={data.bloodGroup || ''} onChange={(e) => onChange('bloodGroup', e.target.value)} className={selectClasses}>
                        <option value="">Select...</option>
                        {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 items-end">
                    <div className="md:col-span-2">
                        <Input label="Mobile *" id="mobile" type="tel" value={data.mobile || ''} onChange={(e) => onChange('mobile', e.target.value)} disabled={isVerified || isVerifying}/>
                        {errors.mobile && <p className="text-red-600 text-xs mt-1">{errors.mobile}</p>}
                    </div>
                    <div className="w-full">
                        {!data.id && ( // Only show for new members
                            <Button onClick={handleFetchDetails} disabled={isFetchingDetails} className="w-full h-10" variant="light">
                                {isFetchingDetails ? <Loader2 className="animate-spin" size={16}/> : <Search size={16} />}
                                Fetch
                            </Button>
                        )}
                    </div>
                    <div className="w-full">
                        {isVerified ? (
                            <div className="flex items-center justify-center gap-2 h-10 text-green-600 font-semibold bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/50 dark:border-green-800 dark:text-green-300">
                                <ShieldCheck size={18} />
                                <span>Verified</span>
                            </div>
                        ) : isVerifying ? (
                            <form onSubmit={handleOtpSubmit} className="flex items-center gap-2 w-full">
                                <Input id="otp" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required/>
                                <Button type="submit" variant="success" className="h-10">OK</Button>
                            </form>
                        ) : (
                            <Button onClick={handleVerifyClick} disabled={!data.mobile || !!errors.mobile} className="w-full h-10">
                                Verify
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            
            <div>
                <Input label="Email" id="email" type="email" value={data.email || ''} onChange={(e) => onChange('email', e.target.value)} />
            </div>
        </div>

        {/* Section: Assignment & Sourcing */}
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marital Status</label>
                    <select id="maritalStatus" value={data.maritalStatus || 'Single'} onChange={(e) => onChange('maritalStatus', e.target.value as any)} className={selectClasses}>
                        <option>Single</option>
                        <option>Married</option>
                        <option>Divorced</option>
                        <option>Widowed</option>
                    </select>
                </div>
                <div>
                    <SearchableSelect
                        label="Assigned Advisor(s)"
                        options={advisorOptions}
                        value={(data.assignedTo && data.assignedTo[0]) || ''}
                        onChange={handleMultiAssigneeChange}
                        placeholder={currentUser?.role !== 'Admin' ? (users.find(u=>u.id === data.assignedTo?.[0])?.name || 'Unassigned') : 'Select an advisor...'}
                    />
                </div>
            </div>

            <div>
                <SearchableSelect
                    label="Routes"
                    options={routes.filter(r => r.active).map(r => ({ value: r.id, label: r.name }))}
                    value={data.routeId || ''}
                    onChange={(value) => onChange('routeId', value)}
                    onCreate={handleCreateRoute}
                    placeholder="Select or type to create a new route..."
                />
            </div>

            <div>
                <LeadSourceSelector 
                    value={data.leadSource}
                    onLeadSourceChange={(newValue) => onChange('leadSource', newValue)}
                    leadSources={leadSources}
                    allMembers={allMembers}
                    currentMemberId={data.id}
                    referrerId={data.referrerId}
                    onReferrerSelect={(memberId) => onChange('referrerId', memberId)}
                    onAddNewReferrer={onAddNewReferrer}
                />
            </div>
        </div>

        {/* Section: Address */}
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <SearchableSelect
                        label="Country"
                        options={[{ value: 'India', label: 'India' }]}
                        value={'India'}
                        onChange={() => {}}
                        disabled={true}
                    />
                </div>
                <div>
                    <SearchableSelect
                        label="State"
                        options={states.map(s => ({ value: s.name, label: s.name }))}
                        value={data.state || ''}
                        onChange={handleStateChange}
                        onCreate={handleCreateState}
                        placeholder="Select or type to create..."
                    />
                </div>
                <div>
                   <SearchableSelect
                        label="District"
                        options={districts.map(d => ({ value: d.name, label: d.name }))}
                        value={data.district || ''}
                        onChange={handleDistrictChange}
                        onCreate={handleCreateDistrict}
                        placeholder="Select or type to create..."
                        disabled={!data.state}
                    />
                </div>
                <div>
                    <SearchableSelect
                        label="City"
                        options={cities.map(c => ({ value: c.name, label: c.name }))}
                        value={data.city || ''}
                        onChange={(newCity) => onChange('city', newCity)}
                        onCreate={handleCreateCity}
                        placeholder="Select or type to create..."
                        disabled={!data.district}
                    />
                </div>
            </div>
            
            <div>
                <Input label="Address Line 1" id="address1" value={addressLine1} onChange={(e) => handleAddressChange(1, e.target.value)} placeholder="House No, Street Name" />
            </div>
            
            <div>
                <Input label="Address Line 2" id="address2" value={addressLine2} onChange={(e) => handleAddressChange(2, e.target.value)} placeholder="Area, Landmark" />
            </div>
        </div>
        
        {/* Section: Location */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin size={20} /> Location
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="relative">
                        <Input 
                            label="Latitude" 
                            type="number" 
                            step="any"
                            value={data.lat === undefined ? '' : data.lat}
                            onChange={(e) => onChange('lat', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            placeholder="e.g., 12.722"
                        />
                        {isSyncingCoords && <Loader2 className="animate-spin w-4 h-4 text-gray-400 absolute right-3 top-10" />}
                    </div>
                    <div className="relative">
                        <Input 
                            label="Longitude" 
                            type="number" 
                            step="any"
                            value={data.lng === undefined ? '' : data.lng}
                            onChange={(e) => onChange('lng', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            placeholder="e.g., 77.832"
                        />
                        {isSyncingCoords && <Loader2 className="animate-spin w-4 h-4 text-gray-400 absolute right-3 top-10" />}
                    </div>
                    <Button type="button" onClick={handleGpsCapture} disabled={isCapturingGps} className="flex-1 justify-center h-10" title="Get Current Location">
                        {isCapturingGps ? <Loader2 className="animate-spin" /> : <Target />}
                        {isCapturingGps ? 'Capturing...' : 'Get Location'}
                    </Button>
                </div>
                
                <div className="relative">
                    <Input
                        label="Digipin (Plus Code)"
                        id="digipin"
                        value={data.digipin || ''}
                        onChange={(e) => onChange('digipin', e.target.value)}
                        placeholder="e.g., 7J5R9R5Q+5R"
                    />
                    {isSyncingDigipin && <Loader2 className="animate-spin w-4 h-4 text-gray-400 absolute right-3 top-10" />}
                </div>
            </div>
        </div>
        
        {/* Section: Account Status */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Account Status</h4>
                <p className={`text-sm font-semibold ${data.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>
                    {data.active ? 'Active' : 'Inactive'}
                </p>
                {!canDeactivate && data.active && 
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">To deactivate, all policies must be set to 'Inactive' first.</p>
                }
            </div>
            <ToggleSwitch
                enabled={!!data.active}
                onChange={handleStatusToggle}
                srLabel="Toggle account status"
            />
        </div>
    </div>
  );
};
