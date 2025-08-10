import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Lock, Sun, Moon, Building, User as UserIcon, GitBranch } from 'lucide-react';
import Button from './ui/Button.tsx';
import { User as UserType, FinRootsBranch } from '../types.ts';
import Input from './ui/Input.tsx';
import { login } from '../services/apiService.ts';

interface LoginProps {
    onLogin: (user: UserType) => void;
    onForgotPassword: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    allBranches: FinRootsBranch[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword, theme, toggleTheme, allBranches }) => {
    const [company, setCompany] = useState('Finroots');
    const [role, setRole] = useState('Admin');
    const [branchId, setBranchId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    
    const companyIdMap: Record<string, string> = {
        'Finroots': 'FIN01',
        'Autonova Solutions': 'AUTO01'
    };

    const companyBranches = useMemo(() => {
        const selectedCompanyId = companyIdMap[company];
        return allBranches.filter(b => b.companyId === selectedCompanyId);
    }, [company, allBranches]);
    
    useEffect(() => {
        // Reset branch when company changes
        setBranchId('');
    }, [company]);

    useEffect(() => {
        const savedData = localStorage.getItem('rememberedUser');
        if (savedData) {
            const { company, employeeId, role } = JSON.parse(savedData);
            setCompany(company);
            setEmployeeId(employeeId);
            setRole(role);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!company || !role || !employeeId || !password) {
            setError('Please fill in all fields.');
            return;
        }

        if (role !== 'Admin' && companyBranches.length > 0 && !branchId) {
            setError('Please select a branch to continue.');
            return;
        }

        try {
            const user = await login(company, employeeId, password, role, branchId);

            if (user) {
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', JSON.stringify({ company, employeeId, role }));
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                onLogin(user);
            } else {
                setError('Invalid credentials, or role/branch mismatch for the selected company.');
            }
        } catch (err) {
            setError('An error occurred during login. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center w-full min-h-screen bg-gray-100 dark:bg-gray-900 relative p-4">
            <div className="absolute top-5 right-5">
                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
            <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        MACS-CRM
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome! Please sign in.</p>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <label htmlFor="company" className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                        <Building className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                        <select
                            id="company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option>Finroots</option>
                            <option>Autonova Solutions</option>
                        </select>
                    </div>

                    {companyBranches.length > 0 && (
                        <div className="relative animate-fade-in">
                            <label htmlFor="branch" className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
                            <GitBranch className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                            <select
                                id="branch"
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required={role !== 'Admin'}
                            >
                                <option value="">Select Branch...</option>
                                {companyBranches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.branchName}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="relative">
                        <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <UserIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option>Admin</option>
                            <option>Advisor</option>
                            <option>Support</option>
                        </select>
                    </div>

                    <Input
                        id="employeeId"
                        label="User ID"
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="Enter your User ID"
                        required
                    />

                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Remember me
                            </label>
                        </div>
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full justify-center !text-base !py-3"
                    >
                        <Lock className="mr-2" /> Sign In
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Login;
