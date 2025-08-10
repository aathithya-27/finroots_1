
import React from 'react';
import { Shield, UserCog, Briefcase, Sun, Moon } from 'lucide-react';

interface LandingPageProps {
    onSelectRole: (role: 'Admin' | 'Advisor') => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const RoleButton: React.FC<{ icon: React.ReactNode; title: string; onClick: () => void; }> = ({ icon, title, onClick }) => (
    <button
        onClick={onClick}
        className="group w-full p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-transparent hover:border-brand-primary dark:hover:border-brand-primary hover:bg-white dark:hover:bg-gray-800/80 backdrop-blur-sm transform hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary"
    >
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="bg-brand-primary/10 dark:bg-brand-primary/20 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
    </button>
);

const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole, theme, toggleTheme }) => {
    return (
        <div className="flex items-center justify-center w-full min-h-screen bg-brand-light dark:bg-gray-900 relative p-4">
             <div className="absolute top-5 right-5">
                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
            <div className="w-full max-w-lg p-8 space-y-8 text-center animate-fade-in">
                <div className="flex flex-col items-center">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-md mb-4">
                        <Shield className="w-16 h-16 text-brand-primary" />
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white">FinRoots</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Select your role to continue.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                    <RoleButton
                        icon={<UserCog size={28} className="text-brand-primary" />}
                        title="Admin Login"
                        onClick={() => onSelectRole('Admin')}
                    />
                    <RoleButton
                        icon={<Briefcase size={28} className="text-brand-primary" />}
                        title="Advisor Login"
                        onClick={() => onSelectRole('Advisor')}
                    />
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
