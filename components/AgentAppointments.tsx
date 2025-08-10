import React from 'react';
import { CalendarClock } from 'lucide-react';

const AgentAppointments: React.FC = () => {
    return (
        <div className="text-center py-20 px-4 text-gray-500 dark:text-gray-400">
            <CalendarClock size={48} className="mx-auto text-gray-300 dark:text-gray-600"/>
            <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">Agent Appointments (SA)</h1>
            <p className="mt-2 text-md">This module is currently under construction.</p>
            <p className="mt-1 text-sm">The functionality for managing agent appointments will be implemented here in a future update.</p>
        </div>
    );
};

export default AgentAppointments;
