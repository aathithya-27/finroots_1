
import React, { useState } from 'react';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { Check, X } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAttendance: (status: 'Present' | 'Absent', reason?: string) => void;
  advisorName: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, onMarkAttendance, advisorName }) => {
    const [showReason, setShowReason] = useState(false);
    const [reason, setReason] = useState('');

    const handleAbsentClick = () => {
        setShowReason(true);
    };

    const handleMarkAbsent = () => {
        if (!reason.trim()) {
            alert('A reason is required when marking as absent.');
            return;
        }
        onMarkAttendance('Absent', reason);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-brand-dark dark:text-white">Mark Today's Attendance</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome, {advisorName}. Please mark your attendance for today.</p>
            </div>

            <div className="p-6 flex-grow">
                {showReason ? (
                    <div className="animate-fade-in space-y-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white">Reason for Absence</h3>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                            placeholder="e.g., Sick leave, personal emergency..."
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowReason(false)}>Back</Button>
                            <Button variant="danger" onClick={handleMarkAbsent} disabled={!reason.trim()}>Submit Absent</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            onClick={() => onMarkAttendance('Present')}
                            variant="success"
                            className="w-full justify-center !text-lg !py-4"
                        >
                            <Check size={20} className="mr-2" /> Mark as Present
                        </Button>
                        <Button
                            onClick={handleAbsentClick}
                            variant="danger"
                            className="w-full justify-center !text-lg !py-4"
                        >
                            <X size={20} className="mr-2" /> Mark as Absent
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
