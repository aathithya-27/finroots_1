
import React from 'react';

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    srLabel?: string;
    disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, srLabel = 'Toggle', disabled = false }) => {
    return (
        <button
            type="button"
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800 ${
                enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={enabled}
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
        >
            <span className="sr-only">{srLabel}</span>
            <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
};

export default ToggleSwitch;
