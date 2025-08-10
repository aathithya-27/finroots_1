
import React, { useState } from 'react';
import { Member } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { X, AlertTriangle } from 'lucide-react';

interface DuplicateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: Member[];
  pendingMember: Partial<Member> | null;
  onCreateNew: () => void;
  onUpdateExisting: (existingMemberId: string) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const DuplicateMemberModal: React.FC<DuplicateMemberModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  pendingMember,
  onCreateNew,
  onUpdateExisting,
  addToast,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleUpdateClick = () => {
    if (selectedMemberId) {
      onUpdateExisting(selectedMemberId);
    } else {
      addToast('Please select an existing customer to update.', 'error');
    }
  };
  
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedMemberId(e.target.value);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-brand-dark dark:text-white">Potential Duplicate Found</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">The generated ID <strong className="text-gray-700 dark:text-gray-300">{pendingMember?.memberId}</strong> already exists.</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        <div className="p-6 pt-0 space-y-4 max-h-[50vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">New customer you are creating:</h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border dark:border-gray-600">
                <p className="font-bold text-gray-800 dark:text-white">{pendingMember?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{pendingMember?.address}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{pendingMember?.mobile}</p>
            </div>

            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Existing customers with the same ID:</h3>
            <div className="space-y-3">
            {duplicates.map(member => (
                <label key={member.id} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedMemberId === member.id ? 'border-brand-primary bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
                    <input type="radio" name="duplicate-selection" value={member.id} checked={selectedMemberId === member.id} onChange={handleRadioChange} className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300"/>
                    <div>
                        <p className="font-bold text-gray-800 dark:text-white">{member.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.address}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.mobile}</p>
                    </div>
                </label>
            ))}
            </div>
        </div>

        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end p-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
            <Button onClick={onClose} variant="secondary">Cancel & Review Entry</Button>
            <Button onClick={handleUpdateClick} disabled={!selectedMemberId} variant="light">Update Selected Customer</Button>
            <Button onClick={onCreateNew} variant="primary">Create as New Customer</Button>
        </div>
    </Modal>
  );
};

export default DuplicateMemberModal;
