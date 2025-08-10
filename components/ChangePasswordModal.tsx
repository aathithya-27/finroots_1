import React, { useState } from 'react';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import { X, KeyRound } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (currentPassword: string, newPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSave }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSaveClick = () => {
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    onSave(currentPassword, newPassword);
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
            <KeyRound />
            Change Password
          </h2>
          <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="p-6 overflow-y-auto flex-grow space-y-4">
        {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center" role="alert">
                {error}
            </div>
        )}
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <div className="flex-shrink-0 flex justify-end p-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
        <Button onClick={handleClose} variant="secondary">Cancel</Button>
        <Button onClick={handleSaveClick} variant="primary">Save Changes</Button>
      </div>
    </Modal>
  );
};
