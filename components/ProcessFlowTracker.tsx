import React from 'react';
import { ProcessStage } from '../types.ts';
import { Check, Circle, GanttChartSquare } from 'lucide-react';


interface ProcessFlowTrackerProps {
    currentStage: ProcessStage;
    processSteps: ProcessStage[];
    onStageClick: (newStage: ProcessStage) => void;
}


const ProcessFlowTracker: React.FC<ProcessFlowTrackerProps> = ({ currentStage, processSteps, onStageClick }) => {
    const currentStageIndex = processSteps.indexOf(currentStage);

    const getStepStatus = (index: number) => {
        if (index < currentStageIndex) return 'completed';
        if (index === currentStageIndex) return 'current';
        return 'upcoming';
    };

    const StatusIcon = ({ status }: { status: 'completed' | 'current' | 'upcoming' }) => {
        switch (status) {
            case 'completed':
                return <Check className="w-5 h-5 text-white" />;
            case 'current':
                return <GanttChartSquare className="w-5 h-5 text-white" />;
            default:
                return <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
        }
    };

    const statusStyles = {
        completed: {
            iconBg: 'bg-green-500',
            textColor: 'text-gray-900 dark:text-white',
            lineColor: 'border-green-500',
        },
        current: {
            iconBg: 'bg-brand-primary',
            textColor: 'text-brand-primary font-bold dark:text-blue-300',
            lineColor: 'border-gray-300 dark:border-gray-600',
        },
        upcoming: {
            iconBg: 'bg-gray-300 dark:bg-gray-600',
            textColor: 'text-gray-500 dark:text-gray-400',
            lineColor: 'border-gray-300 dark:border-gray-600',
        },
    };

    return (
        <div className="flow-root">
             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Customer Journey Tracker</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4 mb-6">Click on a stage to mark it as the current one. Completed stages cannot be changed.</p>
            <ul className="-mb-8">
                {processSteps.map((step, index) => {
                    const status = getStepStatus(index);
                    const styles = statusStyles[status];
                    const isLastStep = index === processSteps.length - 1;
                    const isCompleted = status === 'completed';

                    return (
                        <li key={step}>
                            <div className="relative pb-8">
                                {!isLastStep && (
                                    <span className={`absolute top-4 left-4 -ml-px h-full w-0.5 border-l-2 ${styles.lineColor}`} aria-hidden="true" />
                                )}
                                 <button 
                                    onClick={() => onStageClick(step)}
                                    disabled={isCompleted}
                                    className="relative flex items-center space-x-3 w-full text-left p-1 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed group"
                                    aria-label={isCompleted ? `${step} (Completed)` : `Set stage to ${step}`}
                                >
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-800 ${styles.iconBg} transition-colors group-hover:ring-gray-100 dark:group-hover:ring-gray-700`}>
                                        <StatusIcon status={status} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm ${styles.textColor} transition-colors ${!isCompleted ? 'group-hover:text-brand-primary dark:group-hover:text-blue-300' : ''}`}>{index + 1}. {step}</p>
                                    </div>
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
};

export default ProcessFlowTracker;