

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Member, ModalTab, User, ProcessStage, FinRootsBranch } from '../types.ts';
import { Edit, Users, Mic, Phone, FileSignature, UserCheck, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { ViewIcon } from './ui/Icons.tsx';
import ToggleSwitch from './ui/ToggleSwitch.tsx';

interface MemberTableProps {
  members: Member[];
  allMembers: Member[]; // Full list for context
  currentUser: User | null;
  users: User[];
  onEdit: (member: Member, initialTab?: ModalTab) => void;
  onDelete: (memberId: string) => void; // Kept for prop compatibility, but not used for inactive members.
  onToggleStatus: (memberId: string) => void;
  onGenerateReview: (memberId: string) => void;
  processFlow: ProcessStage[];
  finrootsBranches: FinRootsBranch[];
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
}

const MemberTable: React.FC<MemberTableProps> = ({ members, allMembers, currentUser, users, onEdit, onDelete, onToggleStatus, onGenerateReview, processFlow, finrootsBranches, sortConfig, onSort }) => {
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setOpenDropdown(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
  const memberIdToNameMap = useMemo(() => new Map(allMembers.map(m => [m.memberId, m.name])), [allMembers]);
  const branchMap = useMemo(() => new Map(finrootsBranches.map(b => [b.id, b.branchName])), [finrootsBranches]);

  const getSpocName = useCallback((member: Member) => {
    if (!member.spocMemberId || member.spocMemberId === member.id) {
      return "Self";
    }

    const allCoveredMembers = (member.policies || []).flatMap(p => p.coveredMembers || []);
    const spocAsCoveredMember = allCoveredMembers.find(cm => `cm-${cm.id}` === member.spocMemberId);
    if (spocAsCoveredMember) {
      return spocAsCoveredMember.name;
    }
    
    // Fallback for full member SPOC
    const spocAsFullMember = allMembers.find(m => m.id === member.spocMemberId);
    if (spocAsFullMember) {
      return spocAsFullMember.name;
    }

    return "SPOC";
  }, [allMembers]);

  const SortableHeader: React.FC<{ sortKey: string; label: string; className?: string; }> = ({ sortKey, label, className = '' }) => (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}>
        <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 group transition-colors hover:text-gray-700 dark:hover:text-gray-100">
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


  if (members.length === 0) {
    return (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600"/>
            <p className="mt-4 text-lg font-semibold">No Customers Found</p>
            <p className="mt-1 text-sm">No customers match the current filter or search criteria.</p>
        </div>
    );
  }

  const MemberTypeBadge = ({ memberType }: { memberType: Member['memberType']}) => (
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
    <>
      {/* Desktop Table View */}
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
            <SortableHeader sortKey="name" label="Customer Name" />
            <SortableHeader sortKey="assignedTo" label="Assigned To" />
            <SortableHeader sortKey="branch" label="Branch" />
            <SortableHeader sortKey="memberType" label="Customer Type" />
            <SortableHeader sortKey="customerGroup" label="Customer Group" />
            <SortableHeader sortKey="city" label="City" />
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mobile Number</th>
            <SortableHeader sortKey="status" label="Status" />
            <SortableHeader sortKey="createdAt" label="Date of Creation" />
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {members.map((member, index) => {
            const spocName = getSpocName(member);
            const hasDifferentSpoc = member.spocMobile && member.spocMobile !== member.mobile;
            const primaryAdvisor = users.find(u => u.id === member.assignedTo?.[0]);
            const branchName = primaryAdvisor?.profile?.employeeBranchId ? branchMap.get(primaryAdvisor.profile.employeeBranchId) : 'N/A';
            
            // HIERARCHY FIX (USER REQUEST):
            // If a member has a parent (spocId), their family group name in the table should be
            // their PARENT's family name, not their own (even if they have started their own family).
            // This ensures the correct hierarchy is always displayed in the main table view.
            const parentSpoc = member.spocId ? allMembers.find(m => m.memberId === member.spocId) : null;
            const displayFamilyName = parentSpoc ? parentSpoc.familyName : member.familyName;

            return (
            <tr key={member.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-opacity ${!member.active ? 'opacity-60 hover:opacity-100' : ''}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                    {member.isSPOC && <span title="Single Point of Contact" className="px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/50 dark:text-blue-300">SPOC</span>}
                </div>
                {(member.spocId) && (
                    <div className="text-xs text-gray-400" title={displayFamilyName ? `Family: ${displayFamilyName}` : `Linked to SPOC: ${memberIdToNameMap.get(member.spocId!)}`}>
                        {displayFamilyName ? `Family: ${displayFamilyName}` : `SPOC: ${memberIdToNameMap.get(member.spocId!)}`}
                    </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{member.assignedTo?.map(id => userMap.get(id)).filter(Boolean).join(', ') || 'Unassigned'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{branchName}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                  <MemberTypeBadge memberType={member.memberType} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {(member.isSPOC || member.spocId) ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">Family</span>
                ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Individual</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{member.city}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {hasDifferentSpoc ? (
                    <div className="relative" ref={openDropdown === member.id ? dropdownRef : null}>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === member.id ? null : member.id)}
                        className="flex items-center gap-2 hover:text-brand-primary dark:hover:text-blue-400 w-full text-left"
                      >
                        <Phone size={14} />
                        <span className="flex-1">{member.spocMobile}</span>
                        <ChevronDown size={16} className={`transition-transform ${openDropdown === member.id ? 'rotate-180' : ''}`} />
                      </button>
                      {openDropdown === member.id && (
                        <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700">
                          <a href={`tel:${member.spocMobile}`} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">{`${spocName}: ${member.spocMobile}`}</a>
                          <a href={`tel:${member.mobile}`} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">{`Self: ${member.mobile}`}</a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <a href={`tel:${member.mobile}`} className="flex items-center gap-2 hover:text-brand-primary dark:hover:text-blue-400">
                      <Phone size={14} />
                      <span>{member.mobile}</span>
                    </a>
                  )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                <ToggleSwitch 
                    enabled={member.active} 
                    onChange={() => onToggleStatus(member.id)} 
                    srLabel={`Toggle status for ${member.name}`}
                    disabled={currentUser?.role !== 'Admin'}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-GB') : 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button onClick={() => onEdit(member, ModalTab.BasicInfo)} className="text-brand-primary hover:text-blue-800 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600" aria-label={`Edit ${member.name}`}>
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(member, ModalTab.NotesAndReminders)} className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-gray-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-gray-600" aria-label={`Add note for ${member.name}`}>
                    <Mic className="w-4 h-4" />
                  </button>
                  <button onClick={() => onGenerateReview(member.id)} className="text-purple-600 hover:text-purple-800 p-1 rounded-md hover:bg-gray-100 dark:text-purple-400 dark:hover:text-purple-200 dark:hover:bg-gray-600" aria-label={`Generate review for ${member.name}`}>
                    <FileSignature className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(member, ModalTab.Policies)} className="text-gray-600 hover:text-gray-800 p-1 rounded-md hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-600" aria-label={`View ${member.name}`}>
                    <ViewIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="md:hidden p-4 space-y-4">
        {members.map((member, index) => {
          const spocName = getSpocName(member);
          const hasDifferentSpoc = member.spocMobile && member.spocMobile !== member.mobile;
          const primaryAdvisor = users.find(u => u.id === member.assignedTo?.[0]);
          const branchName = primaryAdvisor?.profile?.employeeBranchId ? branchMap.get(primaryAdvisor.profile.employeeBranchId) : 'N/A';
          
          // HIERARCHY FIX FOR MOBILE (Same logic as desktop):
          // This ensures the correct family name is displayed in the mobile card view.
          const parentSpoc = member.spocId ? allMembers.find(m => m.memberId === member.spocId) : null;
          const displayFamilyName = parentSpoc ? parentSpoc.familyName : member.familyName;

          return (
          <div key={member.id} className={`bg-white p-4 rounded-lg shadow-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-opacity ${!member.active ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-brand-dark dark:text-white">{member.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {index + 1} &bull; {member.city}</p>
                {(member.spocId) && (
                    <div className="mt-1 text-xs text-gray-400" title={displayFamilyName ? `Family: ${displayFamilyName}` : `Linked to SPOC: ${memberIdToNameMap.get(member.spocId!)}`}>
                        {displayFamilyName ? `Family: ${displayFamilyName}` : `SPOC: ${memberIdToNameMap.get(member.spocId!)}`}
                    </div>
                )}
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                  <button onClick={() => onEdit(member, ModalTab.BasicInfo)} className="text-brand-primary hover:text-blue-800 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={`Edit ${member.name}`}>
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => onEdit(member, ModalTab.NotesAndReminders)} className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-gray-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-gray-700" aria-label={`Add note for ${member.name}`}>
                    <Mic className="w-5 h-5" />
                  </button>
                   <button onClick={() => onGenerateReview(member.id)} className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-gray-100 dark:text-purple-400 dark:hover:text-purple-200 dark:hover:bg-gray-700" aria-label={`Generate review for ${member.name}`}>
                    <FileSignature className="w-5 h-5" />
                  </button>
                  <button onClick={() => onEdit(member, ModalTab.Policies)} className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700" aria-label={`View ${member.name}`}>
                    <ViewIcon className="w-5 h-5" />
                  </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                 <div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Branch</p>
                    <p className="text-brand-text dark:text-gray-300">{branchName}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Customer Type</p>
                    <MemberTypeBadge memberType={member.memberType} />
                </div>
                 <div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Customer Group</p>
                     {(member.isSPOC || member.spocId) ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">Family</span>
                    ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Individual</span>
                    )}
                </div>
                 <div className="flex items-center gap-2">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Status:</p>
                    <ToggleSwitch enabled={member.active} onChange={() => onToggleStatus(member.id)} disabled={currentUser?.role !== 'Admin'} />
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Assigned To</p>
                    <p className="text-brand-text dark:text-gray-300">{member.assignedTo?.map(id => userMap.get(id)).filter(Boolean).join(', ') || 'Unassigned'}</p>
                </div>
                 <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Mobile</p>
                    {hasDifferentSpoc ? (
                        <div className="relative w-full" ref={openDropdown === member.id ? dropdownRef : null}>
                            <button
                                onClick={() => setOpenDropdown(openDropdown === member.id ? null : member.id)}
                                className="flex items-center gap-2 hover:text-brand-primary dark:hover:text-blue-400 w-full text-left p-1 -ml-1"
                            >
                                <Phone size={14} />
                                <span className="text-brand-text dark:text-gray-300">{member.spocMobile}</span>
                                <ChevronDown size={16} className={`transition-transform ${openDropdown === member.id ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === member.id && (
                                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700">
                                    <a href={`tel:${member.spocMobile}`} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">{`${spocName}: ${member.spocMobile}`}</a>
                                    <a href={`tel:${member.mobile}`} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">{`Self: ${member.mobile}`}</a>
                                </div>
                            )}
                        </div>
                    ) : (
                         <a href={`tel:${member.mobile}`} className="flex items-center gap-2 hover:text-brand-primary dark:hover:text-blue-400 p-1 -ml-1">
                            <Phone size={14} />
                            <span className="text-brand-text dark:text-gray-300">{member.mobile}</span>
                        </a>
                    )}
                </div>
                <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Date of Creation</p>
                     <p className="text-brand-text dark:text-gray-300">{member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-GB') : 'N/A'}</p>
                </div>
            </div>
          </div>
        )})}
      </div>
    </>
  );
};

export default MemberTable;