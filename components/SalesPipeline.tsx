import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Lead, PipelineStatus, User, LeadSource, LeadSourceMaster, FinRootsBranch, PolicyType, InsuranceTypeMaster } from '../types.ts';
import Button from './ui/Button.tsx';
import { Plus, IndianRupee, Briefcase, Check, X, MoreVertical, ArrowRight, UserPlus, XCircle, Trash2, Clock, CheckCircle, SlidersHorizontal, Lightbulb, Loader2 } from 'lucide-react';
import MultiSelectDropdown from './ui/MultiSelectDropdown.tsx';
import Input from './ui/Input.tsx';
import LeadSourceSelector from './LeadSourceSelector.tsx';
import { generateUpsellOpportunityForLead } from '../services/geminiService.ts';

interface SalesPipelineProps {
    leads: Lead[];
    users: User[];
    onOpenLeadModal: (lead: Lead | null) => void;
    onUpdateLead: (lead: Lead) => void;
    onConvertLead: (lead: Lead) => void;
    leadSources: LeadSourceMaster[];
    onDeleteLead: (leadId: string) => void;
    finrootsBranches: FinRootsBranch[];
    insuranceTypes: InsuranceTypeMaster[];
    addToast: (message: string, type?: 'success' | 'error') => void;
}

const KANBAN_COLUMNS: PipelineStatus[] = ['Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent'];

