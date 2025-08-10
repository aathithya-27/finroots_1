import React, { useState, useEffect, useMemo } from 'react';
import { LeadSource, LeadSourceMaster, Member } from '../types.ts';
import Input from './ui/Input.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';
import Button from './ui/Button.tsx';
import { Plus } from 'lucide-react';

interface LeadSourceSelectorProps {
  value: LeadSource | undefined;
  onLeadSourceChange: (value: LeadSource) => void;
  leadSources: LeadSourceMaster[];
  allMembers?: Member[];
  currentMemberId?: string; // To prevent self-referral
  referrerId?: string;
  onReferrerSelect?: (memberId: string) => void;
  onAddNewReferrer?: () => void;
}

const LeadSourceSelector: React.FC<LeadSourceSelectorProps> = ({ value, onLeadSourceChange, leadSources, allMembers, currentMemberId, referrerId, onReferrerSelect, onAddNewReferrer }) => {
    const [path, setPath] = useState<(string | null)[]>([]);
    
    const leadSourceMap = useMemo(() => new Map(leadSources.map(ls => [ls.id, ls])), [leadSources]);
    const memberOptions = useMemo(() => (allMembers || []).filter(m => m.id !== currentMemberId).map(m => ({ value: m.id, label: `${m.name} (${m.mobile})`})), [allMembers, currentMemberId]);

    useEffect(() => {
        const newPath: (string|null)[] = [];
        let currentId = value?.sourceId || null;
        while(currentId) {
            const source = leadSourceMap.get(currentId);
            if (source) {
                newPath.unshift(source.id);
                currentId = source.parentId;
            } else {
                currentId = null;
            }
        }
        setPath(newPath);
    }, [value, leadSourceMap]);

    const handlePathChange = (level: number, selectedId: string) => {
        const newPath = path.slice(0, level);
        newPath[level] = selectedId;
        
        onLeadSourceChange({ sourceId: selectedId, detail: '' });
        if (onReferrerSelect) {
            onReferrerSelect(''); // Clear referrer if source changes
        }
        
        setPath(newPath);
    };
    
    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onLeadSourceChange({ sourceId: value?.sourceId || null, detail: e.target.value });
    };

    const showReferrerField = useMemo(() => {
        if (!value?.sourceId) return false;
        let current = leadSourceMap.get(value.sourceId);
        while (current) {
            const lowerCaseName = current.name.toLowerCase();
            if (lowerCaseName === 'referral' || lowerCaseName === 'existing client') {
                return true;
            }
            current = current.parentId ? leadSourceMap.get(current.parentId) : undefined;
        }
        return false;
    }, [value, leadSourceMap]);

    const isLeafNodeSelected = useMemo(() => {
        if (!value?.sourceId) return false;
        return !leadSources.some(ls => ls.parentId === value.sourceId && ls.active !== false);
    }, [value, leadSources]);

    const renderDropdowns = () => {
        const dropdowns = [];
        let parentId: string | null = null;

        for (let i = 0; i <= path.length; i++) {
            const options = leadSources.filter(ls => ls.parentId === parentId && ls.active !== false);
            if (options.length === 0 && i > 0) break;

            dropdowns.push(
                <select
                    key={`level-${i}`}
                    value={path[i] || ''}
                    onChange={(e) => handlePathChange(i, e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="">Select Source...</option>
                    {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
            );
            
            if (path[i]) {
                parentId = path[i];
            } else {
                break;
            }
        }
        return dropdowns;
    };
    
    return (
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600/50">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lead Source Details *</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {renderDropdowns()}
            </div>
            {isLeafNodeSelected && (
                <div className="animate-fade-in pt-2">
                    {showReferrerField && allMembers && onReferrerSelect ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referrer *</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-grow">
                                    <SearchableSelect
                                        label=""
                                        options={memberOptions}
                                        value={referrerId || ''}
                                        onChange={onReferrerSelect}
                                        placeholder="Search existing customers..."
                                    />
                                </div>
                                {onAddNewReferrer && (
                                <Button variant="light" onClick={onAddNewReferrer} className="flex-shrink-0 !h-10">
                                    <Plus size={16}/> Add New
                                </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Input
                            label="Details (Optional)"
                            placeholder="e.g., Facebook Ad Campaign, Specific exhibition name"
                            value={value?.detail || ''}
                            onChange={handleDetailChange}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default LeadSourceSelector;