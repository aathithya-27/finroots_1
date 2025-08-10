

import React, { useState, useEffect, useMemo } from 'react';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import { X, KeyRound, Mail, Loader2, CheckCircle, Building, AtSign } from 'lucide-react';
import { User, Company } from '../types.ts';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    onResetPassword: (company: string, employeeId: string, newPassword: string) => Promise<boolean>;
    addToast: (message: string, type?: 'success' | 'error') => void;
    operatingCompanies: Company[];
}

type Step = 'enter_id' | 'enter_otp_password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, users, onResetPassword, addToast, operatingCompanies }) => {
    const [step, setStep] = useState<Step>('enter_id');
    const [companyCode, setCompanyCode] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const companyMap = useMemo(() => new Map(operatingCompanies.map(c => [c.companyCode, c.name])), [operatingCompanies]);

    useEffect(() => {
        if(companyCode) {
            const name = companyMap.get(companyCode.toUpperCase());
            setCompanyName(name || 'Invalid Code');
        } else {
            setCompanyName('');
        }
    }, [companyCode, companyMap]);
    
    useEffect(() => {
        setEmail('');
        if(companyName && companyName !== 'Invalid Code' && employeeId) {
            const user = users.find(u => u.employeeId.toLowerCase() === employeeId.toLowerCase() && u.company === companyName);
            if (user && user.email) {
                setEmail(user.email);
            }
        }
    }, [companyName, employeeId, users]);


    const handleSendOtp = () => {
        setError('');
        if (!employeeId || !companyName || companyName === 'Invalid Code') {
            setError('Please enter a valid company code and employee ID.');
            return;
        }
        
        if (!email) {
            setError('No account found with that ID for the selected company.');
            return;
        }

        const maskedEmail = email.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
        addToast(`Simulated OTP (123456) sent to ${maskedEmail}`, 'success');
        setStep('enter_otp_password');
    };

    const handleReset = async () => {
        setError('');
        if (!otp || !newPassword || !confirmPassword) {
            setError('All fields are required.');
            return;
        }
        if (otp !== '123456') { // Simulated OTP check
            setError('Invalid OTP.');
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

        setIsLoading(true);
        const success = await onResetPassword(companyName, employeeId, newPassword);
        setIsLoading(false);

        if (success) {
            setStep('success');
        } else {
            setError('Failed to reset password. Please try again.');
        }
    };

    const handleClose = () => {
        // Reset state on close
        setStep('enter_id');
        setCompanyCode('');
        setCompanyName('');
        setEmployeeId('');
        setEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setIsLoading(false);
        onClose();
    };
    
    useEffect(() => {
        if (!isOpen) {
            // Allow animations to finish before resetting state
            setTimeout(handleClose, 300);
        }
    }, [isOpen]);

    const renderStepContent = () => {
        switch (step) {
            case 'enter_id':
                return (
                    <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                           Please enter your Company Code and Username to receive a one-time password (OTP).
                        </p>
                        <div className="relative">
                            <Input
                                id="company-code"
                                label="Company Code"
                                value={companyCode}
                                onChange={e => setCompanyCode(e.target.value)}
                                placeholder="e.g., FIN01"
                            />
                            {companyName && (
                                <span className={`absolute right-2 top-9 text-xs font-semibold ${companyName === 'Invalid Code' ? 'text-red-500' : 'text-green-600'}`}>
                                    {companyName}
                                </span>
                            )}
                        </div>
                        <Input
                            label="Username / Employee ID"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            placeholder="e.g., admin or 1002"
                        />
                        <div className="relative mt-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Connected Email ID</label>
                            <AtSign className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                readOnly
                                disabled
                                placeholder="Email will appear here"
                                className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                        <Button onClick={handleSendOtp} variant="primary" className="w-full mt-4" disabled={!email}>
                            <Mail size={16} /> Send OTP
                        </Button>
                    </>
                );
            case 'enter_otp_password':
                return (
                    <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            An OTP has been sent to your email. Please enter it below along with your new password. (Hint: use 123456)
                        </p>
                         <Input
                            label="One-Time Password (OTP)"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button onClick={handleReset} variant="primary" className="w-full mt-4" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <KeyRound size={16} />}
                            Reset Password
                        </Button>
                    </>
                );
            case 'success':
                return (
                    <div className="text-center py-8">
                        <CheckCircle size={48} className="mx-auto text-green-500" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">Password Reset Successfully!</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">You can now log in with your new password.</p>
                        <Button onClick={handleClose} variant="primary" className="mt-6">
                            Back to Login
                        </Button>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
                        <KeyRound />
                        Forgot Password
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
                {renderStepContent()}
            </div>
        </Modal>
    );
};