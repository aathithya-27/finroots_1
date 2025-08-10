

import React, { useState, useMemo } from 'react';
import { Member, ModalTab, Policy } from '../types.ts';
import Button from './ui/Button.tsx';
import { IndianRupee, Percent, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { ViewIcon } from './ui/Icons.tsx';

interface CommissionDashboardProps {
  members: Member[];
  onViewMember: (member: Member, initialTab?: ModalTab) => void;
  onUpdateCommissionStatus: (memberId: string, policyId: string, status: Policy['commission']['status']) => void;
}

const CommissionDashboard: React.FC<CommissionDashboardProps> = ({ members, onViewMember, onUpdateCommissionStatus }) => {
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const allCommissions = useMemo(() => {
    return members.flatMap(member =>
      member.policies
        .filter(policy => policy.commission && policy.commission.amount > 0)
        .map(policy => ({
          id: `${member.id}-${policy.id}`,
          policyId: policy.id,
          memberId: member.id,
          memberName: member.name,
          policyType: policy.policyType,
          policyPremium: policy.premium,
          commissionAmount: policy.commission.amount,
          status: policy.commission.status,
          renewalDate: policy.renewalDate,
          fullMember: member,
        }))
    ).sort((a, b) => new Date(b.renewalDate).getTime() - new Date(a.renewalDate).getTime());
  }, [members]);

  const filteredCommissions = useMemo(() => {
    if (statusFilter === 'All Statuses') return allCommissions;
    return allCommissions.filter(c => c.status === statusFilter);
  }, [allCommissions, statusFilter]);

  const summary = useMemo(() => {
    return allCommissions.reduce(
      (acc, comm) => {
        if (comm.status === 'Paid') {
          acc.paid += comm.commissionAmount;
        } else if (comm.status === 'Pending') {
          acc.pending += comm.commissionAmount;
        }
        acc.totalTracked += 1;
        return acc;
      },
      { paid: 0, pending: 0, totalTracked: 0 }
    );
  }, [allCommissions]);

  const formattedPaid = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(summary.paid);
  const formattedPending = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(summary.pending);


  const StatCard = ({ title, value, icon, colorClass }: { title: string; value: string | number; icon: React.ReactNode; colorClass: string }) => (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border flex items-start justify-between dark:border-gray-700 ${colorClass}`}>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {value}
            </p>
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {icon}
        </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600"/>
        <p className="mt-2 text-sm font-semibold">No Commissions Found</p>
        <p className="mt-1 text-xs">No commissions match the current filter.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Commission Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage all your policy commissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Paid" value={formattedPaid} icon={<CheckCircle size={24} className="text-green-500"/>} colorClass="dark:border-green-800/50" />
        <StatCard title="Total Pending" value={formattedPending} icon={<Clock size={24} className="text-yellow-500"/>} colorClass="dark:border-yellow-800/50" />
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border flex items-start justify-between dark:border-gray-700 dark:border-blue-800/50">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Policies Tracked</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{summary.totalTracked}</p>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"><Percent size={24} className="text-blue-500"/></div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="flex justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Paid</option>
            <option>Cancelled</option>
          </select>
        </div>
        
        <div className="mt-6 overflow-x-auto">
          {filteredCommissions.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Policy Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Premium</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCommissions.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{c.memberName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{c.policyType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(c.policyPremium)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(c.commissionAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <select
                            value={c.status}
                            onChange={(e) => onUpdateCommissionStatus(c.memberId, c.policyId, e.target.value as Policy['commission']['status'])}
                            className={`text-xs font-medium rounded-md border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary dark:border-gray-600 py-1 pl-2 pr-7 appearance-none ${
                                c.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                                c.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                            }`}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button size="small" variant="light" onClick={() => onViewMember(c.fullMember, ModalTab.Policies)}>
                        <ViewIcon className="w-4 h-4" /> View Customer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="border-t border-gray-200 dark:border-gray-700"><EmptyState /></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommissionDashboard;