const KanbanCard: React.FC<{
    lead: Lead;
    assignee?: User;
    onUpdateLead: (lead: Lead) => void;
    onConvertLead: (lead: Lead) => void;
    onOpenLeadModal: (lead: Lead | null) => void;
    leadSources: LeadSourceMaster[];
    onDeleteLead: (leadId: string) => void;
    onFindOpportunity: (lead: Lead) => void;
    isFindingOpportunity: boolean;
}> = ({ lead, assignee, onUpdateLead, onConvertLead, onOpenLeadModal, leadSources, onDeleteLead, onFindOpportunity, isFindingOpportunity }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isStale = useMemo(() => {
        const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const lastUpdateDate = lead.lastUpdatedAt ? new Date(lead.lastUpdatedAt) : new Date(lead.createdAt);
        return (new Date().getTime() - lastUpdateDate.getTime()) > staleThreshold;
    }, [lead.lastUpdatedAt, lead.createdAt]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('leadId', lead.id);
        e.currentTarget.style.opacity = '0.5';
    };

    const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
    };

    const handleStatusChange = (newStatus: Lead['status']) => {
        if (newStatus === 'Won') {
            onConvertLead(lead);
        } else {
            onUpdateLead({ ...lead, status: newStatus });
        }
        setIsMenuOpen(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the lead "${lead.name}"? This action cannot be undone.`)) {
            onDeleteLead(lead.id);
        }
        setIsMenuOpen(false);
    };

    const getDisplaySource = (source?: LeadSource) => {
        if (!source || !source.sourceId) return { text: 'Unknown', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', fullText: 'Unknown' };
        
        const leadSourceMap = new Map(leadSources.map(ls => [ls.id, ls]));
        let current = leadSourceMap.get(source.sourceId);
        if (!current) return { text: 'Unknown', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', fullText: 'Unknown Source ID' };

        const path = [current.name];
        while(current?.parentId && leadSourceMap.has(current.parentId)) {
            current = leadSourceMap.get(current.parentId);
            path.unshift(current.name);
        }
        
        const rootSource = path[0];

        const sourceColors: Record<string, string> = {
            'Website': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            'Referral': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            'Advertisement': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
            'Cold Call': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
            'Institution': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
            'Other Forum': 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
            'Self Generated': 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
            'Existing Client': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
        };
        
        let fullText = path.join(' > ');
        if(source.detail) fullText += ` (${source.detail})`;

        return {
            text: rootSource,
            fullText: fullText,
            color: sourceColors[rootSource] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        };
    };

    const possibleStatuses: Lead['status'][] = ['Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost'];
    const displaySource = getDisplaySource(lead.leadSource);

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={() => onOpenLeadModal(lead)}
            className={`bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-2 border-gray-300 dark:border-gray-700 cursor-grab active:cursor-grabbing md:cursor-pointer transition-all duration-200 ${
                isStale ? 'border-l-4 border-yellow-400 dark:border-yellow-500' : 'border-l-4 border-transparent'
            }`}
        >
            <div className="flex justify-between items-start">
                <p className="font-semibold text-sm text-gray-800 dark:text-white flex-1 pr-2">{lead.name}</p>
                
                <div className="flex-shrink-0 flex items-center gap-2">
                    {isStale && <span title="This lead has not been updated in over a week."><Clock size={14} className="text-yellow-500" /></span>}
                    {assignee && (
                        <div className="hidden md:flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full text-gray-700 font-bold text-xs dark:bg-gray-700 dark:text-gray-200" title={assignee.name}>
                            {assignee.initials}
                        </div>
                    )}
                    <div className="relative md:hidden" ref={menuRef}>
                        <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }} className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <MoreVertical size={16} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg z-10 border dark:border-gray-700">
                                <p className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400">Move to...</p>
                                {possibleStatuses.map(status => {
                                    if (status === lead.status) return null;
                                    return (
                                        <button
                                            key={status}
                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(status); }}
                                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            {status === 'Won' && <UserPlus size={14} className="text-green-500" />}
                                            {status === 'Lost' && <XCircle size={14} className="text-red-500" />}
                                            {status !== 'Won' && status !== 'Lost' && <ArrowRight size={14} />}
                                            {status}
                                        </button>
                                    )
                                })}
                                <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                                <button
                                    key="delete"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                                >
                                    <Trash2 size={14} />
                                    Delete Lead
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{lead.phone}</p>
            <div className="flex justify-between items-center mt-3">
                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lead.estimatedValue)}
                </span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onFindOpportunity(lead); }} 
                        className="p-1.5 rounded-full text-purple-600 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/80 disabled:opacity-50"
                        title="Find Upsell Opportunity"
                        disabled={isFindingOpportunity}
                    >
                        {isFindingOpportunity ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                    </button>
                    <span title={displaySource.fullText} className={`text-xs font-medium px-2 py-0.5 rounded ${displaySource.color}`}>
                        {displaySource.text}
                    </span>
                </div>
            </div>
            {lead.upsellSuggestion && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                    <div className="flex items-start gap-2 text-indigo-800 dark:text-indigo-300">
                        <Lightbulb size={14} className="flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-medium">{lead.upsellSuggestion}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const KanbanColumn: React.FC<{
    status: PipelineStatus;
    leads: Lead[];
    userMap: Map<string, User>;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: PipelineStatus) => void;
    onUpdateLead: (lead: Lead) => void;
    onConvertLead: (lead: Lead) => void;
    onOpenLeadModal: (lead: Lead | null) => void;
    leadSources: LeadSourceMaster[];
    onDeleteLead: (leadId: string) => void;
    onFindOpportunity: (lead: Lead) => void;
    isFindingOpportunityFor: string | null;
}> = ({ status, leads, userMap, onDragOver, onDrop, onUpdateLead, onConvertLead, onOpenLeadModal, leadSources, onDeleteLead, onFindOpportunity, isFindingOpportunityFor }) => {
    
    const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);

    return (
        <div 
            className="w-72 flex-shrink-0 bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 h-full flex flex-col"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
        >
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 px-2 flex justify-between items-center">
                <span>{status}</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{leads.length}</span>
            </h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 mb-3">
                Value: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalValue)}
            </p>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {leads.map(lead => <KanbanCard key={lead.id} lead={lead} assignee={userMap.get(lead.assignedTo)} onUpdateLead={onUpdateLead} onConvertLead={onConvertLead} onOpenLeadModal={onOpenLeadModal} leadSources={leadSources} onDeleteLead={onDeleteLead} onFindOpportunity={onFindOpportunity} isFindingOpportunity={isFindingOpportunityFor === lead.id} />)}
            </div>
        </div>
    );
};

const DropZone: React.FC<{
    label: string;
    icon: React.ReactNode;
    color: string;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ label, icon, color, onDragOver, onDrop }) => (
    <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`w-full h-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors ${color}`}
    >
        {icon}
        <p className="mt-2 font-semibold text-sm">{label}</p>
    </div>
);

interface Filters {
    dateRange: { start: string; end: string };
    valueRange: { min: number; max: number };
    advisors: string[];
    branches: string[];
    leadSource: LeadSource;
    policyInterestType: string;
    policyInterestGeneralType: string;
}

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    onFilterChange: React.Dispatch<React.SetStateAction<Filters>>;
    onApply: () => void;
    onClear: () => void;
    advisors: User[];
    branches: FinRootsBranch[];
    branchOptions: { value: string; label: string }[];
    valueBounds: { min: number; max: number };
    leadSources: LeadSourceMaster[];
    insuranceTypes: InsuranceTypeMaster[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose, filters, onFilterChange, onApply, onClear, advisors, branches, branchOptions, valueBounds, leadSources, insuranceTypes }) => {
    const [valueRangeStrings, setValueRangeStrings] = useState({
        min: filters.valueRange.min === valueBounds.min ? '' : filters.valueRange.min.toString(),
        max: filters.valueRange.max === valueBounds.max ? '' : filters.valueRange.max.toString(),
    });

    const generalInsuranceTypes = useMemo(() => 
        insuranceTypes.filter(it => it.active && it.name !== 'Life Insurance' && it.name !== 'Health Insurance'),
    [insuranceTypes]);

    useEffect(() => {
        setValueRangeStrings({
            min: filters.valueRange.min === valueBounds.min ? '' : filters.valueRange.min.toString(),
            max: filters.valueRange.max === valueBounds.max ? '' : filters.valueRange.max.toString(),
        });
    }, [filters.valueRange, valueBounds]);

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        onFilterChange(prev => ({ ...prev, dateRange: { ...prev.dateRange, [field]: value } }));
    };

    const handleValueInputChange = (field: 'min' | 'max', valueStr: string) => {
        setValueRangeStrings(prev => ({ ...prev, [field]: valueStr }));

        const value = parseInt(valueStr, 10);
        let { min, max } = filters.valueRange;

        if (field === 'min') {
            min = isNaN(value) ? valueBounds.min : value;
        } else {
            max = isNaN(value) ? valueBounds.max : value;
        }
        onFilterChange(prev => ({ ...prev, valueRange: { min, max } }));
    };

    const setDatePreset = (preset: 'today' | '7d' | '30d') => {
        const end = new Date();
        const start = new Date();
        if (preset === '7d') start.setDate(end.getDate() - 7);
        if (preset === '30d') start.setDate(end.getDate() - 30);
        
        onFilterChange(prev => ({ ...prev, dateRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        }}));
    };

    const handleLeadSourceChange = (newSource: LeadSource) => {
        onFilterChange(prev => ({ ...prev, leadSource: newSource }));
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Filter Leads</h3>
                    <Button onClick={onClose} variant="light" className="!p-2"><X size={16} /></Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Creation Date</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="From" type="date" value={filters.dateRange.start} onChange={e => handleDateChange('start', e.target.value)} />
                            <Input label="To" type="date" value={filters.dateRange.end} onChange={e => handleDateChange('end', e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Button size="small" variant="light" onClick={() => setDatePreset('today')}>Today</Button>
                            <Button size="small" variant="light" onClick={() => setDatePreset('7d')}>Last 7 Days</Button>
                            <Button size="small" variant="light" onClick={() => setDatePreset('30d')}>Last 30 Days</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Lead Value</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Min Value (₹)"
                                type="number"
                                value={valueRangeStrings.min}
                                onChange={e => handleValueInputChange('min', e.target.value)}
                                placeholder={`${valueBounds.min.toLocaleString('en-IN')}`}
                            />
                            <Input
                                label="Max Value (₹)"
                                type="number"
                                value={valueRangeStrings.max}
                                onChange={e => handleValueInputChange('max', e.target.value)}
                                placeholder={`${valueBounds.max.toLocaleString('en-IN')}`}
                            />
                        </div>
                    </div>

                    <MultiSelectDropdown label="Filter by Advisor" options={advisors.map(a => ({ value: a.id, label: a.name }))} selectedValues={filters.advisors} onChange={selected => onFilterChange(prev => ({...prev, advisors: selected}))} />
                    <MultiSelectDropdown label="Filter by Branch" options={branchOptions} selectedValues={filters.branches} onChange={selected => onFilterChange(prev => ({...prev, branches: selected}))} />
                    
                    <div className="space-y-2">
                        <LeadSourceSelector
                            value={filters.leadSource}
                            onLeadSourceChange={handleLeadSourceChange}
                            leadSources={leadSources}
                        />
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Policy of Interest</h4>
                        <select
                            value={filters.policyInterestType}
                            onChange={e => onFilterChange(prev => ({...prev, policyInterestType: e.target.value, policyInterestGeneralType: ''}))}
                            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">All Types</option>
                            <option>Health Insurance</option>
                            <option>Life Insurance</option>
                            <option>General Insurance</option>
                        </select>
                        {filters.policyInterestType === 'General Insurance' && (
                            <select
                                value={filters.policyInterestGeneralType}
                                onChange={e => onFilterChange(prev => ({...prev, policyInterestGeneralType: e.target.value}))}
                                className="w-full h-10 px-3 py-2 border mt-2 border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white animate-fade-in"
                            >
                                <option value="">All General Types</option>
                                {generalInsuranceTypes.map(type => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
                    <Button variant="secondary" onClick={onClear}>Clear All</Button>
                    <Button variant="primary" onClick={onApply}>Apply Filters</Button>
                </div>
            </div>
        </>
    );
};

const SalesPipeline: React.FC<SalesPipelineProps> = ({ leads, users, onOpenLeadModal, onUpdateLead, onConvertLead, leadSources, onDeleteLead, finrootsBranches, insuranceTypes, addToast }) => {
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isFindingOpportunityFor, setIsFindingOpportunityFor] = useState<string | null>(null);

    const getDescendantIds = useCallback((parentId: string, allSources: LeadSourceMaster[]): string[] => {
        const children = allSources.filter(s => s.parentId === parentId);
        if (children.length === 0) return [];
        const descendantIds: string[] = children.map(c => c.id);
        children.forEach(c => {
            descendantIds.push(...getDescendantIds(c.id, allSources));
        });
        return descendantIds;
    }, []);

    const valueBounds = useMemo(() => {
        if (leads.length === 0) return { min: 0, max: 100000 };
        const values = leads.map(l => l.estimatedValue).filter(v => v > 0);
        if (values.length === 0) return { min: 0, max: 100000 };
        return {
            min: Math.floor(Math.min(...values) / 1000) * 1000,
            max: Math.ceil(Math.max(...values) / 1000) * 1000,
        };
    }, [leads]);

    const initialFilters: Filters = useMemo(() => ({
        dateRange: { start: '', end: '' },
        valueRange: { min: valueBounds.min, max: valueBounds.max },
        advisors: [],
        branches: [],
        leadSource: { sourceId: null, detail: '' },
        policyInterestType: '',
        policyInterestGeneralType: '',
    }), [valueBounds]);

    const [activeFilters, setActiveFilters] = useState<Filters>(initialFilters);
    const [tempFilters, setTempFilters] = useState<Filters>(initialFilters);

    useEffect(() => {
        if (isFilterPanelOpen) {
            setTempFilters(activeFilters);
        }
    }, [isFilterPanelOpen, activeFilters]);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const { dateRange, valueRange, advisors, branches, leadSource, policyInterestType, policyInterestGeneralType } = activeFilters;
            const leadDate = new Date(lead.createdAt).getTime();
            
            if (dateRange.start) {
                const startDate = new Date(dateRange.start).getTime();
                if (leadDate < startDate) return false;
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end).setHours(23, 59, 59, 999);
                if (leadDate > endDate) return false;
            }
            if (lead.estimatedValue < valueRange.min || lead.estimatedValue > valueRange.max) return false;
            if (advisors.length > 0 && !advisors.includes(lead.assignedTo)) return false;
            
            if (branches.length > 0) {
                const hasUnassigned = branches.includes('unassigned');
                const branchIds = branches.filter(b => b !== 'unassigned');
                const leadInSelectedBranches = lead.branchId && branchIds.includes(lead.branchId);
                const leadIsUnassigned = hasUnassigned && (!lead.branchId || lead.branchId === '');
    
                if (!leadInSelectedBranches && !leadIsUnassigned) {
                    return false;
                }
            }

            if (leadSource.sourceId) {
                const validSourceIds = [leadSource.sourceId, ...getDescendantIds(leadSource.sourceId, leadSources)];
                if (!lead.leadSource?.sourceId || !validSourceIds.includes(lead.leadSource.sourceId)) {
                    return false;
                }
            }
    
            if (policyInterestType && lead.policyInterestType !== policyInterestType) {
                return false;
            }
    
            if (policyInterestType === 'General Insurance' && policyInterestGeneralType && lead.policyInterestGeneralType !== policyInterestGeneralType) {
                return false;
            }


            return true;
        });
    }, [leads, activeFilters, leadSources, getDescendantIds]);

    const wonLeadsCount = useMemo(() => leads.filter(l => l.status === 'Won').length, [leads]);
    const totalLeadsForConversion = useMemo(() => leads.filter(l => l.status !== 'Lost').length, [leads]);
    const conversionRate = totalLeadsForConversion > 0 ? ((wonLeadsCount / totalLeadsForConversion) * 100) : 0;
    const totalPipelineValue = useMemo(() => leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').reduce((sum, lead) => sum + lead.estimatedValue, 0), [leads]);
    
    const leadsByStatus = useMemo(() => {
        const sortedLeads = [...filteredLeads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const initial: Record<PipelineStatus, Lead[]> = { 'Lead': [], 'Contacted': [], 'Meeting Scheduled': [], 'Proposal Sent': [], };
        return sortedLeads
            .filter(lead => KANBAN_COLUMNS.includes(lead.status as PipelineStatus))
            .reduce((acc, lead) => {
                acc[lead.status as PipelineStatus].push(lead);
                return acc;
            }, initial);
    }, [filteredLeads]);

    const handleFindOpportunity = useCallback(async (lead: Lead) => {
        setIsFindingOpportunityFor(lead.id);
        try {
            const suggestion = await generateUpsellOpportunityForLead(lead, addToast);
            if (suggestion) {
                onUpdateLead({ ...lead, upsellSuggestion: suggestion });
                addToast(`Opportunity found for ${lead.name}!`, 'success');
            } else {
                addToast(`No specific new opportunity found for ${lead.name}.`, 'success');
                if (lead.upsellSuggestion) {
                    onUpdateLead({ ...lead, upsellSuggestion: undefined });
                }
            }
        } catch (error) {
            console.error("Failed to find opportunity:", error);
            addToast("Failed to find opportunity due to an error.", "error");
        } finally {
            setIsFindingOpportunityFor(null);
        }
    }, [onUpdateLead, addToast]);

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
    const onDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: PipelineStatus) => { const leadId = e.dataTransfer.getData('leadId'); const lead = leads.find(l => l.id === leadId); if (lead && lead.status !== newStatus) { onUpdateLead({ ...lead, status: newStatus }); } };
    const onDropToWon = (e: React.DragEvent<HTMLDivElement>) => { const leadId = e.dataTransfer.getData('leadId'); const lead = leads.find(l => l.id === leadId); if (lead) { onConvertLead(lead); } };
    const onDropToLost = (e: React.DragEvent<HTMLDivElement>) => { const leadId = e.dataTransfer.getData('leadId'); const lead = leads.find(l => l.id === leadId); if (lead) { onUpdateLead({ ...lead, status: 'Lost' }); } };
    
    const applyFilters = () => { setActiveFilters(tempFilters); setIsFilterPanelOpen(false); };
    const clearFilters = () => { setActiveFilters(initialFilters); setTempFilters(initialFilters); setIsFilterPanelOpen(false); };
    
    const branchOptionsForFilter = useMemo(() => [
        { value: 'unassigned', label: 'Unassigned / No Branch' },
        ...finrootsBranches.map(b => ({ value: b.id, label: b.branchName }))
    ], [finrootsBranches]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (activeFilters.dateRange.start || activeFilters.dateRange.end) count++;
        if (activeFilters.valueRange.min > valueBounds.min || activeFilters.valueRange.max < valueBounds.max) count++;
        if (activeFilters.advisors.length > 0) count++;
        if (activeFilters.branches.length > 0) count++;
        if (activeFilters.leadSource.sourceId) count++;
        if (activeFilters.policyInterestType) count++;
        return count;
    }, [activeFilters, valueBounds]);

    const StatCard = ({ title, value, icon }: { title: string, value: React.ReactNode, icon: React.ReactNode }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center gap-4">
                {icon}
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <div>{value}</div>
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Lead Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your leads from initial contact to conversion.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={() => setIsFilterPanelOpen(true)} variant="light">
                        <SlidersHorizontal size={16} /> Filter {activeFilterCount > 0 && <span className="bg-brand-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
                    </Button>
                    <Button onClick={() => onOpenLeadModal(null)} variant="success">
                        <Plus size={16} /> Create New Lead
                    </Button>
                </div>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard 
                    title="Leads Converted" 
                    value={ <div className="flex items-baseline gap-1.5"><span className="text-3xl font-bold text-gray-800 dark:text-white">{wonLeadsCount}</span><span className="text-base font-semibold text-gray-500 dark:text-gray-400">({conversionRate.toFixed(1)}%)</span></div> } 
                    icon={<CheckCircle size={24} className="text-green-500"/>} 
                />
                <StatCard title="Pipeline Value" value={<span className="text-2xl font-bold text-gray-800 dark:text-white">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalPipelineValue)}</span>} icon={<IndianRupee size={24} className="text-blue-500"/>} />
                <StatCard title="Active Leads" value={<span className="text-2xl font-bold text-gray-800 dark:text-white">{totalLeadsForConversion - wonLeadsCount}</span>} icon={<Briefcase size={24} className="text-orange-500"/>} />
            </div>
            
            <FilterPanel 
                isOpen={isFilterPanelOpen}
                onClose={() => setIsFilterPanelOpen(false)}
                filters={tempFilters}
                onFilterChange={setTempFilters}
                onApply={applyFilters}
                onClear={clearFilters}
                advisors={users.filter(u => u.role === 'Advisor')}
                branches={finrootsBranches}
                branchOptions={branchOptionsForFilter}
                valueBounds={valueBounds}
                leadSources={leadSources}
                insuranceTypes={insuranceTypes}
            />

            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-28rem)] min-h-[500px]">
                {KANBAN_COLUMNS.map(status => (
                    <KanbanColumn
                        key={status} status={status} leads={leadsByStatus[status] || []} userMap={userMap}
                        onDragOver={onDragOver} onDrop={onDrop} onUpdateLead={onUpdateLead}
                        onConvertLead={onConvertLead} onOpenLeadModal={onOpenLeadModal}
                        leadSources={leadSources} onDeleteLead={onDeleteLead}
                        onFindOpportunity={handleFindOpportunity}
                        isFindingOpportunityFor={isFindingOpportunityFor}
                    />
                ))}
                 <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                    <div className="h-1/2"><DropZone label="Drag here to convert to customer" icon={<CheckCircle size={24} />} color="border-green-500 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300" onDragOver={onDragOver} onDrop={onDropToWon}/></div>
                     <div className="h-1/2"><DropZone label="Drag here to mark as lost" icon={<XCircle size={24} />} color="border-red-500 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300" onDragOver={onDragOver} onDrop={onDropToLost}/></div>
                </div>
            </div>
        </div>
    );
};

export default SalesPipeline;
