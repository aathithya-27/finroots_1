import React from 'react';
import { TrendingUp } from 'lucide-react';

const MutualFunds: React.FC = () => {
    return (
        <div className="text-center py-20 px-4 text-gray-500 dark:text-gray-400">
            <TrendingUp size={48} className="mx-auto text-gray-300 dark:text-gray-600"/>
            <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">Mutual Funds</h1>
            <p className="mt-2 text-md">This module is currently under construction.</p>
            <p className="mt-1 text-sm">The functionality to manage mutual fund schemes and holdings will be available here soon.</p>
        </div>
    );
};

export default MutualFunds;
