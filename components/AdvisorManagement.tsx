
import React, { useState, useMemo, useEffect } from 'react';
import { User, Member, FinRootsBranch } from '../types.ts';
import Button from './ui/Button.tsx';
import { Plus, Search, Edit, Users, Building, Info, ArrowUp, ArrowDown } from 'lucide-react';
import ToggleSwitch from './ui/ToggleSwitch.tsx';
import { ViewByBranchModal } from './ViewByBranchModal.tsx';
import Pagination from './ui/Pagination.tsx';

type AttendanceRecord = { status: 'Present' | 'Absent'; reason?: string; timestamp: string };
type AttendanceState = Record<string, AttendanceRecord>;
type SortKey = 'name' | 'load' | 'joiningDate' | 'branch' | 'attendance';
type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };

const ITEMS_PER_PAGE = 10;

interface AdvisorManagementProps {
  users: User[];
  allMembers: Member[];
  onOpenAdvisorModal: (advisor: User | null) => void;
  onToggleStatus: (userId: string) => void;
  attendance: AttendanceState;
  onUpdateAttendance: (userId: string, status: 'Present' | 'Absent', reason?: string) => void;
  finrootsBranches: FinRootsBranch[];
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const AdvisorManagement: React.FC<AdvisorManagementProps> = ({ users, allMembers, onOpenAdvisorModal, onToggleStatus, attendance, onUpdateAttendance, finrootsBranches, addToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All Advisors' | 'Active' | 'Inactive'>('Active');
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, branchFilter]);

  const advisorLoad = useMemo(() => {
    const loadMap = new Map<string, number>();
    allMembers.forEach(member => {
        if (Array.isArray(member.assignedTo)) {
            member.assignedTo.forEach(advisorId => {
                loadMap.set(advisorId, (loadMap.get(advisorId) || 0) + 1);
            });
        }
    });
    return loadMap;
  }, [allMembers]);
  
  const branchMap = useMemo(() => new Map(finrootsBranches.map(b => [b.id, b.branchName])), [finrootsBranches]);

  const advisors = useMemo(() => {
    let filteredAdvisors = users.filter(user => 
        user.role === 'Advisor' && 
        (user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) || 
         user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (statusFilter !== 'All Advisors') {
        filteredAdvisors = filteredAdvisors.filter(adv => adv.profile?.status === statusFilter);
    }

    if (branchFilter.length > 0) {
        filteredAdvisors = filteredAdvisors.filter(adv => adv.profile?.employeeBranchId && branchFilter.includes(adv.profile.employeeBranchId));
    }

    filteredAdvisors.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
            case 'load':
                aValue = advisorLoad.get(a.id) || 0;
                bValue = advisorLoad.get(b.id) || 0;
                break;
            case 'joiningDate':
                aValue = new Date(a.profile?.dateOfJoining || 0).getTime();
                bValue = new Date(b.profile?.dateOfJoining || 0).getTime();
                break;
            case 'branch':
                aValue = branchMap.get(a.profile?.employeeBranchId || '') || 'ZZZ'; // Unassigned last
                bValue = branchMap.get(b.profile?.employeeBranchId || '') || 'ZZZ';
                break;
            case 'attendance':
                aValue = attendance[a.id]?.status || 'Z'; // Not Marked last
                bValue = attendance[b.id]?.status || 'Z';
                break;
            case 'name':
            default:
                aValue = a.name;
                bValue = b.name;
                break;
        }
        
        if (aValue === bValue) return 0;
        
        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return filteredAdvisors;
  }, [users, searchQuery, statusFilter, branchFilter, sortConfig, advisorLoad, branchMap, attendance]);
  
  const totalPages = Math.ceil(advisors.length / ITEMS_PER_PAGE);
  const currentAdvisors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return advisors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, advisors]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const SortableHeader: React.FC<{ sortKey: SortKey; label: string; className?: string; }> = ({ sortKey, label, className = '' }) => (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}>
        <button onClick={() => handleSort(sortKey)} className="flex items-center gap-1 group transition-colors hover:text-gray-700 dark:hover:text-gray-100">
            {label}
            <div className="w-4">
                {sortConfig.key === sortKey ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                ) : (
                    <ArrowUp size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        </button>
    </th>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Advisor Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create, view, and manage advisor profiles.</p>
        </div>
        <Button onClick={() => onOpenAdvisorModal(null)} variant="success">
            <Plus size={16} /> Create New Advisor
        </Button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Employee ID or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                 <Button onClick={() => setIsBranchModalOpen(true)} variant="light" className="h-10 justify-center">
                    <Building size={16} /> 
                    Filter by Branch {branchFilter.length > 0 ? `(${branchFilter.length})` : ''}
                </Button>
                 <div className="flex items-center gap-2">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Advisor</label>
                    <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="All Advisors">All Advisors</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                    <SortableHeader sortKey="name" label="Employee" />
                    <SortableHeader sortKey="branch" label="Branch" />
                    <SortableHeader sortKey="joiningDate" label="Date of Joining" />
                    <SortableHeader sortKey="load" label="Load" />
                    <SortableHeader sortKey="attendance" label="Attendance Today" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentAdvisors.map((advisor, index) => (
                    <tr key={advisor.id} className={`transition-opacity ${advisor.profile?.status === 'Active' ? 'opacity-100' : 'opacity-60'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            {advisor.profile?.photoUrl ? (
                                <img className="h-10 w-10 rounded-full object-cover" src={advisor.profile.photoUrl} alt={advisor.name} />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300">
                                    {advisor.initials}
                                </div>
                            )}
                            <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{advisor.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{advisor.employeeId}</div>
                            </div>
                        </div>
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                         {branchMap.get(advisor.profile?.employeeBranchId || '') || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {advisor.profile?.dateOfJoining ? new Date(advisor.profile.dateOfJoining).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{advisorLoad.get(advisor.id) || 0}</span>
                        <span className="mx-1">/</span>
                        <span>{advisor.profile?.maxCapacity || '∞'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {attendance[advisor.id]?.status === 'Present' ? <span className="font-semibold text-green-600 dark:text-green-400">Present</span> :
                         attendance[advisor.id]?.status === 'Absent' ? <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">Absent <span title={`Reason: ${attendance[advisor.id].reason}`}><Info size={14} className="cursor-help" /></span></span> :
                         <span className="text-gray-500 italic">Not Marked</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ToggleSwitch 
                          enabled={advisor.profile?.status === 'Active'}
                          onChange={() => onToggleStatus(advisor.id)}
                          srLabel={`Toggle status for ${advisor.name}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Button size="small" variant="light" onClick={() => onOpenAdvisorModal(advisor)}>
                                <Edit className="w-4 h-4" /> Edit
                            </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {advisors.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No advisors found matching your search.
                </div>
              )}
            </div>
        </div>
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={advisors.length}
        />
      </div>
      
      <ViewByBranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={finrootsBranches}
        selectedBranches={branchFilter}
        onApplyFilter={setBranchFilter}
      />
    </div>
  );
};

export default AdvisorManagement;