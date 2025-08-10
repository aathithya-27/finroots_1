import React, { useState, useCallback } from 'react';
import { Member } from '../../types.ts';
import { generateFinancialHealthReport } from '../../services/geminiService.ts';
import Input from '../ui/Input.tsx';
import Button from '../ui/Button.tsx';
import { BrainCircuit, Loader2, Clipboard, ClipboardCheck, BarChart, HeartPulse, Home, PiggyBank } from 'lucide-react';

interface NeedsAnalysisTabProps {
  data: Partial<Member>;
  onChange: (field: keyof Member, value: any) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

export const NeedsAnalysisTab: React.FC<NeedsAnalysisTabProps> = ({ data, onChange, addToast }) => {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const financialProfile = data.financialProfile || {};

  const handleProfileChange = (field: keyof typeof financialProfile, value: any) => {
    const updatedProfile = { ...financialProfile, [field]: value };
    onChange('financialProfile', updatedProfile);
  };
  
  const handleGenerateReport = useCallback(async () => {
    setIsLoading(true);
    setReport('');
    try {
        const result = await generateFinancialHealthReport(data as Member);
        setReport(result);
    } catch (e) {
        addToast("Failed to generate financial report.", 'error');
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, [data, addToast]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(report).then(() => {
      setIsCopied(true);
      addToast('Report copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }, (err) => {
      addToast('Failed to copy report.', 'error');
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column: Data Input */}
      <div className="lg:w-1/3 flex-shrink-0">
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Financial Profile</h3>
            
            <Input 
                label="Annual Income (₹)"
                type="number"
                value={financialProfile.annualIncome || ''}
                onChange={(e) => handleProfileChange('annualIncome', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 1200000"
            />
            
            <Input 
                label="Average Monthly Expenses (₹)"
                type="number"
                value={financialProfile.monthlyExpenses || ''}
                onChange={(e) => handleProfileChange('monthlyExpenses', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 60000"
            />
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Tolerance</label>
                <select
                    value={financialProfile.riskTolerance || ''}
                    onChange={(e) => handleProfileChange('riskTolerance', e.target.value as any)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="" disabled>Select...</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Financial Goals</label>
                <textarea
                    value={financialProfile.financialGoals || ''}
                    onChange={(e) => handleProfileChange('financialGoals', e.target.value)}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="e.g., Child's education in 10 years, buying a house, retirement planning..."
                />
            </div>

            <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={16} />}
                {isLoading ? 'Analyzing...' : 'Generate Financial Health Report'}
            </Button>
        </div>
      </div>

      {/* Right Column: Report Output */}
      <div className="lg:w-2/3 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">AI Generated Report</h3>
        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-600/50 flex flex-col min-h-0">
            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-brand-primary animate-spin" />
                        <BarChart className="w-8 h-8 text-brand-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-4 font-semibold text-gray-600 dark:text-gray-300">Gemini is analyzing the financial profile...</p>
                </div>
            ) : report ? (
                <>
                    <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                            {report}
                        </div>
                    </div>
                    <div className="flex-shrink-0 p-3 border-t dark:border-gray-700 text-right">
                        <Button onClick={handleCopy} variant="light">
                            {isCopied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                            {isCopied ? 'Copied!' : 'Copy Report'}
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-500 dark:text-gray-400">
                    <div className="grid grid-cols-2 gap-4 text-brand-primary dark:text-blue-400">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"><HeartPulse size={24}/></div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"><Home size={24}/></div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"><PiggyBank size={24}/></div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"><BarChart size={24}/></div>
                    </div>
                    <p className="mt-4 font-semibold">Report will be displayed here.</p>
                    <p className="text-xs">Fill in the financial profile and click "Generate" to get started.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
