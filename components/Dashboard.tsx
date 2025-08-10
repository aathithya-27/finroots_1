

import React, { useMemo, useState } from 'react';
import { Member, UpsellOpportunity, Lead, ModalTab, Tab, User, TodaysFocusItem, Task, DashboardTaskTypeFilter } from '../types.ts';
import TodaysFocus from './TodaysFocus.tsx';
import { Users, Bell, Shield, TrendingUp, Gem, Award, Star, ShieldCheck, CheckCircle, ListTodo, ArrowRight } from 'lucide-react';
import Button from './ui/Button.tsx';


interface DashboardProps {
    members: Member[];
    leads: Lead[];
    notifications: any[];
    upsellOpportunities: UpsellOpportunity[];
    setActiveTab: (tab: Tab) => void;
    onOpenModal: (member: Member | null, initialTab?: ModalTab | null) => void;
    onOpenLeadModal: (lead: Lead | null) => void;
    currentUser: User | null;
    users: User[];
    dismissedFocusItems: string[];
    onDismissFocusItem: (itemId: string) => void;
    allTasks: Task[];
    onToggleTask: (taskId: string) => void;
}

const TaskOverview: React.FC<{
  tasks: Task[];
  users: User[];
  currentUser: User;
  onToggleTask: (taskId: string) => void;
  onViewAllTasks: () => void;
}> = ({ tasks, users, currentUser, onToggleTask, onViewAllTasks }) => {
  const [typeFilter, setTypeFilter] = useState<DashboardTaskTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed'>('pending');

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  const tasksForUser = useMemo(() => {
    if (currentUser.role === 'Admin') {
      return tasks;
    }
    return tasks.filter(t => t.primaryContactPerson === currentUser.id || t.alternateContactPersons?.includes(currentUser.id));
  }, [tasks, currentUser]);
  
  const filteredTasks = useMemo(() => {
    return tasksForUser.filter(task => {
      let typeMatch = false;
      switch (typeFilter) {
          case 'all':
              typeMatch = true;
              break;
          case 'personal':
              typeMatch = !task.memberId && !task.leadId;
              break;
          case 'customer':
              typeMatch = !!task.memberId || !!task.leadId;
              break;
          case 'shared':
              typeMatch = !!task.isShared;
              break;
          default:
              typeMatch = true;
      }
      const statusMatch = (statusFilter === 'pending' && !task.isCompleted) || (statusFilter === 'completed' && task.isCompleted);
      return typeMatch && statusMatch;
    }).sort((a, b) => new Date(a.expectedCompletionDateTime).getTime() - new Date(b.expectedCompletionDateTime).getTime());
  }, [tasksForUser, typeFilter, statusFilter]);

  const isOverdue = (task: Task) => !task.isCompleted && new Date(task.expectedCompletionDateTime) < new Date();

  const FilterButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
        isActive
          ? 'bg-brand-primary text-white shadow-sm'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <ListTodo size={20} className="text-brand-primary" />
          Task Overview
        </h3>
        <Button onClick={onViewAllTasks} variant="light" size="small">
          View All Tasks <ArrowRight size={14} />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <FilterButton label="Pending" isActive={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
            <FilterButton label="Completed" isActive={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
          </div>
          {currentUser.role === 'Admin' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
              <FilterButton label="All" isActive={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
              <FilterButton label="Personal" isActive={typeFilter === 'personal'} onClick={() => setTypeFilter('personal')} />
              <FilterButton label="Customer" isActive={typeFilter === 'customer'} onClick={() => setTypeFilter('customer')} />
              <FilterButton label="Shared" isActive={typeFilter === 'shared'} onClick={() => setTypeFilter('shared')} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400" title="Color Legend">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"></span> Personal</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700"></span> Shared</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"></span> Completed</div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 -mr-2">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div
              key={task.id}
              onClick={onViewAllTasks}
              className={`p-3 rounded-md border cursor-pointer flex items-center gap-3 transition-colors ${
                task.isCompleted
                  ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  : task.isShared
                  ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40'
                  : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
              title={
                  task.isCompleted ? 'Completed Task' : (task.isShared ? 'Shared Task' : 'Personal Task')
              }
            >
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleTask(task.id);
                }}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary flex-shrink-0"
                aria-label={`Mark task "${task.taskDescription}" as ${task.isCompleted ? 'incomplete' : 'complete'}`}
              />
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  task.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {task.taskDescription}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className={isOverdue(task) ? 'font-bold text-red-500' : ''}>
                    Due: {new Date(task.expectedCompletionDateTime).toLocaleDateString('en-GB')}
                  </span>
                  <span>To: {userMap.get(task.primaryContactPerson || '') || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <CheckCircle size={32} className="mx-auto text-gray-300 dark:text-gray-500" />
            <p className="mt-2 font-medium">No tasks found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ members, leads, notifications, upsellOpportunities, setActiveTab, onOpenModal, onOpenLeadModal, currentUser, users, dismissedFocusItems, onDismissFocusItem, allTasks, onToggleTask }) => {
    
    const totalActivePolicies = members.reduce((sum, member) => sum + member.policies.length, 0);
    const opportunitiesValue = upsellOpportunities.length; // Placeholder for value calculation

    const customerDistribution = members.reduce((acc, member) => {
        acc[member.memberType] = (acc[member.memberType] || 0) + 1;
        return acc;
    }, {} as Record<Member['memberType'], number>);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    const pendingMembers = useMemo(() => {
        const basePending = members
            .filter(m => m.active && (!m.policies || m.policies.length === 0))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        if (currentUser?.role === 'Admin') {
            return basePending;
        }
        
        if (currentUser?.role === 'Advisor') {
            return basePending.filter(member => member.assignedTo?.includes(currentUser.id));
        }

        return [];
    }, [members, currentUser]);

    const StatCard = ({ icon, title, value, subtext, color }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex items-center gap-5">
            <div className={`p-3 rounded-full ${color.bg} dark:${color.darkBg}`}>
                {React.cloneElement(icon, { size: 24, className: color.text })}
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );
    
    const TierCard = ({ icon, title, count, color }) => (
        <div className={`p-4 rounded-lg flex items-center gap-4 ${color.bg} border ${color.border} dark:${color.darkBg} dark:${color.darkBorder}`}>
            <div className={`p-2 rounded-full ${color.iconBg} dark:${color.darkIconBg}`}>
                {React.cloneElement(icon, { size: 20, className: `${color.iconText} dark:${color.darkIconText}` })}
            </div>
            <div>
                <p className={`font-bold text-lg ${color.text} dark:${color.darkText}`}>{count}</p>
                <p className={`text-sm font-medium ${color.text} dark:${color.darkText}`}>{title}</p>
            </div>
        </div>
    );

    const membershipTiers = {
        'Silver': { icon: <Shield />, color: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', iconBg: 'bg-white', iconText: 'text-gray-500', darkBg: 'bg-gray-800', darkBorder: 'border-gray-700', darkIconBg: 'bg-gray-700', darkIconText: 'text-gray-300', darkText: 'text-gray-200'}},
        'Gold': { icon: <Award />, color: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', iconBg: 'bg-white', iconText: 'text-yellow-500', darkBg: 'bg-yellow-900/20', darkBorder: 'border-yellow-800/30', darkIconBg: 'bg-yellow-900/30', darkIconText: 'text-yellow-300', darkText: 'text-yellow-200'}},
        'Diamond': { icon: <Gem />, color: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', iconBg: 'bg-white', iconText: 'text-blue-500', darkBg: 'bg-blue-900/20', darkBorder: 'border-blue-800/30', darkIconBg: 'bg-blue-900/30', darkIconText: 'text-blue-300', darkText: 'text-blue-200'}},
        'Platinum': { icon: <Star />, color: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', iconBg: 'bg-white', iconText: 'text-purple-500', darkBg: 'bg-purple-900/20', darkBorder: 'border-purple-800/30', darkIconBg: 'bg-purple-900/30', darkIconText: 'text-purple-300', darkText: 'text-purple-200'}},
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's your business overview.</p>
            </div>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users />} title="Customers" value={members.length} subtext={`${members.filter(m=>m.active).length} active`} color={{ bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'bg-blue-900/30' }} />
                <StatCard icon={<Bell />} title="Pending Notifications" value={notifications.length} subtext="Birthdays, anniversaries & renewals" color={{ bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'bg-orange-900/30' }} />
                <StatCard icon={<Shield />} title="Active Policies" value={totalActivePolicies} subtext="Across all customers" color={{ bg: 'bg-green-100', text: 'text-green-600', darkBg: 'bg-green-900/30' }} />
                <StatCard icon={<TrendingUp />} title="Opportunities" value={opportunitiesValue} subtext={`${opportunitiesValue} active opportunities`} color={{ bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'bg-purple-900/30' }} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <TodaysFocus 
                        members={members} 
                        leads={leads} 
                        notifications={notifications} 
                        upsellOpportunities={upsellOpportunities}
                        setActiveTab={setActiveTab}
                        onOpenModal={onOpenModal}
                        onOpenLeadModal={onOpenLeadModal}
                        dismissedFocusItems={dismissedFocusItems}
                        onDismissFocusItem={onDismissFocusItem}
                    />
                </div>
                <div className="xl:col-span-1 flex flex-col">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                <ShieldCheck size={20} className="text-orange-500" />
                                Completions
                            </h3>
                            {pendingMembers.length > 0 && (
                                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-orange-900/50 dark:text-orange-200">
                                    {pendingMembers.length}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1 pr-2 -mr-2 max-h-80">
                            {pendingMembers.length > 0 ? (
                                pendingMembers.map(member => (
                                    <div key={member.id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{member.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Created on {new Date(member.createdAt || 0).toLocaleDateString('en-GB')}
                                                {currentUser?.role === 'Admin' && member.createdBy && (
                                                    <span className="text-gray-400 dark:text-gray-500"> by {userMap.get(member.createdBy) || 'Unknown'}</span>
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            size="small"
                                            variant="secondary"
                                            onClick={() => onOpenModal(member, ModalTab.Policies)}
                                        >
                                            Add Policy
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-8 h-full">
                                    <CheckCircle size={32} className="text-green-500" />
                                    <p className="mt-2 font-semibold">All Clear!</p>
                                    <p className="text-sm">No new customers are waiting for policies.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

             {/* New Task Overview Section */}
            <TaskOverview
                tasks={allTasks}
                users={users}
                currentUser={currentUser!}
                onToggleTask={onToggleTask}
                onViewAllTasks={() => setActiveTab('taskManagement')}
            />

             {/* Customer Distribution */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Customer Distribution by Membership</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(membershipTiers).map(([tier, details]) => (
                        <TierCard 
                            key={tier}
                            icon={details.icon}
                            title={tier}
                            count={customerDistribution[tier as keyof typeof customerDistribution] || 0}
                            color={details.color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
