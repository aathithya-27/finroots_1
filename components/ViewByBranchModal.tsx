import React, { useState, useEffect } from 'react';
import { FinRootsBranch } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { X } from 'lucide-react';

interface ViewByBranchModalProps {
    isOpen: boolean;
    onClose: () => void;
    branches: FinRootsBranch[];
    selectedBranches: string[];
    onApplyFilter: (selectedIds: string[]) => void;
}

export const ViewByBranchModal: React.FC<ViewByBranchModalProps> = ({ isOpen, onClose, branches, selectedBranches, onApplyFilter }) => {
    const [localSelection, setLocalSelection] = useState<string[]>(selectedBranches);

    useEffect(() => {
        if (isOpen) {
            setLocalSelection(selectedBranches);
        }
    }, [isOpen, selectedBranches]);

    const handleToggleBranch = (branchId: string) => {
        setLocalSelection(prev => 
            prev.includes(branchId) 
                ? prev.filter(id => id !== branchId)
                : [...prev, branchId]
        );
    };

    const handleSelectAll = () => {
        if (localSelection.length === branches.length) {
            setLocalSelection([]);
        } else {
            setLocalSelection(branches.map(b => b.id));
        }
    };
    
    const handleApply = () => {
        onApplyFilter(localSelection);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white">Filter by Branch</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
                <div className="flex items-center justify-between pb-2 border-b dark:border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            checked={localSelection.length === branches.length && branches.length > 0}
                            onChange={handleSelectAll}
                        />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Select All Branches</span>
                    </label>
                    <span className="text-sm text-gray-500">{localSelection.length} / {branches.length} selected</span>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {branches.map(branch => (
                         <label key={branch.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                checked={localSelection.includes(branch.id)}
                                onChange={() => handleToggleBranch(branch.id)}
                            />
                            <span className="text-sm text-gray-800 dark:text-gray-200">{branch.branchName}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 gap-3">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleApply}>Apply Filter</Button>
            </div>
        </Modal>
    );
};
