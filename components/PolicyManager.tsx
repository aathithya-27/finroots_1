import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Member, ModalTab, User, FinRootsBranch } from '../types.ts';
import Button from './ui/Button.tsx';
import { Search, Calendar, AlertTriangle, CheckCircle, Clock, FileText, BrainCircuit, Loader2, UploadCloud, X, SlidersHorizontal, ArrowUp, ArrowDown, IndianRupee } from 'lucide-react';
import { ViewIcon } from './ui/Icons.tsx';
import { analyzeCompetitorPolicy } from '../services/geminiService.ts';
import Input from './ui/Input.tsx';
import MultiSelectDropdown from './ui/MultiSelectDropdown.tsx';
import Pagination from './ui/Pagination.tsx';

interface PolicyManagerProps {
  members: Member[];
  onRenewPolicy: (memberId: string, policyId: string) => Promise<boolean>;
  onViewMember: (member: Member, initialTab?: ModalTab) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  users: User[];
  finrootsBranches: FinRootsBranch[];
}

interface Filters {
    renewalDateRange: { start: string; end: string };
    premiumRange: { min: number; max: number };
    advisors: string[];
    branches: string[];
}

const ITEMS_PER_PAGE = 10;

const FilterPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    onFilterChange: React.Dispatch<React.SetStateAction<Filters>>;
    onApply: () => void;
    onClear: () => void;
    advisors: User[];
    branches: FinRootsBranch[];
    valueBounds: { min: number; max: number };
}> = ({ isOpen, onClose, filters, onFilterChange, onApply, onClear, advisors, branches, valueBounds }) => {
    const handleDateChange = (field: 'start' | 'end', value: string) => {
        onFilterChange(prev => ({ ...prev, renewalDateRange: { ...prev.renewalDateRange, [field]: value } }));
    };

    const handleValueChange = (field: 'min' | 'max', value: string) => {
        onFilterChange(prev => ({...prev, premiumRange: { ...prev.premiumRange, [field]: parseInt(value) || 0 }}));
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Filter Policies</h3>
                    <Button onClick={onClose} variant="light" className="!p-2"><X size={16} /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Renewal Date</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="From" type="date" value={filters.renewalDateRange.start} onChange={e => handleDateChange('start', e.target.value)} />
                            <Input label="To" type="date" value={filters.renewalDateRange.end} onChange={e => handleDateChange('end', e.target.value)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Premium Range (₹)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Min Premium" type="number" value={filters.premiumRange.min || ''} onChange={e => handleValueChange('min', e.target.value)} placeholder={`${valueBounds.min.toLocaleString('en-IN')}`} />
                            <Input label="Max Premium" type="number" value={filters.premiumRange.max || ''} onChange={e => handleValueChange('max', e.target.value)} placeholder={`${valueBounds.max.toLocaleString('en-IN')}`} />
                        </div>
                    </div>
                     <MultiSelectDropdown label="Filter by Advisor" options={advisors.map(a => ({ value: a.id, label: a.name }))} selectedValues={filters.advisors} onChange={selected => onFilterChange(prev => ({...prev, advisors: selected}))} />
                     <MultiSelectDropdown label="Filter by Branch" options={branches.map(b => ({ value: b.id, label: b.branchName }))} selectedValues={filters.branches} onChange={selected => onFilterChange(prev => ({...prev, branches: selected}))} />
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
                    <Button variant="secondary" onClick={onClear}>Clear All</Button>
                    <Button variant="primary" onClick={onApply}>Apply Filters</Button>
                </div>
            </div>
        </>
    );
};


const PolicyManager: React.FC<PolicyManagerProps> = ({ members, onRenewPolicy, onViewMember, addToast, users, finrootsBranches }) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'daysLeft', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
  const branchMap = useMemo(() => new Map(finrootsBranches.map(b => [b.id, b.branchName])), [finrootsBranches]);

  const allPolicies = useMemo(() => {
    let pk_counter = 1;
    return members.flatMap(member =>
      member.policies
      // **FAMILY LOGIC**: Only include 'Family' policies if the member is a SPOC. Individual policies are always included.
      .filter(policy => policy.policyHolderType !== 'Family' || member.isSPOC)
      .map(policy => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const renewalDate = new Date(policy.renewalDate);
        renewalDate.setHours(0, 0, 0, 0);

        const diffTime = renewalDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let renewalStatus: 'Active' | 'Pending' | 'Overdue' = 'Active';
        if (daysLeft < 0) {
            renewalStatus = 'Overdue';
        } else if (daysLeft <= 30) {
            renewalStatus = 'Pending';
        }

        const primaryAdvisor = users.find(u => u.id === member.assignedTo?.[0]);

        return {
          ...policy,
          pk: pk_counter++,
          memberName: member.name,
          memberId: member.id,
          fullMember: member,
          daysLeft,
          renewalStatus: renewalStatus,
          advisorId: primaryAdvisor?.id,
          branchId: primaryAdvisor?.profile?.employeeBranchId,
        };
      })
    );
  }, [members, users]);
  
  const valueBounds = useMemo(() => {
    if (allPolicies.length === 0) return { min: 0, max: 100000 };
    const values = allPolicies.map(p => p.premium);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [allPolicies]);

  const initialFilters: Filters = useMemo(() => ({
    renewalDateRange: { start: '', end: '' },
    premiumRange: { min: valueBounds.min, max: valueBounds.max },
    advisors: [],
    branches: [],
  }), [valueBounds]);

  const [activeFilters, setActiveFilters] = useState<Filters>(initialFilters);
  const [tempFilters, setTempFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
      if (isFilterPanelOpen) {
          setTempFilters(activeFilters);
      }
  }, [isFilterPanelOpen, activeFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, statusFilter]);

  const filteredAndSortedPolicies = useMemo(() => {
    let filtered = allPolicies.filter(policy => {
        const { renewalDateRange, premiumRange, advisors, branches } = activeFilters;
        
        if (advisors.length > 0 && !advisors.includes(policy.advisorId || '')) return false;
        if (branches.length > 0 && !branches.includes(policy.branchId || '')) return false;
        if (policy.premium < premiumRange.min || policy.premium > premiumRange.max) return false;

        const renewalDate = new Date(policy.renewalDate).getTime();
        if (renewalDateRange.start) {
            const startDate = new Date(renewalDateRange.start).getTime();
            if (renewalDate < startDate) return false;
        }
        if (renewalDateRange.end) {
            const endDate = new Date(renewalDateRange.end).setHours(23, 59, 59, 999);
            if (renewalDate > endDate) return false;
        }
        
        if (statusFilter !== 'All Statuses') {
            if (!policy.commission || policy.commission.status !== statusFilter) {
                return false;
            }
        }

        return true;
    });

    filtered.sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;

        let aValue: any;
        let bValue: any;

        switch (key) {
            case 'pk': aValue = a.pk; bValue = b.pk; break;
            case 'memberName': aValue = a.memberName.toLowerCase(); bValue = b.memberName.toLowerCase(); break;
            case 'policyType': aValue = a.policyType; bValue = b.policyType; break;
            case 'premium': aValue = a.premium; bValue = b.premium; break;
            case 'renewalDate': aValue = new Date(a.renewalDate).getTime(); bValue = new Date(b.renewalDate).getTime(); break;
            case 'daysLeft': aValue = a.daysLeft; bValue = b.daysLeft; break;
            case 'renewalStatus': aValue = a.renewalStatus; bValue = b.renewalStatus; break;
            case 'advisor': aValue = userMap.get(a.advisorId || '') || 'Z'; bValue = userMap.get(b.advisorId || '') || 'Z'; break;
            case 'branch': aValue = branchMap.get(a.branchId || '') || 'Z'; bValue = branchMap.get(b.branchId || '') || 'Z'; break;
            default: return 0;
        }

        if (aValue < bValue) return -1 * dir;
        if (aValue > bValue) return 1 * dir;
        return 0;
    });

    return filtered;
  }, [allPolicies, activeFilters, statusFilter, sortConfig, userMap, branchMap]);

  const totalPages = Math.ceil(filteredAndSortedPolicies.length / ITEMS_PER_PAGE);
  const currentPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedPolicies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredAndSortedPolicies]);

  const summaryStats = useMemo(() => {
    return filteredAndSortedPolicies.reduce((acc, policy) => {
        acc.totalPolicies += 1;
        if (policy.daysLeft < 0) {
            acc.overduePolicies += 1;
        } else if (policy.daysLeft <= 7) {
            acc.dueIn7Days += 1;
        } else if (policy.daysLeft <= 30) {
            acc.dueIn30Days += 1;
        }
        return acc;
    }, {
        totalPolicies: 0,
        dueIn30Days: 0,
        dueIn7Days: 0,
        overduePolicies: 0,
    });
  }, [filteredAndSortedPolicies]);


  const handleRenew = (memberId: string, policyId: string) => onRenewPolicy(memberId, policyId);

  const SortableHeader: React.FC<{ sortKey: string; label: string }> = ({ sortKey, label }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        <button onClick={() => setSortConfig(prev => ({ key: sortKey, direction: prev.key === sortKey && prev.direction === 'asc' ? 'desc' : 'asc' }))} className="group inline-flex items-center">
            {label}
            <span className={`ml-2 flex-none rounded ${sortConfig.key === sortKey ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-200' : 'text-gray-400 invisible group-hover:visible'}`}>
                {sortConfig.key === sortKey ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUp size={14} />}
            </span>
        </button>
    </th>
  );
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.renewalDateRange.start || activeFilters.renewalDateRange.end) count++;
    if (activeFilters.premiumRange.min > valueBounds.min || activeFilters.premiumRange.max < valueBounds.max) count++;
    if (activeFilters.advisors.length > 0) count++;
    if (activeFilters.branches.length > 0) count++;
    return count;
  }, [activeFilters, valueBounds]);

  const StatCard = ({ title, value, icon, colorClasses }: { title: string; value: string | number; icon: React.ReactNode; colorClasses: string }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex items-center gap-4">
        <div className={`p-3 rounded-full ${colorClasses}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
  );

  const StatusBadge = ({ status } : { status: string }) => {
    const statusStyles = {
        Active: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', dot: 'bg-green-500' },
        Pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', dot: 'bg-yellow-500' },
        Overdue: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', dot: 'bg-red-500' }
    };
    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles['Active'];
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}><span className={`w-2 h-2 mr-1.5 rounded-full ${style.dot}`}></span>{status}</span>);
  };

  const EmptyState = () => (
    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600"/>
        <p className="mt-2 text-sm font-semibold">No Policies Found</p>
        <p className="mt-1 text-xs">No policies match the current filter.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <FilterPanel isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)} filters={tempFilters} onFilterChange={setTempFilters} onApply={() => { setActiveFilters(tempFilters); setIsFilterPanelOpen(false); }} onClear={() => { setActiveFilters(initialFilters); setTempFilters(initialFilters); }} advisors={users.filter(u=>u.role === 'Advisor')} branches={finrootsBranches} valueBounds={valueBounds}/>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Policy Management</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage all customer policies and renewals.</p>
          </div>
          <Button onClick={() => setIsFilterPanelOpen(true)} variant="light">
              <SlidersHorizontal size={16} /> Filter {activeFilterCount > 0 && <span className="bg-brand-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
          </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Policies" value={summaryStats.totalPolicies} icon={<FileText size={22} className="text-purple-600 dark:text-purple-300" />} colorClasses="bg-purple-100 dark:bg-purple-900/50" />
          <StatCard title="Due in 30 Days" value={summaryStats.dueIn30Days} icon={<Calendar size={22} className="text-blue-600 dark:text-blue-300" />} colorClasses="bg-blue-100 dark:bg-blue-900/50" />
          <StatCard title="Due in 7 Days" value={summaryStats.dueIn7Days} icon={<Clock size={22} className="text-orange-600 dark:text-orange-300" />} colorClasses="bg-orange-100 dark:bg-orange-900/50" />
          <StatCard title="Overdue" value={summaryStats.overduePolicies} icon={<AlertTriangle size={22} className="text-red-600 dark:text-red-300" />} colorClasses="bg-red-100 dark:bg-red-900/50" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-6">
            <div className="flex justify-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option>All Statuses</option>
                <option>Pending</option>
                <option>Paid</option>
                <option>Cancelled</option>
              </select>
            </div>
            
            <div className="mt-6 overflow-x-auto">
              {filteredAndSortedPolicies.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <SortableHeader sortKey="pk" label="ID" />
                      <SortableHeader sortKey="memberName" label="Customer" />
                      <SortableHeader sortKey="policyType" label="Policy Type" />
                      <SortableHeader sortKey="advisor" label="Assigned To" />
                      <SortableHeader sortKey="branch" label="Branch" />
                      <SortableHeader sortKey="premium" label="Premium" />
                      <SortableHeader sortKey="renewalDate" label="Renewal Date" />
                      <SortableHeader sortKey="daysLeft" label="Days Left" />
                      <SortableHeader sortKey="renewalStatus" label="Status" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentPolicies.map(policy => (
                      <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">{policy.pk}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{policy.memberName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{policy.policyType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{userMap.get(policy.advisorId || '') || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{branchMap.get(policy.branchId || '') || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(policy.premium)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(policy.renewalDate).toLocaleDateString('en-GB')}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${policy.daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{policy.daysLeft >= 0 ? `${policy.daysLeft} days` : `${Math.abs(policy.daysLeft)} days overdue`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={policy.renewalStatus} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button size="small" variant="light" onClick={() => onViewMember(policy.fullMember, ModalTab.Policies)}><ViewIcon className="w-4 h-4" /> View</Button>
                            <Button size="small" variant="primary" onClick={() => handleRenew(policy.memberId, policy.id)}><CheckCircle className="w-4 h-4" /> Renew</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700"><EmptyState /></div>
              )}
            </div>
        </div>
        {filteredAndSortedPolicies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredAndSortedPolicies.length}
          />
        )}
      </div>
    </div>
  );
};

export default PolicyManager;
