import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import MemberDashboard from './components/MemberDashboard.tsx';
import { MemberModal } from './components/MemberModal.tsx';
import AnnualReviewModal from './components/AnnualReviewModal.tsx';
import ConversationalCreatorModal from './components/ConversationalCreatorModal.tsx';
import LocationServices from './components/LocationServices.tsx';
import WhatsAppBot from './components/WhatsAppBot.tsx';
import Dashboard from './components/Dashboard.tsx';
import PolicyManager from './components/PolicyManager.tsx';
import ProfilePage from './components/ProfilePage.tsx';
import AdminProfile from './components/AdminProfile.tsx';
import Sidebar from './components/Sidebar.tsx';
import CommissionDashboard from './components/CommissionDashboard.tsx';
import SalesPipeline from './components/SalesPipeline.tsx';
import LeadModal from './components/LeadModal.tsx';
import { ActionAutomationHub } from './components/ActionAutomationHub.tsx';
import { ProposalGeneratorModal } from './components/ProposalGeneratorModal.tsx';
import NotesPage from './components/NotesPage.tsx';
import AdvisorManagement from './components/AdvisorManagement.tsx';
import { AdvisorModal } from './components/AdvisorModal.tsx';
import LandingPage from './components/LandingPage.tsx';
import Login from './components/Login.tsx';
import MutualFunds from './components/MutualFunds.tsx';
import AgentAppointments from './components/AgentAppointments.tsx';
import { MasterData } from './components/MasterData.tsx';
import { TaskManagement } from './components/TaskManagement.tsx';
import Button from './components/ui/Button.tsx';
import { 
    Member, ToastData, ActivityLog, Appointment, Task, UpsellOpportunity, AutomationRule, CustomScheduledMessage, ModalTab, 
    Lead, User, Policy, Route, ProcessStage, DocTemplate, AdvisorProfile, Tab, GiftMapping, BusinessVertical, 
    SchemeMaster, Company, FinRootsBranch, Geography, RelationshipType, DocumentMaster, SchemeDocumentMapping, GiftMaster, TaskStatusMaster, CustomerCategory,
    Notification, BankMaster, FinRootsCompanyInfo, CustomerSubCategory, CustomerGroup, SubTaskMaster, TaskMaster, TodaysFocusItem, PolicyChecklistMaster,
    InsuranceTypeMaster, InsuranceFieldMaster, LeadActivityLog, VoiceNote, TaskActivityLog,
    LeadSource, LeadSourceMaster, CoveredMember, RolePermissions
} from './types.ts';
import { getMembers, createMember, updateMember, deleteMember, renewPolicy, getLeads, createLead, updateLead, deleteLead, getUsers, getRoutes, updateRoute, createAdvisor, updateAdvisor, getOperatingCompanies, updateOperatingCompany, getFinrootsBranches, getRolePermissions, updateRolePermissions } from './services/apiService.ts';
import { getPolicySuggestions, generateAnnualReview, generateUpsellOpportunityForMember } from './services/geminiService.ts';
import { indianStates } from './constants.tsx';
import ToastContainer from './components/ui/Toast.tsx';
import { Shield, Bell, Loader2, Menu, Sun, Moon, ArrowUp, Gift as GiftIcon, Calendar, Star, BarChart2, TrendingUp, Users as UsersIcon, CheckCircle, Clock, Percent, Workflow, X, Plus, Save, Edit2, Trash2, Building, MapPin, Briefcase, FileText as FileTextIcon, ListTodo, CheckSquare, BarChart3, TrendingDown, Map as MapIcon, Donut, IndianRupee, Zap, GripVertical, ArrowDown } from 'lucide-react';
import NotificationDropdown from './components/NotificationDropdown.tsx';
import DuplicateMemberModal from './components/DuplicateMemberModal.tsx';
import { ForgotPasswordModal } from './components/ForgotPasswordModal.tsx';
import { ViewByBranchModal } from './components/ViewByBranchModal.tsx';
import { AttendanceModal } from './components/AttendanceModal.tsx';


type Theme = 'light' | 'dark';
type AttendanceRecord = { status: 'Present' | 'Absent'; reason?: string; timestamp: string };
type AttendanceState = Record<string, AttendanceRecord>;

// --- Helper function for Lead Activity Logging ---
const generateLeadActivityLog = (oldLead: Partial<Lead>, newLead: Partial<Lead>, userId: string): LeadActivityLog[] => {
    const logs: LeadActivityLog[] = [];
    const timestamp = new Date().toISOString();

    if (oldLead.status !== newLead.status) {
        logs.push({
            timestamp,
            action: 'Status Change',
            details: `Status changed from '${oldLead.status || 'None'}' to '${newLead.status}'.`,
            by: userId,
        });
    }
    
     if (oldLead.notes !== newLead.notes && newLead.notes) {
        logs.push({
            timestamp,
            action: 'Note Added',
            details: `A new note was added.`,
            by: userId,
        });
    }

    const detailsChanged = (
        oldLead.name !== newLead.name ||
        oldLead.phone !== newLead.phone ||
        oldLead.email !== newLead.email ||
        oldLead.estimatedValue !== newLead.estimatedValue ||
        oldLead.assignedTo !== newLead.assignedTo
    );
    
    // Avoid creating a generic 'Details Updated' log if a more specific one (like status change) already exists for this update.
    if (detailsChanged && !logs.some(log => log.action === 'Status Change')) {
         logs.push({
            timestamp,
            action: 'Details Updated',
            details: `Lead details were updated.`,
            by: userId,
        });
    }

    return logs;
};


// --- Reusable Chart Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700/50">
                <p className="font-bold text-gray-800 dark:text-white mb-1">{label}</p>
                {payload.map((p: any, i: number) => {
                    const value = typeof p.value === 'number' 
                        ? p.name.toLowerCase().includes('premium') || p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('profit') 
                            ? `₹${p.value.toLocaleString('en-IN')}` 
                            : p.value.toLocaleString()
                        : p.value;
                    return (
                        <p key={i} style={{ color: p.color || p.fill }} className="text-sm font-medium">{`${p.name}: ${value}`}</p>
                    )
                })}
            </div>
        );
    }
    return null;
};


// --- REFACTORED: ServicesHub Component ---
// Gift Management has been moved to Master Data for better workflow consolidation.
const ServicesHub: React.FC<{
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    onViewMember: (member: Member, initialTab?: ModalTab) => void;
    onUpdateCommissionStatus: (memberId: string, policyId: string, status: 'Pending' | 'Paid' | 'Cancelled') => void;
    currentUser: User | null;
}> = (props) => {
    type Service = 'commissions' | 'mutualFunds' | 'agentAppointments';
    const [activeService, setActiveService] = useState<Service>(props.currentUser?.role === 'Admin' ? 'commissions' : 'mutualFunds');
    
    const serviceComponents: Record<Service, React.ReactNode> = {
        commissions: <CommissionDashboard members={props.allMembers} onViewMember={props.onViewMember} onUpdateCommissionStatus={props.onUpdateCommissionStatus} />,
        mutualFunds: <MutualFunds />,
        agentAppointments: <AgentAppointments />,
    };

    const navItems = [
        ...(props.currentUser?.role === 'Admin' ? [{ id: 'commissions', label: 'Commissions', icon: <Percent size={20} /> }] : []),
        { id: 'mutualFunds', label: 'Mutual Funds', icon: <TrendingUp size={20} /> },
        { id: 'agentAppointments', label: 'Agent Appointments', icon: <Calendar size={20} /> },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Services Hub</h2>
                <nav className="space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveService(item.id as Service)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${
                                activeService === item.id
                                    ? 'bg-brand-primary text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1">
                {serviceComponents[activeService]}
            </div>
        </div>
    );
};


// --- NEW COMPONENT: SchemeConversionReports ---
const SchemeConversionReports: React.FC<{ members: Member[]; leads: Lead[] }> = ({ members, leads }) => {
    const schemeAnalysis = useMemo(() => {
        const schemeMap = new Map<string, { count: number; premium: number; type: Policy['policyType'] }>();
        const typeCounts: Record<Policy['policyType'], number> = { 'Health Insurance': 0, 'Life Insurance': 0, 'General Insurance': 0, '': 0 };

        members.forEach(member => member.policies.forEach(policy => {
            if (!policy.policyType) return;
            const schemeName = policy.schemeName || 'Unspecified';
            const current = schemeMap.get(schemeName) || { count: 0, premium: 0, type: policy.policyType };
            current.count += 1;
            current.premium += policy.premium;
            schemeMap.set(schemeName, current);
            typeCounts[policy.policyType]++;
        }));
        
        const allSchemes = Array.from(schemeMap.entries()).map(([name, data]) => ({ name, ...data }));
        const totalPremium = allSchemes.reduce((sum, s) => sum + s.premium, 0);

        return {
            allSchemes: allSchemes.sort((a, b) => b.premium - a.premium),
            topByPremium: [...allSchemes].sort((a,b) => b.premium - a.premium).slice(0, 5),
            topByCount: [...allSchemes].sort((a,b) => b.count - a.count).slice(0, 5),
            typeDistribution: Object.entries(typeCounts).filter(([name]) => name).map(([name, value]) => ({ name, value })),
            totalPolicies: members.reduce((sum, m) => sum + m.policies.length, 0),
            totalPremium,
            mostPopular: allSchemes.length > 0 ? allSchemes.sort((a,b) => b.premium - a.premium)[0].name : 'N/A',
        };
    }, [members]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    
    const StatCard = ({ title, value, icon, subtext = '' }: { title: string, value: string | number, icon: React.ReactNode, subtext?: string }) => (<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300">{icon}</div><div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p><p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p></div></div>{subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}</div>);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Premium" value={`₹${schemeAnalysis.totalPremium.toLocaleString('en-IN')}`} icon={<IndianRupee size={20} />} />
                <StatCard title="Total Policies Sold" value={schemeAnalysis.totalPolicies} icon={<FileTextIcon size={20} />} />
                <StatCard title="Most Popular Scheme" value={schemeAnalysis.mostPopular} subtext="(by premium)" icon={<Star size={20} />} />
                <StatCard title="Policy Types" value={schemeAnalysis.typeDistribution.length} icon={<Donut size={20} />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold text-center mb-4 text-gray-800 dark:text-white">Policy Type Distribution</h4><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={schemeAnalysis.typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label>{schemeAnalysis.typeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer></div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold mb-4 text-gray-800 dark:text-white">Top 5 Schemes by Premium</h4><ResponsiveContainer width="100%" height={250}><BarChart data={schemeAnalysis.topByPremium} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fill: tickColor, fontSize: 12 }} /><YAxis dataKey="name" type="category" tick={{ fill: tickColor, fontSize: 12 }} width={100} /><Tooltip content={<CustomTooltip />} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}/><Bar dataKey="premium" name="Total Premium" fill="#3B82F6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold mb-4 text-gray-800 dark:text-white">All Schemes Data</h4><div className="overflow-x-auto max-h-80"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm"><thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr><th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Scheme Name</th><th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Policy Type</th><th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Policies Sold</th><th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Premium</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{schemeAnalysis.allSchemes.map(s=>(<tr key={s.name}><td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td><td className="px-4 py-2 text-gray-600 dark:text-gray-300">{s.type}</td><td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{s.count}</td><td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td></tr>))}</tbody></table></div></div>
        </div>
    );
};


// --- NEW COMPONENT: BusinessTrendsReports ---
const BusinessTrendsReports: React.FC<{ members: Member[] }> = ({ members }) => {
    const abcData = useMemo(() => { const schemePremiums = new Map<string, number>(); members.forEach(m => m.policies.forEach(p => { const name = p.schemeName || 'Unspecified'; schemePremiums.set(name, (schemePremiums.get(name) || 0) + p.premium); })); const totalPremium = Array.from(schemePremiums.values()).reduce((sum, p) => sum + p, 0); const sortedSchemes = Array.from(schemePremiums.entries()).map(([name, premium]) => ({ name, premium, percentage: totalPremium > 0 ? (premium / totalPremium) * 100 : 0 })).sort((a, b) => b.premium - a.premium); const categories: {A: any[], B: any[], C: any[]} = { A: [], B: [], C: [] }; let cumulativePercentage = 0; sortedSchemes.forEach(scheme => { cumulativePercentage += scheme.percentage; if (cumulativePercentage <= 80) categories.A.push(scheme); else if (cumulativePercentage <= 95) categories.B.push(scheme); else categories.C.push(scheme); }); return categories; }, [members]);
    
    const pnlData = useMemo(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const data = Array(6).fill(0).map((_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return { name: `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}'`, revenue: 0, profit: 0 } });
        members.forEach(m => m.policies.forEach(p => {
            data[5].revenue += p.premium;
            if (p.commission && p.commission.status === 'Paid') {
                data[5].profit += p.commission.amount;
            }
        }));
        // Simulate past months for trend visualization
        for (let i = 4; i >= 0; i--) { data[i].revenue = Math.round(data[i+1].revenue * (0.8 + Math.random() * 0.2)); data[i].profit = Math.round(data[i].revenue * (0.1 + Math.random() * 0.05)); }
        return data;
    }, [members]);

    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'; const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';

    return (
        <div className="space-y-8 animate-fade-in">
             <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Business Trend Analysis</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold mb-4 text-gray-800 dark:text-white">Profit & Loss Trend</h4><ResponsiveContainer width="100%" height={300}><AreaChart data={pnlData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} /><YAxis tick={{ fill: tickColor, fontSize: 12 }} /><Tooltip content={<CustomTooltip />} /><Legend /><Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" name="Revenue"/><Area type="monotone" dataKey="profit" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Profit"/></AreaChart></ResponsiveContainer></div>
            <div><h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">ABC Analysis (by Premium)</h3><div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Scheme Name</th><th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase">Total Premium</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{abcData.A.map(s => <tr key={s.name}><td className="px-4 py-2 font-bold text-green-600">A</td><td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td><td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td></tr>)}{abcData.B.map(s => <tr key={s.name}><td className="px-4 py-2 font-bold text-yellow-600">B</td><td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td><td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td></tr>)}{abcData.C.map(s => <tr key={s.name}><td className="px-4 py-2 font-bold text-red-600">C</td><td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td><td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td></tr>)}</tbody></table></div></div>
        </div>
    );
};


// --- REFACTORED COMPONENT: LeadAnalyticsReports ---
const LeadAnalyticsReports: React.FC<{ members: Member[]; leadSources: LeadSourceMaster[] }> = ({ members, leadSources }) => {
    const leadSourceAnalysis = useMemo(() => {
        const sourceMap = new Map<string, { count: number; members: { name: string; memberType: Member['memberType']; totalPremium: number, fullSource: string }[] }>();
        const leadSourceMap = new Map(leadSources.map(ls => [ls.id, ls]));
        const memberMap = new Map(members.map(m => [m.id, m.name]));

        const getRootSource = (sourceId: string): LeadSourceMaster | null => {
            let current = leadSourceMap.get(sourceId);
            if (!current) return null;
            while (current.parentId && leadSourceMap.has(current.parentId)) {
                current = leadSourceMap.get(current.parentId)!;
            }
            return current;
        };
        
        const getFullSourcePath = (sourceId: string): string => {
            const path: string[] = [];
            let current = leadSourceMap.get(sourceId);
            while (current) {
                path.unshift(current.name);
                current = current.parentId ? leadSourceMap.get(current.parentId) : undefined;
            }
            return path.join(' > ');
        };

        members.forEach(member => {
            if (!member.leadSource?.sourceId) {
                 const current = sourceMap.get('Unknown') || { count: 0, members: [] };
                 current.count++;
                 current.members.push({ name: member.name, memberType: member.memberType, totalPremium: member.policies.reduce((sum, p) => sum + p.premium, 0), fullSource: 'Unknown' });
                 sourceMap.set('Unknown', current);
                 return;
            }
            
            const rootSource = getRootSource(member.leadSource.sourceId);
            const sourceName = rootSource ? rootSource.name : 'Unknown';
            
            let fullSource = getFullSourcePath(member.leadSource.sourceId);
            let detailText = member.leadSource?.detail;
            
            // --- FIX: Prioritize referrerId for specific referrer name ---
            if (member.referrerId) {
                const referrerName = memberMap.get(member.referrerId);
                if (referrerName) {
                    detailText = referrerName;
                }
            }
            
            if(detailText) fullSource += ` - ${detailText}`;
            
            const current = sourceMap.get(sourceName) || { count: 0, members: [] };
            current.count++;
            current.members.push({
                name: member.name,
                memberType: member.memberType,
                totalPremium: member.policies.reduce((sum, p) => sum + p.premium, 0),
                fullSource: fullSource
            });
            sourceMap.set(sourceName, current);
        });

        const distribution = Array.from(sourceMap.entries())
            .map(([name, data]) => ({ name, value: data.count, members: data.members }))
            .sort((a, b) => b.value - a.value);

        const allMembersBySource = Array.from(sourceMap.entries()).flatMap(([source, data]) => data.members.map(m => ({ ...m, source })));

        return { distribution, allMembersBySource };
    }, [members, leadSources]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F43F5E', '#14B8A6'];
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <h4 className="font-semibold text-center mb-4 text-gray-800 dark:text-white">Lead Source Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={leadSourceAnalysis.distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return ( <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold"> {`${(percent * 100).toFixed(0)}%`} </text> );
                            }}>
                                {leadSourceAnalysis.distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <h4 className="font-semibold mb-4 text-gray-800 dark:text-white">Customer Details by Lead Source</h4>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Customer Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Lead Source</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Premium</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {leadSourceAnalysis.allMembersBySource.map((m, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{m.name}</td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{m.fullSource}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-white">₹{m.totalPremium.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- NEW COMPONENT: ReportsAndInsights ---
const ReportsAndInsights: React.FC<{
    members: Member[];
    users: User[];
    tasks: Task[];
    attendance: AttendanceState;
    onUpdateAttendance: (userId: string, status: 'Present' | 'Absent', reason?: string) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allLeads: Lead[];
    currentUser: User | null;
    leadSources: LeadSourceMaster[];
}> = ({ members, users, tasks, attendance, onUpdateAttendance, addToast, allLeads, currentUser, leadSources }) => {
    type ReportTab = 'staff' | 'schemes' | 'trends' | 'leadAnalytics';
    const [activeReportTab, setActiveReportTab] = useState<ReportTab>('staff');

    const StaffPerformance: React.FC = () => {
        const advisors = users.filter(u => u.role === 'Advisor');
        const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
        
        const advisorStats = useMemo(() => {
            const advisorData = advisors.map(adv => {
                const assignedCustomers = members.filter(m => m.assignedTo.includes(adv.id));
                const assignedLeads = allLeads.filter(l => l.assignedTo === adv.id);
                const convertedLeads = assignedCustomers.filter(m => m.leadSource).length;

                return {
                    ...adv,
                    createdCustomers: members.filter(m => m.createdBy === adv.id).length,
                    pendingTasks: tasks.filter(t => t.primaryContactPerson === adv.id && !t.isCompleted).length,
                    totalPremium: assignedCustomers.reduce((sum, m) => sum + m.policies.reduce((pSum, p) => pSum + p.premium, 0), 0),
                    conversionRate: assignedLeads.length > 0 ? ((convertedLeads / assignedLeads.length) * 100).toFixed(1) : '0.0',
                    activityTrend: Array(7).fill(0).map((_, i) => Math.floor(Math.random() * (i + 1) * 2)), // Simulated data
                }
            });

            if (currentUser?.role === 'Advisor') {
                return advisorData.filter(adv => adv.id === currentUser.id);
            }
            return advisorData;
        }, [advisors, members, tasks, allLeads, currentUser]);
        
        return (
             <div className="space-y-6 animate-fade-in">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Staff Performance & Attendance</h3>
                  <div className="overflow-x-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50"><tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Advisor</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Attendance</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Premium (Ann.)</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Conversion</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Pending Tasks</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Activity (7d)</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {advisorStats.map(adv => (
                                <tr key={adv.id}>
                                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{adv.name}</td>
                                    <td className="px-4 py-2">
                                        {editingAttendanceId === adv.id ? (
                                             <div className="flex gap-2">
                                                 <Button size="small" variant="success" onClick={() => { onUpdateAttendance(adv.id, 'Present'); setEditingAttendanceId(null); }}>P</Button>
                                                 <Button size="small" variant="danger" onClick={() => { onUpdateAttendance(adv.id, 'Absent', 'Admin Override'); setEditingAttendanceId(null); }}>A</Button>
                                                 <Button size="small" variant="light" onClick={() => setEditingAttendanceId(null)}><X size={12} /></Button>
                                             </div>
                                        ) : attendance[adv.id] ? (
                                            <div className="flex items-center gap-2">
                                                {attendance[adv.id].status === 'Present' ? <span className="text-green-600 font-semibold">Present</span> : <span className="text-red-600 font-semibold" title={attendance[adv.id].reason}>Absent</span>}
                                                {currentUser?.role === 'Admin' && <Button size="small" variant="light" className="!p-1" onClick={() => setEditingAttendanceId(adv.id)}><Edit2 size={12}/></Button>}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 italic">Not Marked</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">₹{adv.totalPremium.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{adv.conversionRate}%</td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{adv.pendingTasks}</td>
                                    <td className="px-4 py-2 text-center h-12"><ResponsiveContainer width="100%" height="100%"><LineChart data={adv.activityTrend.map(v => ({value:v}))}><Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
            </div>
        );
    };

    const ReportTabButton = ({ label, isActive, onClick }: {label: string, isActive: boolean, onClick: () => void}) => (
        <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>{label}</button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <ReportTabButton label="Staff Performance" isActive={activeReportTab === 'staff'} onClick={() => setActiveReportTab('staff')} />
                    <ReportTabButton label="Scheme Conversion" isActive={activeReportTab === 'schemes'} onClick={() => setActiveReportTab('schemes')} />
                    <ReportTabButton label="Lead Analytics" isActive={activeReportTab === 'leadAnalytics'} onClick={() => setActiveReportTab('leadAnalytics')} />
                    {currentUser?.role === 'Admin' && <ReportTabButton label="Business Trends" isActive={activeReportTab === 'trends'} onClick={() => setActiveReportTab('trends')} />}
                </div>
            </div>
            {activeReportTab === 'staff' && <StaffPerformance />}
            {activeReportTab === 'schemes' && <SchemeConversionReports members={members} leads={allLeads} />}
            {activeReportTab === 'leadAnalytics' && <LeadAnalyticsReports members={members} leadSources={leadSources} />}
            {activeReportTab === 'trends' && currentUser?.role === 'Admin' && <BusinessTrendsReports members={members} />}
        </div>
    );
};


const initialAutomationRules: AutomationRule[] = [
    { 
        id: 1, 
        type: 'Birthday Messages', 
        timing: { value: 0, unit: 'days', relation: 'before' }, // Represents "On the day"
        enabled: true, 
        template: 'Happy Birthday {name}! Wishing you a wonderful year ahead. Thank you for being our valued customer.', 
        channels: ['whatsapp', 'sms'],
        icon: <GiftIcon className="text-pink-500" />
    },
    { 
        id: 2, 
        type: 'Anniversary Messages', 
        timing: { value: 0, unit: 'days', relation: 'before' }, // Represents "On the day"
        enabled: true, 
        template: 'Happy Anniversary {name}! May this special day bring you joy and happiness.',
        channels: ['whatsapp'],
        icon: <Calendar className="text-purple-500" />
    },
    { 
        id: 3, 
        type: 'Policy Renewal Messages', 
        timing: { value: 30, unit: 'days', relation: 'before' },
        enabled: true, 
        template: 'Dear {name}, your {policyType} policy is due for renewal in {days} days. Premium: {premium}. Renew now to continue your coverage.', 
        channels: ['whatsapp', 'sms', 'email'],
        icon: <Bell className="text-blue-500" />
    },
    { 
        id: 4, 
        type: 'Policy Renewal Messages', 
        timing: { value: 7, unit: 'days', relation: 'before' },
        enabled: true, 
        template: 'Urgent: {name}, your policy expires in {days} days! Click here to renew: {renewalLink}',
        channels: ['whatsapp', 'sms'],
        icon: <Bell className="text-orange-500" />
    },
    { 
        id: 5, 
        type: 'Policy Renewal Messages', 
        timing: { value: 1, unit: 'days', relation: 'before' },
        enabled: true, 
        template: 'FINAL REMINDER: {name}, your {policyType} policy expires tomorrow! Renew now to avoid a lapse in coverage. Click here to renew: {renewalLink}',
        channels: ['whatsapp', 'sms'],
        icon: <Bell className="text-red-500" />
    },
    { 
        id: 6, 
        type: 'Special Occasion Messages', 
        timing: { value: 0, unit: 'days', relation: 'before' },
        enabled: true, 
        template: 'Hi {name}, thinking of you on this special day: {occasionName}! Wishing you all the best.', 
        channels: ['whatsapp'],
        icon: <Star className="text-yellow-500" />
    },
];

const initialProcessFlow: ProcessStage[] = [
    'Initial Contact', 'Coverage Schemes', 'Customer Meeting', 'Decision Point', 'Policy Entry', 'Policy Documents', 'Premium Collection',
    'Premium Reminder Setup', 'Policy Document Received', 'Policy Handed Over', 'Premium Reminders', 'Receipt Sent'
];

const initialDocTemplates: DocTemplate[] = [
    { id: 'tpl-1', name: 'Life Insurance Proposal', content: `Dear {clientName},\n\nThank you for your interest...` },
    { id: 'tpl-2', name: 'Health Plan Comparison', content: `Hi {clientName},\n\nAs requested, here is a summary...` }
];


// --- MASTER DATA INITIAL STATE ---
const generateInitialGeographies = (): Geography[] => {
    const geographies: Geography[] = [];
    let idCounter = 1;
    const countryId = `geo-${idCounter++}`;
    geographies.push({ id: countryId, name: 'India', type: 'Country', parentId: null, active: true });
    for (const stateName in indianStates) {
        const stateId = `geo-${idCounter++}`;
        geographies.push({ id: stateId, name: stateName, type: 'State', parentId: countryId, active: true });
        const districts = indianStates[stateName];
        for (const districtName of districts) {
            const districtId = `geo-${idCounter++}`;
            geographies.push({ id: districtId, name: districtName, type: 'District', parentId: stateId, active: true });
        }
    }
    return geographies;
};

const initialFinrootsCompanyInfo: FinRootsCompanyInfo = {
    name: 'FinRoots Marketing LLP',
    hq: 'Erode, Tamil Nadu',
    cin: 'U74999TZ2023LLP012345',
    incorporationDate: '2023-04-01',
};
const initialBankMasters: BankMaster[] = [
    {
        id: 'bank-1',
        bankCode: 'SBI001',
        bankName: 'State Bank of India',
        branchName: 'Erode Main Branch',
        dateOfCreation: '2023-05-10',
        active: true,
        line1: '123, Fort Road',
        city: 'Erode',
        state: 'Tamil Nadu',
        pinCode: '638001',
        phone1: '0424-2255888',
        contactPerson: 'Mr. Kumar',
        accountType: 'Current Account',
        accountNumber: '30012345678',
        ifscCode: 'SBIN0000837',
        creditLimit: 500000,
        authSign1: 'Director A',
        order: 0,
    },
    {
        id: 'bank-2',
        bankCode: 'HDFC001',
        bankName: 'HDFC Bank',
        branchName: 'Perundurai Road Branch',
        dateOfCreation: '2023-06-15',
        active: true,
        line1: '456, Perundurai Road',
        city: 'Erode',
        state: 'Tamil Nadu',
        pinCode: '638011',
        phone1: '0424-2277444',
        contactPerson: 'Ms. Priya',
        accountType: 'Overdraft Account',
        accountNumber: '50098765432',
        ifscCode: 'HDFC0000201',
        creditLimit: 1000000,
        authSign1: 'Director A',
        authSign2: 'Director B',
        order: 1,
    },
];

const initialBusinessVerticals: BusinessVertical[] = [ { id: 'bv-1', name: 'Insurance', active: true, order: 0 }, { id: 'bv-2', name: 'Mutual Funds', active: true, order: 1 }, { id: 'bv-3', name: 'Agent Appointments (SA)', active: true, order: 2 }, ];
const initialLeadSources: LeadSourceMaster[] = [
    { id: 'ls-adv', name: 'Advertisement', parentId: null, active: true, order: 0 },
    { id: 'ls-dm', name: 'Digital Media', parentId: 'ls-adv', active: true, order: 0 },
    { id: 'ls-fb', name: 'Facebook', parentId: 'ls-dm', active: true, order: 0 },
    { id: 'ls-ig', name: 'Instagram', parentId: 'ls-dm', active: true, order: 1 },
    { id: 'ls-pm', name: 'Print Media', parentId: 'ls-adv', active: true, order: 1 },
    { id: 'ls-cc', name: 'Cold Call', parentId: null, active: true, order: 1 },
    { id: 'ls-ec', name: 'Existing Client', parentId: null, active: true, order: 2 },
    { id: 'ls-inst', name: 'Institution', parentId: null, active: true, order: 3 },
    { id: 'ls-bni', name: 'BNI', parentId: 'ls-inst', active: true, order: 0 },
    { id: 'ls-lions', name: 'Lions', parentId: 'ls-inst', active: true, order: 1 },
    { id: 'ls-rotary', name: 'Rotary', parentId: 'ls-inst', active: true, order: 2 },
    { id: 'ls-of', name: 'Other Forum', parentId: null, active: true, order: 4 },
    { id: 'ls-ref', name: 'Referral', parentId: null, active: true, order: 5 },
    { id: 'ls-friend', name: 'Friend', parentId: 'ls-ref', active: true, order: 0 },
    { id: 'ls-other', name: 'Other', parentId: 'ls-ref', active: true, order: 1 },
    { id: 'ls-relative', name: 'Relative', parentId: 'ls-ref', active: true, order: 2 },
    { id: 'ls-staff', name: 'Staff', parentId: null, active: true, order: 6 },
    { id: 'ls-self', name: 'Self Generated', parentId: null, active: true, order: 7 },
    { id: 'ls-web', name: 'Website', parentId: null, active: true, order: 8 },
];
const initialInsuranceProviders: Company[] = [
    {id: 'comp-max-life', companyCode: 'MAXLIFE', name: 'Max Life Insurance', active: true},
    {id: 'comp-lic', companyCode: 'LIC', name: 'Life Insurance Corporation (LIC)', active: true},
    {id: 'comp-hdfc-life', companyCode: 'HDFCLIFE', name: 'HDFC Life', active: true},
    {id: 'comp-icici-pru', companyCode: 'ICICIPRU', name: 'ICICI Prudential Life Insurance', active: true},
    {id: 'comp-star', companyCode: 'STARHEALTH', name: 'Star Health & Allied Insurance', active: true},
    {id: 'comp-niva-bupa', companyCode: 'NIVABUPA', name: 'Niva Bupa', active: true},
    {id: 'comp-hdfc-ergo', companyCode: 'HDFCERGO', name: 'HDFC ERGO Health', active: true},
    {id: 'comp-care-health', companyCode: 'CAREHEALTH', name: 'Care Health Insurance', active: true},
    {id: 'comp-icici-lombard', companyCode: 'ICICILOMBARD', name: 'ICICI Lombard', active: true},
    {id: 'comp-bajaj', companyCode: 'BAJAJALLIANZ', name: 'Bajaj Allianz General Insurance', active: true},
    {id: 'comp-tata-aig', companyCode: 'TATAAIG', name: 'Tata AIG General Insurance', active: true},
    {id: 'comp-nia', companyCode: 'NIA', name: 'New India Assurance', active: true},
    {id: 'comp-oriental', companyCode: 'ORIENTAL', name: 'Oriental Insurance', active: true},
    {id: 'comp-united', companyCode: 'UNITEDINDIA', name: 'United India Insurance', active: true}
];
const initialSchemes: SchemeMaster[] = [
    // --- Life Insurance ---
    {id: 'sch-1', name: 'Smart Secure Plus Plan', type: 'Life Insurance', companyId: 'comp-max-life', active: true, order: 0},
    {id: 'sch-2', name: 'Jeevan Anand', type: 'Life Insurance', companyId: 'comp-lic', active: true, order: 1},
    {id: 'sch-3', name: 'Click 2 Protect Super', type: 'Life Insurance', companyId: 'comp-hdfc-life', active: true, order: 2},
    {id: 'sch-4', name: 'iProtect Smart', type: 'Life Insurance', companyId: 'comp-icici-pru', active: true, order: 3},
    {id: 'sch-lic-jeevan-lakshya', name: 'Jeevan Lakshya', type: 'Life Insurance', companyId: 'comp-lic', active: true, order: 4},
    {id: 'sch-lic-siip', name: 'SIIP', type: 'Life Insurance', companyId: 'comp-lic', active: true, order: 5},
    {id: 'sch-max-life-sspp', name: 'Smart Secure Plus Plan', type: 'Life Insurance', companyId: 'comp-max-life', active: true, order: 6},
    {id: 'sch-hdfc-sanchay', name: 'Sanchay Plus', type: 'Life Insurance', companyId: 'comp-hdfc-life', active: true, order: 7},
    
    // --- Health Insurance ---
    {id: 'sch-5', name: 'Comprehensive Health Plan', type: 'Health Insurance', companyId: 'comp-star', active: true, order: 0},
    {id: 'sch-6', name: 'ReAssure 2.0', type: 'Health Insurance', companyId: 'comp-niva-bupa', active: true, order: 1},
    {id: 'sch-7', name: 'Optima Secure', type: 'Health Insurance', companyId: 'comp-hdfc-ergo', active: true, order: 2},
    {id: 'sch-8', name: 'Care Supreme', type: 'Health Insurance', companyId: 'comp-care-health', active: true, order: 3},
    {id: 'sch-star-family-delite', name: 'Family Health Optima Insurance Plan', type: 'Health Insurance', companyId: 'comp-star', active: true, order: 4},
    {id: 'sch-star-women-care', name: 'Women Care Insurance Policy', type: 'Health Insurance', companyId: 'comp-star', active: true, order: 5},
    {id: 'sch-care-plus', name: 'Care Plus', type: 'Health Insurance', companyId: 'comp-care-health', active: true, order: 6},
    {id: 'sch-niva-bupa-aspire', name: 'Health Aspire', type: 'Health Insurance', companyId: 'comp-niva-bupa', active: true, order: 7},


    // --- General Insurance: Motor ---
    {id: 'sch-9', name: 'Drive Smart', type: 'General Insurance', generalInsuranceType: 'Motor', companyId: 'comp-bajaj', active: true, order: 0},
    {id: 'sch-10', name: 'AutoSecure', type: 'General Insurance', generalInsuranceType: 'Motor', companyId: 'comp-tata-aig', active: true, order: 1},
    {id: 'sch-lombard-car', name: 'Car Insurance', type: 'General Insurance', generalInsuranceType: 'Motor', companyId: 'comp-icici-lombard', active: true, order: 2},
    {id: 'sch-nia-motor', name: 'Private Car Package Policy', type: 'General Insurance', generalInsuranceType: 'Motor', companyId: 'comp-nia', active: true, order: 3},
    
    // --- General Insurance: Others ---
    {id: 'sch-united-home', name: 'Unihome Care Policy', type: 'General Insurance', generalInsuranceType: 'Home', companyId: 'comp-united', active: true, order: 0},
    {id: 'sch-oriental-travel', name: 'Overseas Mediclaim Policy', type: 'General Insurance', generalInsuranceType: 'Travel', companyId: 'comp-oriental', active: true, order: 0},
    {id: 'sch-tata-aig-pa', name: 'Accident Guard', type: 'General Insurance', generalInsuranceType: 'Personal Accident', companyId: 'comp-tata-aig', active: true, order: 0},
    {id: 'sch-icici-travel', name: 'Travel Insurance', type: 'General Insurance', generalInsuranceType: 'Travel', companyId: 'comp-icici-lombard', active: true, order: 1},
    {id: 'sch-bajaj-home', name: 'My Home Insurance', type: 'General Insurance', generalInsuranceType: 'Home', companyId: 'comp-bajaj', active: true, order: 1},
];
const initialRelationshipTypes: RelationshipType[] = [ {id:'rel-1', name: 'Self', active: true}, {id:'rel-2', name: 'Spouse', active: true}, {id:'rel-3', name: 'Son', active: true}, {id:'rel-4', name: 'Daughter', active: true}, {id:'rel-5', name: 'Father', active: true}, {id:'rel-6', name: 'Mother', active: true}, ];
const initialDocumentMasters: DocumentMaster[] = [ {id:'doc-1', name: 'PAN Card', active: true, order: 0}, {id:'doc-2', name: 'Aadhaar Card', active: true, order: 1}, {id:'doc-3', name: 'Passport', active: true, order: 2}, {id:'doc-4', name: 'Driving License', active: true, order: 3}, {id:'doc-5', name: 'Bank Statement', active: true, order: 4}, ];
const initialGiftMasters: GiftMaster[] = [ {id:'gift-1', name: 'Premium Pen Set', active: true, order: 0}, {id:'gift-2', name: 'Leather Wallet', active: true, order: 1}, {id:'gift-3', name: 'Amazon Gift Card ₹500', active: true, order: 2}, {id:'gift-4', name: 'Custom Diary 2024', active: true, order: 3}, ];
const initialTaskStatusMasters: TaskStatusMaster[] = [
    {id:'ts-6', name: 'Assigned', active: true, order: 0},
    {id:'ts-1', name: 'Pending', active: true, order: 1},
    {id:'ts-5', name: 'Viewed', active: true, order: 2},
    {id:'ts-2', name: 'In Progress', active: true, order: 3},
    {id:'ts-3', name: 'Completed', active: true, order: 4},
    {id:'ts-4', name: 'Cancelled', active: true, order: 5},
];
const initialCustomerCategories: CustomerCategory[] = [ {id:'cc-1', name: 'Salaried', active: true, order: 0}, {id:'cc-2', name: 'Business', active: true, order: 1}, {id:'cc-3', name: 'Professional', active: true, order: 2}, ];
const initialGiftMappings: GiftMapping[] = [
    { tier: 'Silver', giftId: 'gift-1' },
    { tier: 'Gold', giftId: 'gift-2' },
    { tier: 'Diamond', giftId: 'gift-3' },
    { tier: 'Platinum', giftId: 'gift-4' },
];
// NEW MASTER DATA
const initialCustomerSubCategories: CustomerSubCategory[] = [
    { id: 'csc-1', name: 'IT/Software', parentId: 'cc-1', active: true, order: 0 },
    { id: 'csc-2', name: 'Government', parentId: 'cc-1', active: true, order: 1 },
    { id: 'csc-3', name: 'Manufacturing', parentId: 'cc-2', active: true, order: 0 },
    { id: 'csc-4', name: 'Trading', parentId: 'cc-2', active: true, order: 1 },
    { id: 'csc-5', name: 'Doctor', parentId: 'cc-3', active: true, order: 0 },
    { id: 'csc-6', name: 'Lawyer', parentId: 'cc-3', active: true, order: 1 },
];
const initialCustomerGroups: CustomerGroup[] = [
    { id: 'cg-1', name: 'HNI', active: true, order: 0 },
    { id: 'cg-2', name: 'Mid-Income', active: true, order: 1 },
    { id: 'cg-3', name: 'Affluent', active: true, order: 2 },
];
const initialTaskMasters: TaskMaster[] = [
    { id: 'tm-1', name: 'Auto', active: true, order: 0 },
    { id: 'tm-2', name: 'Manual', active: true, order: 1 },
];
const initialSubTaskMasters: SubTaskMaster[] = [
    { id: 'stm-1', name: 'Life Insurance Proposal Follow-up', taskMasterId: 'tm-1', active: true, order: 0 },
    { id: 'stm-2', name: 'Mediclaim Renewal Reminder', taskMasterId: 'tm-1', active: true, order: 1 },
    { id: 'stm-3', name: 'Collect KYC Documents', taskMasterId: 'tm-2', active: true, order: 0 },
    { id: 'stm-4', name: 'Schedule Annual Review', taskMasterId: 'tm-2', active: true, order: 1 },
];

const initialPolicyChecklistMasters: PolicyChecklistMaster[] = [
    // --- ROOT NODES ---
    // BUG FIX: Changed policyType to full name to match other components and fix Master Data display bug.
    { id: 'pcl-life-root', name: 'Life Insurance', parentId: null, policyType: 'Life Insurance', active: true, order: 0 },
    { id: 'pcl-health-root', name: 'Health Insurance', parentId: null, policyType: 'Health Insurance', active: true, order: 1 },
    { id: 'pcl-general-root', name: 'General Insurance', parentId: null, policyType: 'General', active: true, order: 2 },

    // --- LIFE INSURANCE ---
    { id: 'pcl-life-1', name: 'ID Proof (Aadhaar, PAN, Passport, Voter ID, etc.)', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 0 },
    { id: 'pcl-life-2', name: 'Address Proof (Utility bill, Aadhaar, Rental Agreement)', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 1 },
    { id: 'pcl-life-3', name: 'Date of Birth Proof (Birth Certificate, PAN, Passport)', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 2 },
    { id: 'pcl-life-4', name: 'Passport-size Photograph', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 3 },
    { id: 'pcl-life-5', name: 'Income Proof (Salary slips, ITR, Form 16)', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 4 },
    { id: 'pcl-life-6', name: 'PAN Card', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 5 },
    { id: 'pcl-life-7', name: 'Medical Report (if required for high coverage or age)', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 6 },
    { id: 'pcl-life-8', name: 'Proposal/Insurance Application Form', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 7 },
    { id: 'pcl-life-9', name: 'Nominee Details with ID Proof', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 8 },
    { id: 'pcl-life-10', name: 'Cancelled Cheque / Bank Details', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 9 },
    { id: 'pcl-life-11', name: 'KYC Verification Form', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 10 },
    { id: 'pcl-life-12', name: 'Policy Illustration (for ULIP or endowment plans)', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 11 },
    { id: 'pcl-life-13', name: 'Employer Declaration (for group life insurance)', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 12 },
    { id: 'pcl-life-14', name: 'CIBIL Report (if applicable)', parentId: 'pcl-life-root', policyType: 'Life Insurance', active: true, order: 13 },


    // --- HEALTH INSURANCE ---
    { id: 'pcl-health-1', name: 'ID Proof (Aadhaar, PAN, Passport, etc.)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 0 },
    { id: 'pcl-health-2', name: 'Address Proof (Aadhaar, Utility Bill, Rent Agreement)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 1 },
    { id: 'pcl-health-3', name: 'Date of Birth Proof (PAN, Passport, Birth Certificate)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 2 },
    { id: 'pcl-health-4', name: 'Passport-size Photograph', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 3 },
    { id: 'pcl-health-5', name: 'Previous Insurance Details (Renewal/Expired Policy)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 4 },
    { id: 'pcl-health-6', name: 'Medical Reports/Health Checkup (based on age/sum insured)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 5 },
    { id: 'pcl-health-7', name: 'Proposal Form (filled and signed)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 6 },
    { id: 'pcl-health-8', name: 'Income Proof (for high sum insured)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 7 },
    { id: 'pcl-health-9', name: 'Nominee Details with ID Proof', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 8 },
    { id: 'pcl-health-10', name: 'Employer Certificate/Offer Letter (for group insurance)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 9 },
    { id: 'pcl-health-11', name: 'Employee ID Proof (for group plans)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 10 },
    { id: 'pcl-health-12', name: 'Pregnancy Report (for maternity plans)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 11 },
    { id: 'pcl-health-13', name: 'Hospital Registration Slip (if pre-registered)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 12 },
    { id: 'pcl-health-14', name: 'Claim Documents (Bills, Reports, Discharge Summary)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 13 },
    { id: 'pcl-health-15', name: 'Cancelled Cheque (for claims refund)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 14 },
    { id: 'pcl-health-16', name: 'Relationship Proof with Proposer (for family members)', parentId: 'pcl-health-root', policyType: 'Health Insurance', active: true, order: 15 },


    // --- GENERAL INSURANCE SUB-ROOTS ---
    { id: 'pcl-motor-root', name: 'Motor Insurance (Car/Bike)', parentId: 'pcl-general-root', policyType: 'Motor', active: true, order: 0 },
    { id: 'pcl-home-root', name: 'Home Insurance', parentId: 'pcl-general-root', policyType: 'Home', active: true, order: 1 },
    { id: 'pcl-travel-root', name: 'Travel Insurance', parentId: 'pcl-general-root', policyType: 'Travel', active: true, order: 2 },
    { id: 'pcl-commercial-root', name: 'Commercial/Business Insurance', parentId: 'pcl-general-root', policyType: 'Commercial', active: true, order: 3 },
    { id: 'pcl-fire-root', name: 'Fire Insurance', parentId: 'pcl-general-root', policyType: 'Fire', active: true, order: 4 },
    { id: 'pcl-marine-root', name: 'Marine Insurance', parentId: 'pcl-general-root', policyType: 'Marine', active: true, order: 5 },
    { id: 'pcl-pa-root', name: 'Personal Accident Insurance', parentId: 'pcl-general-root', policyType: 'Personal Accident', active: true, order: 6 },
    { id: 'pcl-crop-root', name: 'Crop Insurance', parentId: 'pcl-general-root', policyType: 'Crop', active: true, order: 7 },
    { id: 'pcl-liability-root', name: 'Liability Insurance', parentId: 'pcl-general-root', policyType: 'Liability', active: true, order: 8 },
    { id: 'pcl-shopkeeper-root', name: 'Shopkeeper\'s Insurance', parentId: 'pcl-general-root', policyType: 'Shopkeeper', active: true, order: 9 },
    { id: 'pcl-misc-root', name: 'Miscellaneous Insurance', parentId: 'pcl-general-root', policyType: 'Miscellaneous', active: true, order: 10 },

    // --- MOTOR INSURANCE ---
    { id: 'pcl-motor-1', name: 'Vehicle Registration Number', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 0 },
    { id: 'pcl-motor-2', name: 'Vehicle Make, Model, Variant', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 1 },
    { id: 'pcl-motor-3', name: 'Manufacturing Year', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 2 },
    { id: 'pcl-motor-4', name: 'Fuel Type', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 3 },
    { id: 'pcl-motor-5', name: 'Engine Number & Chassis Number', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 4 },
    { id: 'pcl-motor-6', name: 'Previous Policy Details (if any)', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 5 },
    { id: 'pcl-motor-7', name: 'Owner\'s Name & Contact Info', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 6 },
    { id: 'pcl-motor-8', name: 'Registration State/City', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 7 },
    { id: 'pcl-motor-9', name: 'Usage Type (Private/Commercial)', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 8 },
    { id: 'pcl-motor-10', name: 'Claim History / No Claim Bonus (NCB)', parentId: 'pcl-motor-root', policyType: 'Motor', active: true, order: 9 },
    
    // ... Add all other general insurance types from OCR similarly ...
    { id: 'pcl-home-1', name: 'Owner\'s Name', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 0 },
    { id: 'pcl-home-2', name: 'Property Address', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 1 },
    { id: 'pcl-home-3', name: 'Property Type (Apartment/Independent)', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 2 },
    { id: 'pcl-home-4', name: 'Year of Construction', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 3 },
    { id: 'pcl-home-5', name: 'Sum Insured for Structure', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 4 },
    { id: 'pcl-home-6', name: 'Sum Insured for Contents', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 5 },
    { id: 'pcl-home-7', name: 'Security Features (locks, CCTV, etc.)', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 6 },
    { id: 'pcl-home-8', name: 'Occupancy Type (Self/Let Out)', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 7 },
    { id: 'pcl-home-9', name: 'Policy Tenure', parentId: 'pcl-home-root', policyType: 'Home', active: true, order: 8 },

    { id: 'pcl-travel-1', name: 'Traveler\'s Full Name', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 0 },
    { id: 'pcl-travel-2', name: 'Date of Birth / Age', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 1 },
    { id: 'pcl-travel-3', name: 'Passport Number', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 2 },
    { id: 'pcl-travel-4', name: 'Trip Start & End Dates', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 3 },
    { id: 'pcl-travel-5', name: 'Destination Country/Countries', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 4 },
    { id: 'pcl-travel-6', name: 'Purpose of Travel (Leisure/Business)', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 5 },
    { id: 'pcl-travel-7', name: 'Sum Insured', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 6 },
    { id: 'pcl-travel-8', name: 'Pre-existing Medical Conditions', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 7 },
    { id: 'pcl-travel-9', name: 'Nominee Details', parentId: 'pcl-travel-root', policyType: 'Travel', active: true, order: 8 },
];

const initialInsuranceTypes: InsuranceTypeMaster[] = [
    // Standalone
    { id: 'it-life', name: 'Life Insurance', verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-health', name: 'Health Insurance', verticalId: 'bv-1', active: true, order: 1 },
    // General Insurance Sub-types
    { id: 'it-motor', name: 'Motor', verticalId: 'bv-1', active: true, order: 2 },
    { id: 'it-home', name: 'Home', verticalId: 'bv-1', active: true, order: 3 },
    { id: 'it-travel', name: 'Travel', verticalId: 'bv-1', active: true, order: 4 },
    { id: 'it-commercial', name: 'Commercial', verticalId: 'bv-1', active: true, order: 5 },
    { id: 'it-fire', name: 'Fire', verticalId: 'bv-1', active: true, order: 6 },
    { id: 'it-marine', name: 'Marine', verticalId: 'bv-1', active: true, order: 7 },
    { id: 'it-pa', name: 'Personal Accident', verticalId: 'bv-1', active: true, order: 8 },
    { id: 'it-crop', name: 'Crop', verticalId: 'bv-1', active: true, order: 9 },
    { id: 'it-liability', name: 'Liability', verticalId: 'bv-1', active: true, order: 10 },
    { id: 'it-shopkeeper', name: 'Shopkeeper', verticalId: 'bv-1', active: true, order: 11 },
    { id: 'it-misc', name: 'Miscellaneous', verticalId: 'bv-1', active: true, order: 12 },
];

const initialInsuranceFields: InsuranceFieldMaster[] = [
    // --- Life Insurance Fields ---
    { id: 'if-life-1', insuranceTypeId: 'it-life', fieldName: 'fatherName', label: "Father's Name", fieldType: 'text', order: 1, active: true },
    { id: 'if-life-2', insuranceTypeId: 'it-life', fieldName: 'motherName', label: "Mother's Name", fieldType: 'text', order: 2, active: true },
    { id: 'if-life-3', insuranceTypeId: 'it-life', fieldName: 'spouseName', label: "Spouse's Full Name", fieldType: 'text', order: 3, active: true },
    { id: 'if-life-4', insuranceTypeId: 'it-life', fieldName: 'placeOfBirth', label: 'Place of Birth', fieldType: 'text', order: 4, active: true },
    { id: 'if-life-5', insuranceTypeId: 'it-life', fieldName: 'educationalQualification', label: 'Educational Qualification', fieldType: 'text', order: 5, active: true },
    { id: 'if-life-6', insuranceTypeId: 'it-life', fieldName: 'occupation', label: 'Occupation', fieldType: 'text', order: 6, active: true },
    { id: 'if-life-7', insuranceTypeId: 'it-life', fieldName: 'annualIncome', label: 'Annual Income', fieldType: 'number', order: 7, active: true },
    { id: 'if-life-8', insuranceTypeId: 'it-life', fieldName: 'nomineeName', label: 'Nominee Name', fieldType: 'text', order: 8, active: true },
    { id: 'if-life-9', insuranceTypeId: 'it-life', fieldName: 'nomineeRelationship', label: 'Nominee Relationship', fieldType: 'text', order: 9, active: true },
    
    // --- Health Insurance Fields (NEW COMPREHENSIVE LIST) ---
    { id: 'if-health-1', insuranceTypeId: 'it-health', fieldName: 'preExistingConditions', label: 'Pre-existing Conditions', fieldType: 'text', order: 1, active: true },
    { id: 'if-health-2', insuranceTypeId: 'it-health', fieldName: 'currentMedications', label: 'Current Medications', fieldType: 'text', order: 2, active: true },
    { id: 'if-health-3', insuranceTypeId: 'it-health', fieldName: 'hospitalizationHistory', label: 'Hospitalization History (Last 5 Years)', fieldType: 'text', order: 3, active: true },
    { id: 'if-health-4', insuranceTypeId: 'it-health', fieldName: 'tobaccoAlcoholUsage', label: 'Tobacco/Alcohol Usage', fieldType: 'text', order: 4, active: true },
    { id: 'if-health-5', insuranceTypeId: 'it-health', fieldName: 'familyMedicalHistory', label: 'Family Medical History', fieldType: 'text', order: 5, active: true },
    { id: 'if-health-6', insuranceTypeId: 'it-health', fieldName: 'heightCm', label: 'Height (cm)', fieldType: 'number', order: 6, active: true },
    { id: 'if-health-7', insuranceTypeId: 'it-health', fieldName: 'weightKg', label: 'Weight (kg)', fieldType: 'number', order: 7, active: true },
    { id: 'if-health-8', insuranceTypeId: 'it-health', fieldName: 'nomineeName', label: 'Nominee Name', fieldType: 'text', order: 8, active: true },
    { id: 'if-health-9', insuranceTypeId: 'it-health', fieldName: 'nomineeRelationship', label: 'Nominee Relationship', fieldType: 'text', order: 9, active: true },

    // --- Motor Insurance Fields ---
    { id: 'if-motor-1', insuranceTypeId: 'it-motor', fieldName: 'vehicleRegNo', label: 'Vehicle Reg. No.', fieldType: 'text', order: 1, active: true },
    { id: 'if-motor-2', insuranceTypeId: 'it-motor', fieldName: 'makeModelVariant', label: 'Make, Model, Variant', fieldType: 'text', order: 2, active: true },
    { id: 'if-motor-3', insuranceTypeId: 'it-motor', fieldName: 'manufacturingYear', label: 'Manuf. Year', fieldType: 'number', order: 3, active: true },
    { id: 'if-motor-4', insuranceTypeId: 'it-motor', fieldName: 'engineNo', label: 'Engine No.', fieldType: 'text', order: 4, active: true },
    { id: 'if-motor-5', insuranceTypeId: 'it-motor', fieldName: 'chassisNo', label: 'Chassis No.', fieldType: 'text', order: 5, active: true },
    { id: 'if-motor-6', insuranceTypeId: 'it-motor', fieldName: 'fuelType', label: 'Fuel Type', fieldType: 'text', order: 6, active: true },
    { id: 'if-motor-7', insuranceTypeId: 'it-motor', fieldName: 'ncb', label: 'No Claim Bonus (NCB)', fieldType: 'text', order: 7, active: true },
    // --- Home Insurance Fields ---
    { id: 'if-home-1', insuranceTypeId: 'it-home', fieldName: 'propertyAddress', label: 'Property Address', fieldType: 'text', order: 1, active: true },
    { id: 'if-home-2', insuranceTypeId: 'it-home', fieldName: 'propertyType', label: 'Property Type', fieldType: 'text', order: 2, active: true },
    { id: 'if-home-3', insuranceTypeId: 'it-home', fieldName: 'yearOfConstruction', label: 'Year of Construction', fieldType: 'number', order: 3, active: true },
    { id: 'if-home-4', insuranceTypeId: 'it-home', fieldName: 'sumInsuredStructure', label: 'Sum Insured (Structure)', fieldType: 'number', order: 4, active: true },
    { id: 'if-home-5', insuranceTypeId: 'it-home', fieldName: 'sumInsuredContents', label: 'Sum Insured (Contents)', fieldType: 'number', order: 5, active: true },
    // --- Travel Insurance Fields ---
    { id: 'if-travel-1', insuranceTypeId: 'it-travel', fieldName: 'destination', label: 'Destination Country', fieldType: 'text', order: 1, active: true },
    { id: 'if-travel-2', insuranceTypeId: 'it-travel', fieldName: 'tripStartDate', label: 'Trip Start Date', fieldType: 'date', order: 2, active: true },
    { id: 'if-travel-3', insuranceTypeId: 'it-travel', fieldName: 'tripEndDate', label: 'Trip End Date', fieldType: 'date', order: 3, active: true },
    { id: 'if-travel-4', insuranceTypeId: 'it-travel', fieldName: 'passportNumber', label: 'Passport Number', fieldType: 'text', order: 4, active: true },
     // --- Commercial/Business Insurance Fields ---
    { id: 'if-comm-1', insuranceTypeId: 'it-commercial', fieldName: 'businessName', label: 'Business Name', fieldType: 'text', order: 1, active: true },
    { id: 'if-comm-2', insuranceTypeId: 'it-commercial', fieldName: 'businessType', label: 'Business Type', fieldType: 'text', order: 2, active: true },
    { id: 'if-comm-3', insuranceTypeId: 'it-commercial', fieldName: 'locationAddress', label: 'Location Address', fieldType: 'text', order: 3, active: true },
    { id: 'if-comm-4', insuranceTypeId: 'it-commercial', fieldName: 'propertyValue', label: 'Property Value', fieldType: 'number', order: 4, active: true },
    { id: 'if-comm-5', insuranceTypeId: 'it-commercial', fieldName: 'inventoryValue', label: 'Inventory/Stock Value', fieldType: 'number', order: 5, active: true },
    { id: 'if-comm-6', insuranceTypeId: 'it-commercial', fieldName: 'equipmentDetails', label: 'Equipment/Machinery Details', fieldType: 'text', order: 6, active: true },
    { id: 'if-comm-7', insuranceTypeId: 'it-commercial', fieldName: 'annualTurnover', label: 'Annual Turnover', fieldType: 'number', order: 7, active: true },
    { id: 'if-comm-8', insuranceTypeId: 'it-commercial', fieldName: 'numEmployees', label: 'Number of Employees', fieldType: 'number', order: 8, active: true },
    { id: 'if-comm-9', insuranceTypeId: 'it-commercial', fieldName: 'coverageType', label: 'Coverage Type (fire, burglary)', fieldType: 'text', order: 9, active: true },
    // --- Fire Insurance Fields ---
    { id: 'if-fire-1', insuranceTypeId: 'it-fire', fieldName: 'policyholderName', label: 'Policyholder Name', fieldType: 'text', order: 1, active: true },
    { id: 'if-fire-2', insuranceTypeId: 'it-fire', fieldName: 'propertyAddress', label: 'Property Address', fieldType: 'text', order: 2, active: true },
    { id: 'if-fire-3', insuranceTypeId: 'it-fire', fieldName: 'propertyType', label: 'Type of Building/Property', fieldType: 'text', order: 3, active: true },
    { id: 'if-fire-4', insuranceTypeId: 'it-fire', fieldName: 'occupancyNature', label: 'Nature of Occupancy', fieldType: 'text', order: 4, active: true },
    { id: 'if-fire-5', insuranceTypeId: 'it-fire', fieldName: 'sumInsured', label: 'Sum Insured (Structure & Contents)', fieldType: 'number', order: 5, active: true },
    { id: 'if-fire-6', insuranceTypeId: 'it-fire', fieldName: 'constructionMaterial', label: 'Construction Material Used', fieldType: 'text', order: 6, active: true },
    { id: 'if-fire-7', insuranceTypeId: 'it-fire', fieldName: 'fireProtectionMeasures', label: 'Fire Protection Measures', fieldType: 'text', order: 7, active: true },
    { id: 'if-fire-8', insuranceTypeId: 'it-fire', fieldName: 'policyDuration', label: 'Policy Duration', fieldType: 'text', order: 8, active: true },
    // --- Marine Insurance Fields ---
    { id: 'if-marine-1', insuranceTypeId: 'it-marine', fieldName: 'shipperName', label: 'Shipper/Insured Name', fieldType: 'text', order: 1, active: true },
    { id: 'if-marine-2', insuranceTypeId: 'it-marine', fieldName: 'cargoType', label: 'Type of Cargo', fieldType: 'text', order: 2, active: true },
    { id: 'if-marine-3', insuranceTypeId: 'it-marine', fieldName: 'transitMode', label: 'Mode of Transport', fieldType: 'text', order: 3, active: true },
    { id: 'if-marine-4', insuranceTypeId: 'it-marine', fieldName: 'ports', label: 'Port of Loading & Discharge', fieldType: 'text', order: 4, active: true },
    { id: 'if-marine-5', insuranceTypeId: 'it-marine', fieldName: 'invoiceValue', label: 'Invoice Value', fieldType: 'number', order: 5, active: true },
    { id: 'if-marine-6', insuranceTypeId: 'it-marine', fieldName: 'goodsDescription', label: 'Description of Goods', fieldType: 'text', order: 6, active: true },
    { id: 'if-marine-7', insuranceTypeId: 'it-marine', fieldName: 'transitPeriod', label: 'Transit Period', fieldType: 'text', order: 7, active: true },
    { id: 'if-marine-8', insuranceTypeId: 'it-marine', fieldName: 'packagingDetails', label: 'Packaging Details', fieldType: 'text', order: 8, active: true },
    // --- Personal Accident Insurance Fields ---
    { id: 'if-pa-1', insuranceTypeId: 'it-pa', fieldName: 'fullName', label: 'Full Name', fieldType: 'text', order: 1, active: true },
    { id: 'if-pa-2', insuranceTypeId: 'it-pa', fieldName: 'dobOrAge', label: 'Date of Birth / Age', fieldType: 'text', order: 2, active: true },
    { id: 'if-pa-3', insuranceTypeId: 'it-pa', fieldName: 'occupation', label: 'Occupation', fieldType: 'text', order: 3, active: true },
    { id: 'if-pa-4', insuranceTypeId: 'it-pa', fieldName: 'nomineeDetails', label: 'Nominee Details', fieldType: 'text', order: 4, active: true },
    { id: 'if-pa-5', insuranceTypeId: 'it-pa', fieldName: 'sumInsured', label: 'Sum Insured', fieldType: 'number', order: 5, active: true },
    { id: 'if-pa-6', insuranceTypeId: 'it-pa', fieldName: 'riskCategory', label: 'Risk Category', fieldType: 'text', order: 6, active: true },
    { id: 'if-pa-7', insuranceTypeId: 'it-pa', fieldName: 'medicalHistory', label: 'Medical History', fieldType: 'text', order: 7, active: true },
    // --- Crop Insurance Fields ---
    { id: 'if-crop-1', insuranceTypeId: 'it-crop', fieldName: 'farmerId', label: 'Farmer Name & ID', fieldType: 'text', order: 1, active: true },
    { id: 'if-crop-2', insuranceTypeId: 'it-crop', fieldName: 'landDetails', label: 'Land Details', fieldType: 'text', order: 2, active: true },
    { id: 'if-crop-3', insuranceTypeId: 'it-crop', fieldName: 'cropType', label: 'Crop Type', fieldType: 'text', order: 3, active: true },
    { id: 'if-crop-4', insuranceTypeId: 'it-crop', fieldName: 'sowingHarvestingDates', label: 'Sowing/Harvesting Dates', fieldType: 'text', order: 4, active: true },
    { id: 'if-crop-5', insuranceTypeId: 'it-crop', fieldName: 'location', label: 'Location', fieldType: 'text', order: 5, active: true },
    { id: 'if-crop-6', insuranceTypeId: 'it-crop', fieldName: 'loanDetails', label: 'Loan Details', fieldType: 'text', order: 6, active: true },
    { id: 'if-crop-7', insuranceTypeId: 'it-crop', fieldName: 'bankAccountDetails', label: 'Bank Account Details', fieldType: 'text', order: 7, active: true },
     // --- Liability Insurance Fields ---
    { id: 'if-liability-1', insuranceTypeId: 'it-liability', fieldName: 'insuredEntityName', label: 'Insured Entity Name', fieldType: 'text', order: 1, active: true },
    { id: 'if-liability-2', insuranceTypeId: 'it-liability', fieldName: 'businessType', label: 'Business Type', fieldType: 'text', order: 2, active: true },
    { id: 'if-liability-3', insuranceTypeId: 'it-liability', fieldName: 'annualRevenue', label: 'Annual Revenue', fieldType: 'number', order: 3, active: true },
    { id: 'if-liability-4', insuranceTypeId: 'it-liability', fieldName: 'riskNature', label: 'Nature of Risk', fieldType: 'text', order: 4, active: true },
    { id: 'if-liability-5', insuranceTypeId: 'it-liability', fieldName: 'coverageType', label: 'Coverage Type', fieldType: 'text', order: 5, active: true },
    { id: 'if-liability-6', insuranceTypeId: 'it-liability', fieldName: 'numEmployees', label: 'Number of Employees', fieldType: 'number', order: 6, active: true },
    { id: 'if-liability-7', insuranceTypeId: 'it-liability', fieldName: 'claimsHistory', label: 'Prior Claims History', fieldType: 'text', order: 7, active: true },
    { id: 'if-liability-8', insuranceTypeId: 'it-liability', fieldName: 'desiredSumInsured', label: 'Desired Sum Insured', fieldType: 'number', order: 8, active: true },
    // --- Shopkeeper Insurance Fields ---
    { id: 'if-shopkeeper-1', insuranceTypeId: 'it-shopkeeper', fieldName: 'shopOwnerName', label: 'Shop Name & Owner Name', fieldType: 'text', order: 1, active: true },
    { id: 'if-shopkeeper-2', insuranceTypeId: 'it-shopkeeper', fieldName: 'shopAddress', label: 'Shop Address', fieldType: 'text', order: 2, active: true },
    { id: 'if-shopkeeper-3', insuranceTypeId: 'it-shopkeeper', fieldName: 'goodsType', label: 'Type of Goods/Services Sold', fieldType: 'text', order: 3, active: true },
    { id: 'if-shopkeeper-4', insuranceTypeId: 'it-shopkeeper', fieldName: 'inventoryValue', label: 'Inventory Value', fieldType: 'number', order: 4, active: true },
    { id: 'if-shopkeeper-5', insuranceTypeId: 'it-shopkeeper', fieldName: 'buildingValue', label: 'Building Value', fieldType: 'number', order: 5, active: true },
    { id: 'if-shopkeeper-6', insuranceTypeId: 'it-shopkeeper', fieldName: 'numEmployees', label: 'Number of Employees', fieldType: 'number', order: 6, active: true },
    { id: 'if-shopkeeper-7', insuranceTypeId: 'it-shopkeeper', fieldName: 'policyTerm', label: 'Policy Term', fieldType: 'text', order: 7, active: true },
    { id: 'if-shopkeeper-8', insuranceTypeId: 'it-shopkeeper', fieldName: 'safetyFeatures', label: 'Safety Features', fieldType: 'text', order: 8, active: true },
    // --- Miscellaneous Insurance Fields ---
    { id: 'if-misc-1', insuranceTypeId: 'it-misc', fieldName: 'gadgetDetails', label: 'Gadget: IMEI, Model, Purchase Date', fieldType: 'text', order: 1, active: true },
    { id: 'if-misc-2', insuranceTypeId: 'it-misc', fieldName: 'petDetails', label: 'Pet: Name, Breed, Medical History', fieldType: 'text', order: 2, active: true },
    { id: 'if-misc-3', insuranceTypeId: 'it-misc', fieldName: 'cyberDetails', label: 'Cyber: Use Case, System Details', fieldType: 'text', order: 3, active: true },
    { id: 'if-misc-4', insuranceTypeId: 'it-misc', fieldName: 'eventDetails', label: 'Event: Name, Venue, Dates, Cost', fieldType: 'text', order: 4, active: true },
];


const initialTasks: Task[] = [
    { id: 'task-1', triggeringPoint: 'New Policy', taskDescription: 'Follow up for LIC documents', expectedCompletionDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, isShared: true, memberId: '1', primaryContactPerson: 'user-2', statusId: 'ts-1', taskType: 'Auto', active: true },
    { id: 'task-2', triggeringPoint: 'Manual', taskDescription: 'Schedule meeting with Kavya Reddy', expectedCompletionDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, isShared: false, memberId: '3', primaryContactPerson: 'user-3', statusId: 'ts-2', taskType: 'Manual', active: true },
    { id: 'task-3', triggeringPoint: 'Manual', taskDescription: 'Prepare weekly report for management', expectedCompletionDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, isShared: false, primaryContactPerson: 'user-2', statusId: 'ts-1', taskType: 'Manual', active: true },
];

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // --- Authentication and Page Routing State ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    
    // --- Data Loading and State Management ---
    const [isLoading, setIsLoading] = useState(true);
    const [toasts, setToasts] = useState<ToastData[]>([]);
    
    // --- Core Data State ---
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [allTasks, setAllTasks] = useState<Task[]>(initialTasks);
    const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);


    // --- Modal States ---
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [initialModalTab, setInitialModalTab] = useState<ModalTab | null>(ModalTab.BasicInfo);
    const [leadToConvertId, setLeadToConvertId] = useState<string | null>(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [isAnnualReviewModalOpen, setIsAnnualReviewModalOpen] = useState(false);
    const [reviewContent, setReviewContent] = useState('');
    const [isGeneratingReview, setIsGeneratingReview] = useState(false);
    const [isConversationalCreatorOpen, setIsConversationalCreatorOpen] = useState(false);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [proposalContext, setProposalContext] = useState<{ member: Member, policy: Policy } | null>(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [pendingDuplicateMember, setPendingDuplicateMember] = useState<Partial<Member> | null>(null);
    const [duplicateMatches, setDuplicateMatches] = useState<Member[]>([]);
    const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
    const [editingAdvisor, setEditingAdvisor] = useState<User | null>(null);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

    // --- Hubs Data ---
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [upsellOpportunities, setUpsellOpportunities] = useState<UpsellOpportunity[]>([]);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>(initialAutomationRules);
    const [customMessages, setCustomMessages] = useState<CustomScheduledMessage[]>([]);
    const [processFlow, setProcessFlow] = useState<ProcessStage[]>(initialProcessFlow);
    const [docTemplates, setDocTemplates] = useState<DocTemplate[]>(initialDocTemplates);
    const [giftMappings, setGiftMappings] = useState<GiftMapping[]>(initialGiftMappings);
    const [attendance, setAttendance] = useState<AttendanceState>({});
    
    // --- Notification Dropdown State ---
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [dropdownCleared, setDropdownCleared] = useState(false);
    const notificationDropdownRef = useRef<HTMLDivElement>(null);

    // --- Dashboard State ---
    const [dismissedFocusItems, setDismissedFocusItems] = useState<string[]>([]);

    // --- MASTER DATA STATE ---
    const [businessVerticals, setBusinessVerticals] = useState<BusinessVertical[]>(initialBusinessVerticals);
    const [leadSources, setLeadSources] = useState<LeadSourceMaster[]>(initialLeadSources);
    const [schemes, setSchemes] = useState<SchemeMaster[]>(initialSchemes);
    const [insuranceProviders, setInsuranceProviders] = useState<Company[]>(initialInsuranceProviders);
    const [operatingCompanies, setOperatingCompanies] = useState<Company[]>([]);
    const [geographies, setGeographies] = useState<Geography[]>(generateInitialGeographies());
    const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>(initialRelationshipTypes);
    const [documentMasters, setDocumentMasters] = useState<DocumentMaster[]>(initialDocumentMasters);
    const [schemeDocumentMappings, setSchemeDocumentMappings] = useState<SchemeDocumentMapping[]>([]);
    const [giftMasters, setGiftMasters] = useState<GiftMaster[]>(initialGiftMasters);
    const [taskStatusMasters, setTaskStatusMasters] = useState<TaskStatusMaster[]>(initialTaskStatusMasters);
    const [customerCategories, setCustomerCategories] = useState<CustomerCategory[]>(initialCustomerCategories);
    const [bankMasters, setBankMasters] = useState<BankMaster[]>(initialBankMasters);
    const [allBranches, setAllBranches] = useState<FinRootsBranch[]>([]);
    const [finrootsCompanyInfo, setFinrootsCompanyInfo] = useState<FinRootsCompanyInfo>(initialFinrootsCompanyInfo);
    // NEW MASTER DATA STATE
    const [customerSubCategories, setCustomerSubCategories] = useState<CustomerSubCategory[]>(initialCustomerSubCategories);
    const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>(initialCustomerGroups);
    const [taskMasters, setTaskMasters] = useState<TaskMaster[]>(initialTaskMasters);
    const [subTaskMasters, setSubTaskMasters] = useState<SubTaskMaster[]>(initialSubTaskMasters);
    const [policyChecklistMasters, setPolicyChecklistMasters] = useState<PolicyChecklistMaster[]>(initialPolicyChecklistMasters);
    const [insuranceTypes, setInsuranceTypes] = useState<InsuranceTypeMaster[]>(initialInsuranceTypes);
    const [insuranceFields, setInsuranceFields] = useState<InsuranceFieldMaster[]>(initialInsuranceFields);

    // --- Multi-tenancy Filtered Data ---
    const companyMembers = useMemo(() => allMembers.filter(m => m.companyId === currentUser?.companyId), [allMembers, currentUser]);
    const companyLeads = useMemo(() => allLeads.filter(l => l.companyId === currentUser?.companyId), [allLeads, currentUser]);
    const companyUsers = useMemo(() => allUsers.filter(u => u.companyId === currentUser?.companyId), [allUsers, currentUser]);
    const companyBranches = useMemo(() => allBranches.filter(b => b.companyId === currentUser?.companyId), [allBranches, currentUser]);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const newToast: ToastData = { id: Date.now(), message, type };
        setToasts(prevToasts => [...prevToasts, newToast]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const handleDismissFocusItem = useCallback((itemId: string) => {
        setDismissedFocusItems(prev => [...prev, itemId]);
        addToast('Focus item dismissed.', 'success');
    }, [addToast]);

    // BUG FIX: Wrapped all master data updaters in useCallback and used the spread operator `[...newData]`
    // to create a new array reference. This is crucial for React's change detection and ensures that
    // child components will re-render when the master data is updated from the MasterData component.
    // This resolves the bug where new referral types and checklist items were not appearing in dropdowns.
    const handleUpdateBusinessVerticals = useCallback((newData: BusinessVertical[]) => setBusinessVerticals([...newData]), []);
    const handleUpdateLeadSources = useCallback((newData: LeadSourceMaster[]) => setLeadSources([...newData]), []);
    const handleUpdateSchemes = useCallback((newData: SchemeMaster[]) => setSchemes([...newData]), []);
    const handleUpdateFinrootsBranches = useCallback((newData: FinRootsBranch[]) => setAllBranches([...newData]), []);
    const handleUpdateGeographies = useCallback((newData: Geography[]) => setGeographies([...newData]), []);
    const handleUpdateRelationshipTypes = useCallback((newData: RelationshipType[]) => setRelationshipTypes([...newData]), []);
    const handleUpdateDocumentMasters = useCallback((newData: DocumentMaster[]) => setDocumentMasters([...newData]), []);
    const handleUpdateSchemeDocumentMappings = useCallback((newData: SchemeDocumentMapping[]) => setSchemeDocumentMappings([...newData]), []);
    const handleUpdateGiftMasters = useCallback((newData: GiftMaster[]) => setGiftMasters([...newData]), []);
    const handleUpdateTaskStatusMasters = useCallback((newData: TaskStatusMaster[]) => setTaskStatusMasters([...newData]), []);
    const handleUpdateCustomerCategories = useCallback((newData: CustomerCategory[]) => setCustomerCategories([...newData]), []);
    const handleUpdateBankMasters = useCallback((newData: BankMaster[]) => setBankMasters([...newData]), []);
    const handleUpdateCustomerSubCategories = useCallback((newData: CustomerSubCategory[]) => setCustomerSubCategories([...newData]), []);
    const handleUpdateCustomerGroups = useCallback((newData: CustomerGroup[]) => setCustomerGroups([...newData]), []);
    const handleUpdateTaskMasters = useCallback((newData: TaskMaster[]) => setTaskMasters([...newData]), []);
    const handleUpdateSubTaskMasters = useCallback((newData: SubTaskMaster[]) => setSubTaskMasters([...newData]), []);
    const handleUpdatePolicyChecklistMasters = useCallback((newData: PolicyChecklistMaster[]) => setPolicyChecklistMasters([...newData]), []);
    const handleUpdateInsuranceTypes = useCallback((newData: InsuranceTypeMaster[]) => setInsuranceTypes([...newData]), []);
    const handleUpdateInsuranceFields = useCallback((newData: InsuranceFieldMaster[]) => setInsuranceFields([...newData]), []);
    const handleUpdateRoutes = useCallback((newData: Route[]) => setRoutes([...newData]), []);


    // --- THEME MANAGEMENT ---
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
     // --- DATA FETCHING ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [membersData, leadsData, usersData, routesData, opCompaniesData, branchesData, permissionsData] = await Promise.all([
                    getMembers(), 
                    getLeads(), 
                    getUsers(), 
                    getRoutes(), 
                    getOperatingCompanies(), 
                    getFinrootsBranches(),
                    getRolePermissions()
                ]);
                setAllMembers(membersData);
                setAllLeads(leadsData);
                setAllUsers(usersData);
                setRoutes(routesData);
                setOperatingCompanies(opCompaniesData);
                setAllBranches(branchesData);
                setRolePermissions(permissionsData);
                 // Load attendance from localStorage
                const savedAttendance = localStorage.getItem('finroots-attendance');
                if (savedAttendance) {
                    setAttendance(JSON.parse(savedAttendance));
                }
            } catch (error) {
                console.error("Failed to load initial data:", error);
                addToast("Could not load app data. Please refresh.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [addToast]);
    
    // --- NOTIFICATION GENERATION ---
    useEffect(() => {
        const generateNotifications = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingLimit = new Date(today);
            upcomingLimit.setDate(today.getDate() + 30);

            const newNotifications: Notification[] = [];
            let idCounter = 0;

            const getNextOccurrence = (dateStr: string | undefined): Date | null => {
                if (!dateStr) return null;
                const eventDate = new Date(dateStr);
                if (isNaN(eventDate.getTime())) return null;

                const currentYear = today.getFullYear();
                eventDate.setFullYear(currentYear);
                
                if (eventDate < today) {
                    eventDate.setFullYear(currentYear + 1);
                }
                return eventDate;
            };

            const dayDifference = (date1: Date, date2: Date): number => {
                const diffTime = date1.getTime() - date2.getTime();
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            };

            companyMembers.forEach(member => {
                if (member.automatedGreetingsEnabled !== false) {
                    // Check for upcoming birthdays
                    const nextBirthday = getNextOccurrence(member.dob);
                    if (nextBirthday && nextBirthday <= upcomingLimit) {
                        const diffDays = dayDifference(nextBirthday, today);
                        const message = diffDays === 0
                            ? `Happy Birthday to ${member.name} today! Wishing you a wonderful year ahead.`
                            : `Birthday for ${member.name} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`;
                        
                        newNotifications.push({ 
                            id: `bday-${member.id}-${idCounter++}`, type: 'Birthday', date: nextBirthday.toISOString(), 
                            message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' 
                        });
                    }
                    
                    // Check for upcoming anniversaries
                    const nextAnniversary = getNextOccurrence(member.anniversary);
                    if (nextAnniversary && nextAnniversary <= upcomingLimit) {
                        const diffDays = dayDifference(nextAnniversary, today);
                        const message = diffDays === 0
                            ? `Happy Anniversary to ${member.name} today! May this special day bring you joy.`
                            : `Anniversary for ${member.name} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`;

                        newNotifications.push({ 
                            id: `anniv-${member.id}-${idCounter++}`, type: 'Anniversary', date: nextAnniversary.toISOString(), 
                            message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' 
                        });
                    }
                    
                    // Check for upcoming special occasions
                    (member.otherSpecialOccasions || []).forEach(occasion => {
                        const nextOccasionDate = getNextOccurrence(occasion.date);
                        if (nextOccasionDate && nextOccasionDate <= upcomingLimit) {
                            const diffDays = dayDifference(nextOccasionDate, today);
                             const message = diffDays === 0
                                ? `Today is a special day for ${member.name}: ${occasion.name}!`
                                : `Upcoming special day for ${member.name}: ${occasion.name} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`;

                            newNotifications.push({ 
                                id: `special-${member.id}-${occasion.id}-${idCounter++}`, 
                                type: 'Special Occasion', 
                                occasionName: occasion.name,
                                date: nextOccasionDate.toISOString(), 
                                message,
                                member: { id: member.id, name: member.name, mobile: member.mobile }, 
                                source: 'auto' 
                            });
                        }
                    });
                }
                
                 member.policies.forEach(policy => {
                     if(policy.status === 'Active') {
                         const renewalDate = new Date(policy.renewalDate);
                         const diffTime = renewalDate.getTime() - today.getTime();
                         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                         
                         if (diffDays >= 0 && diffDays <= 30) {
                             newNotifications.push({
                                 id: `renew-${policy.id}-${idCounter++}`, type: 'Policy Renewal', date: renewalDate.toISOString(), message: `Policy renewal for ${member.name} is due in ${diffDays} days.`, member: { id: member.id, name: member.name, mobile: member.mobile }, policy, source: 'auto'
                             });
                         }
                     }
                 });
            });
            
            customMessages.forEach(msg => {
                const msgDate = new Date(msg.dateTime);
                if (msgDate.getFullYear() === today.getFullYear() && msgDate.getMonth() === today.getMonth() && msgDate.getDate() === today.getDate()) {
                    const member = companyMembers.find(m => m.id === msg.memberId);
                    if(member) newNotifications.push({ id: `custom-${msg.id}-${idCounter++}`, type: 'Custom', date: msg.dateTime, message: msg.message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'custom' });
                }
            });
            
            newNotifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setNotifications(newNotifications);
        };

        if (companyMembers.length > 0) {
            generateNotifications();
        }
    }, [companyMembers, customMessages]);
    
    // --- NOTIFICATION LOGIC ---
    const undismissedNotifications = useMemo(() => notifications.filter(n => !n.dismissed), [notifications]);
    
    // Reset dropdown cleared state if new notifications come in
    useEffect(() => {
        setDropdownCleared(false);
    }, [undismissedNotifications]);

    // Click outside handler for dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
                setIsNotificationDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    // For dropdown only
    const handleClearDropdown = useCallback(() => {
        setDropdownCleared(true);
        addToast("Notifications cleared from this view.", "success");
    }, [addToast]);

    // For Action Hub only
    const handleClearActionHubNotifications = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, dismissed: true })));
        addToast("All notifications cleared from Action Hub.", "success");
    }, [addToast]);
    
     const handleLogin = (user: User) => {
        setCurrentUser(user);
        const today = new Date().toISOString().split('T')[0];
        const attendanceKey = `${user.id}-${today}`;
        if (user.role === 'Advisor' && !localStorage.getItem(attendanceKey)) {
            setIsAttendanceModalOpen(true);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setActiveTab('dashboard');
    };
    
    const handleMarkAttendance = useCallback((status: 'Present' | 'Absent', reason?: string) => {
        if (!currentUser) return;
        const today = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toISOString();
        const attendanceKey = `${currentUser.id}-${today}`;
        
        const newRecord: AttendanceRecord = { status, reason, timestamp };
        
        setAttendance(prev => {
            const newState = {...prev, [currentUser.id]: newRecord };
            // Simulate persisting to a DB; here we use localStorage
            localStorage.setItem('finroots-attendance', JSON.stringify(newState));
            return newState;
        });

        localStorage.setItem(attendanceKey, 'marked'); // Mark as done for today
        setIsAttendanceModalOpen(false);
        addToast(`Attendance marked as ${status}.`, 'success');
    }, [currentUser, addToast]);
    
    const handleUpdateAttendanceByAdmin = useCallback((userId: string, status: 'Present' | 'Absent', reason?: string) => {
        const timestamp = new Date().toISOString();
        const newRecord: AttendanceRecord = { status, reason: reason || 'Admin Override', timestamp };
        
        setAttendance(prev => {
            const newState = {...prev, [userId]: newRecord };
            localStorage.setItem('finroots-attendance', JSON.stringify(newState));
            return newState;
        });
        addToast("Attendance updated by Admin.", "success");
    }, [addToast]);

    const handleOpenMemberModal = useCallback((member: Member | null, initialTab: ModalTab | null = ModalTab.BasicInfo, originatingLeadId: string | null = null) => {
        setEditingMember(member);
        setInitialModalTab(initialTab);
        setLeadToConvertId(originatingLeadId);
        setIsMemberModalOpen(true);
    }, []);

    const onViewMember = useCallback((member: Member, initialTab?: ModalTab) => {
        handleOpenMemberModal(member, initialTab);
    }, [handleOpenMemberModal]);
    
    const handleOpenLeadModal = useCallback((lead: Lead | null) => {
        setEditingLead(lead);
        setIsLeadModalOpen(true);
    }, []);
    
    const handleOpenAdvisorModal = useCallback((advisor: User | null) => {
        setEditingAdvisor(advisor);
        setIsAdvisorModalOpen(true);
    }, []);

    const handleSaveMember = useCallback(async (memberData: Member, closeModal: boolean = true) => {
        const isNew = !memberData.id;
        let updatedMemberData = { ...memberData };
    
        try {
            if (isNew) {
                // --- DUPLICATE CHECK ---
                const duplicates = allMembers.filter(m => m.memberId === updatedMemberData.memberId && m.companyId === currentUser?.companyId);
                if (duplicates.length > 0) {
                    setPendingDuplicateMember(updatedMemberData);
                    setDuplicateMatches(duplicates);
                    setIsDuplicateModalOpen(true);
                    return;
                }
    
                // --- NEW MEMBER CREATION (SPOC) ---
                const isSPOC = (updatedMemberData.policies || []).some(p => p.policyHolderType === 'Family');
                updatedMemberData.isSPOC = isSPOC;
                if (isSPOC && !updatedMemberData.familyName) {
                    updatedMemberData.familyName = `${updatedMemberData.name}'s Family`;
                }
    
                const newMemberPayload = { ...updatedMemberData, company: currentUser?.company || '', companyId: currentUser?.companyId || '', createdBy: currentUser?.id, createdAt: new Date().toISOString() };
                let createdSpoc = await createMember(newMemberPayload as Omit<Member, 'id'>);
    
                // --- DEPENDENT CREATION & LINKING (for new SPOC) ---
                let newDependentsToCreate: Omit<Member, 'id'>[] = [];
                if (isSPOC) {
                    for (const policy of (createdSpoc.policies || [])) {
                        if (policy.policyHolderType === 'Family') {
                            for (const coveredMember of (policy.coveredMembers || [])) {
                                const existing = allMembers.find(m => m.name.toLowerCase() === coveredMember.name.toLowerCase() && m.dob === coveredMember.dob);
                                if (!existing) {
                                    const namePart = (coveredMember.name || '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, '_');
                                    const dependentAddress = coveredMember.address || createdSpoc.address;
                                    const addressDigits = (dependentAddress || '').replace(/[^0-9]/g, '');
                                    const addressPart = addressDigits.slice(0, 2).padEnd(2, '0');
                                    const mobilePart = (coveredMember.mobile || createdSpoc.mobile || '').replace(/[^0-9]/g, '').slice(-5).padEnd(5, '_');
                                    const newMemberId = `${namePart}${addressPart}${mobilePart}`;
                                    newDependentsToCreate.push({
                                        name: coveredMember.name, memberId: newMemberId, dob: coveredMember.dob, gender: coveredMember.gender, mobile: coveredMember.mobile || createdSpoc.mobile, email: coveredMember.email || createdSpoc.email, state: createdSpoc.state, city: createdSpoc.city, address: dependentAddress, memberType: 'Silver', active: true, panCard: '', aadhaar: '', policies: [], voiceNotes: [], documents: [], assignedTo: createdSpoc.assignedTo, isSPOC: false, spocId: createdSpoc.memberId, familyName: createdSpoc.familyName, company: createdSpoc.company, companyId: createdSpoc.companyId, createdBy: currentUser?.id, createdAt: new Date().toISOString(), processStage: 'Initial Contact', maritalStatus: 'Single',
                                    });
                                }
                            }
                        }
                    }
                }
    
                const createdDependents = newDependentsToCreate.length > 0 ? await Promise.all(newDependentsToCreate.map(createMember)) : [];
                
                // --- BUG FIX: Link created dependents' memberId back to the SPOC's policy ---
                let wasSpocUpdated = false;
                if (isSPOC && createdDependents.length > 0) {
                    createdSpoc.policies = createdSpoc.policies.map(policy => {
                        if (policy.policyHolderType === 'Family') {
                            return {
                                ...policy,
                                coveredMembers: (policy.coveredMembers || []).map(cm => {
                                    const dependent = createdDependents.find(d => d.name === cm.name && d.dob === cm.dob);
                                    if (dependent) {
                                        wasSpocUpdated = true;
                                        return { ...cm, memberId: dependent.memberId }; // Add the permanent link
                                    }
                                    return cm;
                                })
                            };
                        }
                        return policy;
                    });
                     if (wasSpocUpdated) {
                        createdSpoc = await updateMember(createdSpoc);
                    }
                }
    
                setAllMembers(prev => [...prev, createdSpoc, ...createdDependents]);
                addToast("Customer created successfully!", "success");
    
                // --- LEAD CONVERSION ---
                if (leadToConvertId) {
                    const leadToUpdate = allLeads.find(l => l.id === leadToConvertId);
                    if (leadToUpdate) {
                        const updatedLead = await updateLead({ ...leadToUpdate, status: 'Won' });
                        setAllLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
                        addToast(`Lead "${updatedLead.name}" marked as Won.`, "success");
                    }
                    setLeadToConvertId(null);
                }
    
                if (closeModal) setIsMemberModalOpen(false);
    
            } else { // --- MEMBER UPDATE ---
                const oldMember = allMembers.find(m => m.id === updatedMemberData.id);
                if (!oldMember) throw new Error("Original member not found for update.");
    
                let membersToUpdate: Member[] = [];
                let newDependentsToCreate: Omit<Member, 'id'>[] = [];
    
                const wasSPOC = oldMember.isSPOC;
                const isNowSPOC = (updatedMemberData.policies || []).some(p => p.policyHolderType === 'Family');
                updatedMemberData.isSPOC = isNowSPOC;
                
                if (isNowSPOC && !wasSPOC) {
                    updatedMemberData.familyName = `${updatedMemberData.name}'s Family`;
                } else if (isNowSPOC && !updatedMemberData.familyName) {
                    updatedMemberData.familyName = `${updatedMemberData.name}'s Family`;
                }

                if (updatedMemberData.isSPOC && oldMember.name !== updatedMemberData.name) {
                    updatedMemberData.familyName = `${updatedMemberData.name}'s Family`;
                    const dependentsToUpdate = allMembers.filter(m => m.spocId === oldMember.memberId);
                    dependentsToUpdate.forEach(dep => {
                        membersToUpdate.push({ ...dep, familyName: updatedMemberData.familyName });
                    });
                }
    
                // --- COMPREHENSIVE SYNC: SPOC -> Dependent ---
                if (isNowSPOC) {
                    const oldCmMap = new Map((oldMember.policies || []).flatMap(p => p.coveredMembers || []).map(cm => [cm.id, cm]));

                    for (const policy of (updatedMemberData.policies || []).filter(p => p.policyHolderType === 'Family')) {
                        policy.familyHeadMemberId = updatedMemberData.memberId;
                        for (const updatedCm of (policy.coveredMembers || [])) {
                            const oldCm = oldCmMap.get(updatedCm.id);
                            
                            if (oldCm) { // Existing covered member, find by permanent ID
                                // BUG FIX: Use memberId to find the dependent record, not name/dob.
                                const dependentRecord = allMembers.find(m => m.memberId === updatedCm.memberId);
                                
                                if (dependentRecord) {
                                    // This part is for syncing SPOC changes to dependents, but we don't do that here.
                                    // The main sync is dependent -> SPOC.
                                }
                            } else { // This is a newly added covered member
                                const existingMember = allMembers.find(m => m.name.toLowerCase().trim() === updatedCm.name.toLowerCase().trim() && m.dob === updatedCm.dob);
                                if (!existingMember) {
                                    const namePart = (updatedCm.name || '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, '_');
                                    const dependentAddress = updatedCm.address || updatedMemberData.address;
                                    const addressDigits = (dependentAddress || '').replace(/[^0-9]/g, '');
                                    const addressPart = addressDigits.slice(0, 2).padEnd(2, '0');
                                    const mobilePart = (updatedCm.mobile || updatedMemberData.mobile || '').replace(/[^0-9]/g, '').slice(-5).padEnd(5, '_');
                                    const newMemberId = `${namePart}${addressPart}${mobilePart}`;
                                    newDependentsToCreate.push({
                                         name: updatedCm.name, memberId: newMemberId, dob: updatedCm.dob, gender: updatedCm.gender, mobile: updatedCm.mobile || updatedMemberData.mobile, email: updatedCm.email || updatedMemberData.email, state: updatedMemberData.state, city: updatedMemberData.city, address: dependentAddress, memberType: 'Silver', active: true, panCard: '', aadhaar: '', policies: [], voiceNotes: [], documents: [], assignedTo: updatedMemberData.assignedTo, isSPOC: false, spocId: updatedMemberData.memberId, familyName: updatedMemberData.familyName, company: updatedMemberData.company, companyId: updatedMemberData.companyId, createdBy: currentUser?.id, createdAt: new Date().toISOString(), processStage: 'Initial Contact', maritalStatus: 'Single',
                                    });
                                } else if (!existingMember.spocId) {
                                    membersToUpdate.push({ ...existingMember, spocId: updatedMemberData.memberId, familyName: updatedMemberData.familyName });
                                }
                            }
                        }
                    }
                }
    
                // --- BUG FIX: Dependent -> SPOC Data Synchronization ---
                if (oldMember.spocId) {
                    const spoc = allMembers.find(m => m.memberId === oldMember.spocId && m.isSPOC);
                    if (spoc) {
                        const updatedSpocPolicies = spoc.policies.map(policy => {
                            if (policy.policyHolderType !== 'Family') return policy;
                            const newCoveredMembers = (policy.coveredMembers || []).map(cm => {
                                // CORE FIX: Match on the permanent memberId, not the editable name/dob.
                                // Fallback to old logic for legacy data without a linked memberId.
                                if ((cm.memberId && cm.memberId === oldMember.memberId) || (!cm.memberId && cm.name.toLowerCase().trim() === oldMember.name.toLowerCase().trim() && cm.dob === oldMember.dob)) {
                                    return { ...cm, name: updatedMemberData.name, dob: updatedMemberData.dob, gender: updatedMemberData.gender, email: updatedMemberData.email, mobile: updatedMemberData.mobile };
                                }
                                return cm;
                            });
                            return { ...policy, coveredMembers: newCoveredMembers };
                        });
                        membersToUpdate.push({ ...spoc, policies: updatedSpocPolicies });
                    }
                }
                
                // --- SAVE ALL CHANGES ---
                // Create any new dependents first to get their permanent IDs
                const createdDependents = await Promise.all(newDependentsToCreate.map(m => createMember(m as Omit<Member, 'id'>)));
                
                // Now, link the newly created dependents back to the SPOC's policy data before saving the SPOC
                if (createdDependents.length > 0) {
                    updatedMemberData.policies = updatedMemberData.policies.map(policy => {
                         if (policy.policyHolderType === 'Family') {
                             return {
                                 ...policy,
                                 coveredMembers: (policy.coveredMembers || []).map(cm => {
                                     // Find the corresponding dependent we just created
                                     const dependent = createdDependents.find(d => d.name === cm.name && d.dob === cm.dob);
                                     if (dependent && !cm.memberId) {
                                         return { ...cm, memberId: dependent.memberId }; // Add the link
                                     }
                                     return cm;
                                 })
                             };
                         }
                         return policy;
                    });
                }

                const updatedMemberResult = await updateMember(updatedMemberData as Member);
                const updatedDependents = await Promise.all(membersToUpdate.map(m => updateMember(m)));
    
                // --- UPDATE STATE ---
                setAllMembers(prev => {
                    const memberMap = new Map(prev.map(m => [m.id, m]));
                    memberMap.set(updatedMemberResult.id, updatedMemberResult);
                    updatedDependents.forEach(ud => memberMap.set(ud.id, ud));
                    createdDependents.forEach(cd => memberMap.set(cd.id, cd));
                    return Array.from(memberMap.values());
                });
    
                setEditingMember(prev => (prev && prev.id === updatedMemberResult.id ? updatedMemberResult : prev));
                addToast("Customer updated successfully!", "success");
                if (closeModal) setIsMemberModalOpen(false);
            }
        } catch (error) {
            addToast(`Error saving customer: ${(error as Error).message}`, "error");
            setLeadToConvertId(null);
        }
    }, [addToast, currentUser, allMembers, allLeads, leadToConvertId]);

    // --- REFACTORED: Handler to relieve a member from a family group ---
    const handleRelieveMember = useCallback(async (memberToRelieveId: string) => {
        const memberToRelieve = allMembers.find(m => m.id === memberToRelieveId);
        if (!memberToRelieve || !memberToRelieve.spocId) {
            addToast("Member to relieve is not a dependent or could not be found.", "error");
            return;
        }
    
        const spoc = allMembers.find(m => m.memberId === memberToRelieve.spocId);
        if (!spoc) {
            addToast("The primary contact (SPOC) for this family could not be found.", "error");
            return;
        }
        
        // Mark the member as relieved by adding a timestamp, but keep the spocId for tree rendering.
        const updatedRelievedMemberPayload = {
            ...memberToRelieve,
            relievedTimestamp: new Date().toISOString(),
        };
    
        // Remove the relieved member from being covered in the SPOC's active family policies.
        const updatedSpocPayload = {
            ...spoc,
            policies: spoc.policies.map(p => {
                if (p.policyHolderType === 'Family') {
                    return {
                        ...p,
                        coveredMembers: (p.coveredMembers || []).filter(cm => {
                            // CORE FIX: Use the permanent memberId to identify who to remove.
                            return cm.memberId !== memberToRelieve.memberId;
                        })
                    };
                }
                return p;
            })
        };
    
        try {
            // Persist both changes and get the updated objects back
            const [updatedRelievedMemberResult, updatedSpocResult] = await Promise.all([
                updateMember(updatedRelievedMemberPayload),
                updateMember(updatedSpocPayload)
            ]);
    
            // Update the global state with the results from the API
            setAllMembers(prev => prev.map(m => {
                if (m.id === updatedRelievedMemberResult.id) return updatedRelievedMemberResult;
                if (m.id === updatedSpocResult.id) return updatedSpocResult;
                return m;
            }));
    
            addToast(`${memberToRelieve.name} has been relieved and can now manage their own family policies.`, 'success');
            
            // Re-open the modal with the fresh data to avoid stale state issues.
            setIsMemberModalOpen(false);
            setTimeout(() => {
                handleOpenMemberModal(updatedSpocResult, ModalTab.Family);
            }, 100);

        } catch (error) {
            addToast(`Failed to relieve member: ${(error as Error).message}`, 'error');
        }
    }, [allMembers, addToast, handleOpenMemberModal]);
    
    const handleCreateWithConversation = (memberData: Partial<Member>) => {
        setIsConversationalCreatorOpen(false);
        setEditingMember(memberData as Member);
        setInitialModalTab(ModalTab.BasicInfo);
        setIsMemberModalOpen(true);
    };
    
    const handleDeleteMember = useCallback(async (memberId: string) => {
        if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
            try {
                await deleteMember(memberId);
                setAllMembers(prev => prev.filter(m => m.id !== memberId));
                addToast('Member deleted successfully.', 'success');
            } catch (error) {
                addToast('Failed to delete member.', 'error');
            }
        }
    }, [addToast]);

    const handleDeleteLead = useCallback(async (leadId: string) => {
        try {
            await deleteLead(leadId);
            setAllLeads(prev => prev.filter(l => l.id !== leadId));
            addToast('Lead deleted successfully.', 'success');
        } catch (error) {
            addToast('Failed to delete lead.', 'error');
        }
    }, [addToast]);

    const handleToggleMemberStatus = useCallback(async (memberId: string) => {
        const member = companyMembers.find(m => m.id === memberId);
        if (member) {
            const updatedMember = { ...member, active: !member.active };
            await handleSaveMember(updatedMember);
        }
    }, [companyMembers, handleSaveMember]);
    
     const handleGenerateReview = useCallback(async (memberId: string) => {
        const member = companyMembers.find(m => m.id === memberId);
        if (member) {
            setEditingMember(member);
            setIsGeneratingReview(true);
            setIsAnnualReviewModalOpen(true);
            const content = await generateAnnualReview(member, upsellOpportunities, addToast);
            setReviewContent(content);
            setIsGeneratingReview(false);
        }
    }, [companyMembers, upsellOpportunities, addToast]);
    
    const handleFindUpsell = useCallback(async (member: Member): Promise<string | null> => {
        const newOpportunity = await generateUpsellOpportunityForMember(member, addToast);
        if (newOpportunity) {
            setUpsellOpportunities(prev => {
                const existing = prev.find(op => op.memberId === newOpportunity.memberId);
                if (existing) {
                    return prev.map(op => op.memberId === newOpportunity.memberId ? newOpportunity : op);
                }
                return [...prev, newOpportunity];
            });
            addToast(`New upsell opportunity found for ${member.name}!`, 'success');
            return newOpportunity.suggestions;
        } else {
            addToast(`No new specific upsell opportunities found for ${member.name} at this time.`, 'success');
            return null;
        }
    }, [addToast]);

    const handleCreateTask = useCallback((task: Omit<Task, 'id'>) => {
        const creationLog: TaskActivityLog = {
            timestamp: new Date().toISOString(),
            action: 'Created',
            details: 'Task was created.',
            by: currentUser?.id || 'system',
        };
        const newTask: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...task,
            creationDateTime: new Date().toISOString(),
            isCompleted: task.isCompleted || false,
            isShared: task.isShared ?? (task.taskType === 'Auto'), // Default isShared based on taskType
            primaryContactPerson: task.primaryContactPerson || currentUser?.id,
            statusId: task.statusId || 'ts-6', // Default to 'Assigned'
            active: true,
            activityLog: [creationLog],
        };
        setAllTasks(prev => [...prev, newTask]);
    }, [currentUser]);

    const handleCreateBulkTask = useCallback((baseTask: Omit<Task, 'id'>, advisorIds: string[]) => {
        if (advisorIds.length === 0) {
            addToast('No advisors selected for bulk task creation.', 'error');
            return;
        }

        const creationLog: TaskActivityLog = {
            timestamp: new Date().toISOString(),
            action: 'Created',
            details: 'Task was created via bulk assignment.',
            by: currentUser?.id || 'system',
        };

        const newTasks: Task[] = advisorIds.map((advisorId, index) => ({
            id: `task-${Date.now()}-${index}`, // Unique ID for each task in the batch
            ...baseTask,
            primaryContactPerson: advisorId,
            creationDateTime: new Date().toISOString(),
            isCompleted: baseTask.isCompleted || false,
            isShared: baseTask.isShared ?? (baseTask.taskType === 'Auto'),
            statusId: baseTask.statusId || 'ts-6', // Default to 'Assigned'
            active: true,
            activityLog: [creationLog],
        }));

        setAllTasks(prev => [...prev, ...newTasks]);
        addToast(`Task successfully assigned to ${advisorIds.length} advisor(s).`, 'success');
    }, [addToast, currentUser]);

    const handleUpdateTask = useCallback((updatedTask: Task) => {
        setAllTasks(prevTasks => {
            const oldTask = prevTasks.find(task => task.id === updatedTask.id);
            if (!oldTask) return prevTasks;
    
            let newLog: TaskActivityLog | null = null;
            if (oldTask.statusId !== updatedTask.statusId) {
                newLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Status Change',
                    details: 'Status was updated in modal.',
                    by: currentUser?.id || 'system',
                };
            } else if (JSON.stringify(oldTask) !== JSON.stringify(updatedTask)) {
                newLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Details Updated',
                    details: 'Task details were updated.',
                    by: currentUser?.id || 'system',
                };
            }
    
            const taskWithLog = newLog 
                ? { ...updatedTask, activityLog: [...(updatedTask.activityLog || []), newLog] }
                : updatedTask;
    
            return prevTasks.map(task =>
                task.id === updatedTask.id ? taskWithLog : task
            );
        });
    }, [currentUser]);

    const handleDeleteTask = useCallback((taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setAllTasks(prev => prev.filter(t => t.id !== taskId));
            addToast('Task deleted.', 'success');
        }
    }, [addToast]);
    
    const handleOpenTask = useCallback((taskId: string) => {
        setAllTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId && task.statusId === 'ts-6') { // From Assigned
                const newLog: TaskActivityLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Status Change',
                    details: 'Status changed from Assigned to Viewed.',
                    by: currentUser?.id || 'system',
                };
                return { ...task, statusId: 'ts-5', activityLog: [...(task.activityLog || []), newLog] }; // To Viewed
            }
            return task;
        }));
    }, [currentUser]);

    const handleToggleTask = useCallback((taskId: string) => {
        setAllTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId) {
                const isCompleted = task.isCompleted;
                const newStatusId = isCompleted ? 'ts-2' : 'ts-3'; // In Progress vs Completed
                const newLog: TaskActivityLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Status Change',
                    details: `Status changed to ${isCompleted ? 'In Progress' : 'Completed'}.`,
                    by: currentUser?.id || 'system',
                };
                return { ...task, isCompleted: !isCompleted, statusId: newStatusId, activityLog: [...(task.activityLog || []), newLog] };
            }
            return task;
        }));
    }, [currentUser]);
    
    const handleReassignTask = useCallback(async (taskId: string, newAdvisorId: string, reassignerId: string) => {
        const taskIndex = allTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            addToast('Task not found for reassignment.', 'error');
            return;
        }
    
        const oldTask = allTasks[taskIndex];
        const oldAdvisorName = allUsers.find(u => u.id === oldTask.primaryContactPerson)?.name || 'Unassigned';
        const newAdvisor = allUsers.find(u => u.id === newAdvisorId);
        if (!newAdvisor) {
            addToast('New advisor not found.', 'error');
            return;
        }
        const newAdvisorName = newAdvisor.name;
    
        const newLog: TaskActivityLog = {
            timestamp: new Date().toISOString(),
            action: 'Reassigned',
            details: `Task reassigned from ${oldAdvisorName} to ${newAdvisorName}.`,
            by: reassignerId,
        };
    
        const updatedTask = {
            ...oldTask,
            primaryContactPerson: newAdvisorId,
            statusId: 'ts-6', // Reset status to Assigned
            activityLog: [...(oldTask.activityLog || []), newLog],
        };
    
        setAllTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    
        // Create a notification for the new advisor
        const member = updatedTask.memberId ? companyMembers.find(m => m.id === updatedTask.memberId) : null;
        const lead = updatedTask.leadId ? companyLeads.find(l => l.id === updatedTask.leadId) : null;
        
        const newNotification: Notification = {
            id: `task-assign-${taskId}-${Date.now()}`,
            type: 'Task Assignment',
            date: new Date().toISOString(),
            message: `Task "${updatedTask.taskDescription}" has been reassigned to you.`,
            member: member ? { id: member.id, name: member.name, mobile: member.mobile } : (lead ? { id: lead.id, name: lead.name, mobile: lead.phone } : { id: '', name: 'Personal Task', mobile: ''}),
            source: 'auto'
        };
        setNotifications(prev => [newNotification, ...prev]);
    
        addToast(`Task successfully reassigned to ${newAdvisorName}.`, 'success');
    }, [allTasks, allUsers, companyMembers, companyLeads, addToast]);
    
    const handleSaveAdvisor = useCallback(async (advisorData: User, closeModal: boolean = true) => {
        try {
            if (advisorData.id) { // It has an ID, so it's an update
                const updated = await updateAdvisor(advisorData);
                setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                if(currentUser?.id === updated.id) setCurrentUser(updated); // Update current user state if they edit their own profile
                addToast("Advisor updated successfully!", "success");
            } else { // No ID, so it's a new advisor
                const { id, role, initials, ...createData } = advisorData;
                const created = await createAdvisor(createData as Omit<User, 'id' | 'role' | 'initials'>);
                setAllUsers(prev => [...prev, created]);
                addToast("Advisor created successfully!", "success");
            }
             if (closeModal) {
                setIsAdvisorModalOpen(false);
                setEditingAdvisor(null); // Clear editing state
            }
        } catch (error) {
            addToast(`Error saving advisor: ${(error as Error).message}`, "error");
        }
    }, [addToast, currentUser]);

    const handleUpdatePassword = useCallback(async (current: string, newPass: string) => {
        if (!currentUser || currentUser.password !== current) {
            addToast("Current password is incorrect.", "error");
            return false;
        }
        const updatedUser = { ...currentUser, password: newPass };
        await handleSaveAdvisor(updatedUser, false); // Reuse update logic, don't close modal
        setCurrentUser(updatedUser);
        addToast("Password updated successfully.", "success");
        return true;
    }, [currentUser, handleSaveAdvisor, addToast]);

    const handleUpdateCommissionStatus = useCallback((memberId: string, policyId: string, status: 'Pending' | 'Paid' | 'Cancelled') => {
        setAllMembers(prevMembers => prevMembers.map(m => {
            if (m.id === memberId) {
                return {
                    ...m,
                    policies: m.policies.map(p => {
                        if (p.id === policyId && p.commission) {
                            return {
                                ...p,
                                commission: { ...p.commission, status: status }
                            };
                        }
                        return p;
                    })
                };
            }
            return m;
        }));
        addToast("Commission status updated!", "success");
    }, [addToast]);

    const handleRenewPolicy = useCallback(async (memberId: string, policyId: string) => {
        try {
            const updatedMember = await renewPolicy(memberId, policyId);
            setAllMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
            addToast("Policy renewed successfully!", "success");
            setActivityLog(prev => [{ id: `log-${Date.now()}`, type: 'renewalSuccess', message: `Policy ${policyId} for ${updatedMember.name} renewed.`, timestamp: new Date().toISOString(), memberId, policyId }, ...prev]);
            await handleFindUpsell(updatedMember);
            return true;
        } catch (error) {
            addToast("Failed to renew policy.", "error");
            return false;
        }
    }, [addToast, handleFindUpsell]);

    const handleUpdateOperatingCompany = useCallback(async (companyData: Company) => {
        try {
            const updated = await updateOperatingCompany(companyData);
            setOperatingCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
            if (currentUser && currentUser.companyId === updated.id) {
                setCurrentUser(prev => prev ? { ...prev, company: updated.name } : null);
            }
            addToast("Company profile updated successfully.", "success");
        } catch (error) {
            addToast(`Failed to update company profile: ${(error as Error).message}`, "error");
        }
    }, [addToast, currentUser]);
    
    // --- FIX FOR COMPANY MASTER DATA ---
    // This creates a combined array for the MasterData component's `companies` prop.
    // It ensures the user's operating company is the first item, followed by insurance providers.
    const companyForMaster = useMemo(() => operatingCompanies.find(c => c.id === currentUser?.companyId), [operatingCompanies, currentUser]);
    const providersForMaster = useMemo(() => {
        if (!companyForMaster) return insuranceProviders;
        // This ensures the user's company is always first and unique in the list passed to the component.
        const otherProviders = insuranceProviders.filter(p => p.id !== companyForMaster.id);
        return [companyForMaster, ...otherProviders];
    }, [companyForMaster, insuranceProviders]);

    // This is a wrapper handler to intercept updates from MasterData.
    // It splits the updated array back into operating company vs. insurance providers
    // and calls the correct state update handlers for each.
    const handleMasterCompaniesUpdate = useCallback((updatedData: Company[]) => {
        const currentUserCompanyId = currentUser?.companyId;

        // Find the operating company in the updated list
        const updatedOperatingCompany = updatedData.find(c => c.id === currentUserCompanyId);
        
        // The rest are insurance providers
        const updatedInsuranceProviders = updatedData.filter(c => c.id !== currentUserCompanyId);

        // If the operating company was found in the update, handle its update
        if (updatedOperatingCompany) {
            handleUpdateOperatingCompany(updatedOperatingCompany);
        }

        // Always update the insurance providers list state
        setInsuranceProviders(updatedInsuranceProviders);
    }, [currentUser, handleUpdateOperatingCompany]);

    // Handlers for Duplicate Member Modal
    const handleCreateAnyway = useCallback(async () => {
        if (!pendingDuplicateMember) return;
        try {
            const newMember = { ...pendingDuplicateMember, company: currentUser?.company || '', companyId: currentUser?.companyId || '', createdBy: currentUser?.id, createdAt: new Date().toISOString() };
            const created = await createMember(newMember as Member);
            setAllMembers(prev => [...prev, created]);
            addToast("New customer created successfully despite duplicate ID.", "success");
        } catch (error) {
            addToast(`Error saving customer: ${(error as Error).message}`, "error");
        } finally {
            setIsDuplicateModalOpen(false);
            setPendingDuplicateMember(null);
            setDuplicateMatches([]);
            setIsMemberModalOpen(false);
        }
    }, [pendingDuplicateMember, currentUser, addToast]);

    const handleUpdateExistingDuplicate = useCallback(async (existingMemberId: string) => {
        if (!pendingDuplicateMember) return;
        const existingMember = allMembers.find(m => m.id === existingMemberId);
        if (!existingMember) return;

        try {
            // Merge new info into existing member
            const updatedMemberData = { ...existingMember, ...pendingDuplicateMember, id: existingMember.id };
            const updated = await updateMember(updatedMemberData);
            setAllMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
            addToast("Existing customer updated with new information.", "success");
        } catch (error) {
            addToast(`Error updating customer: ${(error as Error).message}`, "error");
        } finally {
            setIsDuplicateModalOpen(false);
            setPendingDuplicateMember(null);
            setDuplicateMatches([]);
            setIsMemberModalOpen(false);
        }
    }, [pendingDuplicateMember, allMembers, addToast]);
    
    // Handler for saving a note to a Lead
    const handleSaveLeadNote = useCallback(async (leadId: string, newNote: VoiceNote) => {
        const leadToUpdate = allLeads.find(l => l.id === leadId);
        if (leadToUpdate) {
            const updatedLead = {
                ...leadToUpdate,
                voiceNotes: [...(leadToUpdate.voiceNotes || []), newNote]
            };
            await updateLead(updatedLead);
            setAllLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
            addToast(`Note saved for lead "${leadToUpdate.name}".`, "success");
        }
    }, [allLeads, addToast]);
    
    const handleAddAutomationRule = useCallback((newRuleData: Omit<AutomationRule, 'id' | 'icon'>) => {
        const getIcon = (type: AutomationRule['type']) => {
            switch(type) {
                case 'Birthday Messages': return <GiftIcon className="text-pink-500" />;
                case 'Anniversary Messages': return <Calendar className="text-purple-500" />;
                case 'Policy Renewal Messages': return <Bell className="text-blue-500" />;
                case 'Special Occasion Messages': return <Star className="text-yellow-500" />;
                default: return <Zap className="text-gray-500" />;
            }
        };

        const newRule: AutomationRule = {
            ...newRuleData,
            id: Math.max(0, ...automationRules.map(r => r.id)) + 1,
            icon: getIcon(newRuleData.type),
        };
        setAutomationRules(prev => [...prev, newRule]);
        addToast('New automation rule added successfully!', 'success');
    }, [automationRules, addToast]);

    const handleCreateReferrer = useCallback(async (referrerData: { name: string; mobile: string; email?: string }): Promise<Member | null> => {
        try {
            const newReferrerPayload: Omit<Member, 'id'> = {
                name: referrerData.name,
                mobile: referrerData.mobile,
                email: referrerData.email,
                memberId: `${(referrerData.name || '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, '_')}${(referrerData.mobile || '').replace(/[^0-9]/g, '').slice(-7).padEnd(7, '_')}`,
                dob: '1900-01-01', // Placeholder DOB
                maritalStatus: 'Single',
                state: '', // Placeholder
                city: '', // Placeholder
                address: '',
                memberType: 'Silver',
                active: true,
                panCard: '',
                aadhaar: '',
                policies: [],
                voiceNotes: [],
                documents: [],
                assignedTo: [],
                processStage: 'Initial Contact',
                company: currentUser?.company || '',
                companyId: currentUser?.companyId || '',
                createdBy: currentUser?.id,
                createdAt: new Date().toISOString(),
                isReferrerOnly: true, // Key flag
            };
            const created = await createMember(newReferrerPayload);
            setAllMembers(prev => [...prev, created]);
            addToast(`Referrer "${created.name}" created successfully!`, 'success');
            return created;
        } catch (error) {
            addToast(`Error creating referrer: ${(error as Error).message}`, 'error');
            return null;
        }
    }, [currentUser, addToast]);

    const handleUpdateRolePermissions = useCallback(async (permissions: RolePermissions) => {
        try {
            const updatedPermissions = await updateRolePermissions(permissions);
            setRolePermissions(prev => prev.map(p => p.role === updatedPermissions.role ? updatedPermissions : p));
            addToast('Advisor permissions updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update permissions: ${(error as Error).message}`, 'error');
        }
    }, [addToast]);


    // --- RENDER LOGIC ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-light dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
                    <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }
    
    const renderActiveComponent = () => {
        if (!currentUser) {
          // This case should ideally not be hit due to the top-level check,
          // but it satisfies TypeScript's null analysis.
          return <Login onLogin={handleLogin} onForgotPassword={() => setIsForgotPasswordModalOpen(true)} theme={theme} toggleTheme={toggleTheme} allBranches={allBranches} />;
        }
        switch (activeTab) {
            case 'dashboard': return <Dashboard members={companyMembers} leads={companyLeads} notifications={notifications} upsellOpportunities={upsellOpportunities} setActiveTab={setActiveTab} onOpenModal={handleOpenMemberModal} onOpenLeadModal={handleOpenLeadModal} currentUser={currentUser} users={companyUsers} dismissedFocusItems={dismissedFocusItems} onDismissFocusItem={handleDismissFocusItem} allTasks={allTasks} onToggleTask={handleToggleTask} />;
            case 'customers': return <MemberDashboard members={companyMembers} allMembers={allMembers} currentUser={currentUser} users={companyUsers} onEditMember={handleOpenMemberModal} onCreateMember={() => handleOpenMemberModal(null)} onConversationalCreate={() => setIsConversationalCreatorOpen(true)} onDeleteMember={handleDeleteMember} onToggleStatus={handleToggleMemberStatus} onGenerateReview={handleGenerateReview} addToast={addToast} processFlow={processFlow} finrootsBranches={companyBranches} />;
            case 'policies': return <PolicyManager members={companyMembers} onRenewPolicy={handleRenewPolicy} onViewMember={handleOpenMemberModal} addToast={addToast} users={companyUsers} finrootsBranches={companyBranches} />;
            case 'pipeline': return <SalesPipeline 
                leads={companyLeads} 
                users={companyUsers} 
                onOpenLeadModal={handleOpenLeadModal} 
                onUpdateLead={async (lead) => { 
                    if (!currentUser) return; 
                    const oldLead = allLeads.find(l => l.id === lead.id); 
                    if (!oldLead) return; 
                    const newLogs = generateLeadActivityLog(oldLead, lead, currentUser.id); 
                    const updatedLeadData = { ...lead, lastUpdatedAt: new Date().toISOString(), activityLog: [...(oldLead.activityLog || []), ...newLogs]}; 
                    const updated = await updateLead(updatedLeadData); 
                    setAllLeads(prev => prev.map(l => l.id === updated.id ? updated : l)); 
                    addToast("Lead updated.", "success"); 
                }} 
                onConvertLead={(lead) => {
                    const newMemberFromLead: Partial<Member> = {
                        name: lead.name,
                        mobile: lead.phone,
                        email: lead.email,
                        leadSource: lead.leadSource,
                        assignedTo: lead.assignedTo ? [lead.assignedTo] : [],
                        branchId: lead.branchId,
                        company: lead.company,
                        companyId: lead.companyId,
                        active: true,
                        policies: [],
                        voiceNotes: [],
                        documents: [],
                        processStage: 'Initial Contact',
                    };
                    handleOpenMemberModal(newMemberFromLead as Member, ModalTab.BasicInfo, lead.id);
                    addToast(`Converting ${lead.name} to customer. Please review and save.`, "success");
                }} 
                leadSources={leadSources} 
                onDeleteLead={handleDeleteLead} 
                finrootsBranches={companyBranches} 
                insuranceTypes={insuranceTypes}
                addToast={addToast}
            />;
            case 'notes': return <NotesPage members={companyMembers} leads={companyLeads} onSaveMember={handleSaveMember} onSaveLeadNote={handleSaveLeadNote} onCreateTask={(desc, due, memberName, memberId) => handleCreateTask({triggeringPoint: 'Manual', taskDescription: desc, expectedCompletionDateTime: due || new Date().toISOString(), memberId, taskType: 'Manual', isCompleted: false})} addToast={addToast} currentUser={currentUser} users={companyUsers} finrootsBranches={companyBranches} />;
            case 'location': return <LocationServices members={companyMembers} addToast={addToast} />;
            case 'chatbot': return <WhatsAppBot members={companyMembers} addToast={addToast} />;
            case 'profile': return currentUser.role === 'Admin' ? <AdminProfile user={currentUser} users={companyUsers} allMembers={companyMembers} onOpenAdvisorModal={() => handleOpenAdvisorModal(null)} onUpdateProfile={handleSaveAdvisor} addToast={addToast} /> : <ProfilePage user={currentUser} onUpdateProfile={handleSaveAdvisor} onUpdatePassword={handleUpdatePassword} addToast={addToast} allMembers={companyMembers} users={companyUsers} geographies={geographies} onUpdateGeographies={handleUpdateGeographies} bankMasters={bankMasters} />;
            case 'advisors': return <AdvisorManagement users={companyUsers} allMembers={companyMembers} onOpenAdvisorModal={handleOpenAdvisorModal} onToggleStatus={async (userId) => { const user = allUsers.find(u => u.id === userId); if(user) { const newStatus = user.profile?.status === 'Active' ? 'Inactive' : 'Active'; await handleSaveAdvisor({...user, profile: {...user.profile, status: newStatus} as AdvisorProfile}); addToast("Advisor status updated.", "success"); }}} attendance={attendance} onUpdateAttendance={handleUpdateAttendanceByAdmin} finrootsBranches={companyBranches} addToast={addToast} />;
            case 'servicesHub': return <ServicesHub activeTab={activeTab} setActiveTab={setActiveTab} addToast={addToast} allMembers={companyMembers} onViewMember={handleOpenMemberModal} onUpdateCommissionStatus={handleUpdateCommissionStatus} currentUser={currentUser} />;
            case 'actionHub': return <ActionAutomationHub notifications={undismissedNotifications} onRenewPolicy={handleRenewPolicy} activityLog={activityLog} addToast={addToast} onNotificationSent={() => {}} appointments={appointments} tasks={allTasks} onToggleTask={handleToggleTask} onDeleteAppointment={(id) => setAppointments(prev => prev.filter(a => a.id !== id))} savedGreetingUrl={null} setSavedGreetingUrl={() => {}} upsellOpportunities={upsellOpportunities} onDismissOpportunity={(id) => setUpsellOpportunities(prev => prev.filter(o => o.id !== id))} members={companyMembers} onScheduleMessage={(msg) => { setCustomMessages(prev => [...prev, {...msg, id: `cm-${Date.now()}`}]); addToast('Custom message scheduled!', 'success'); }} onClearAll={handleClearActionHubNotifications} onScheduleAppointment={(appt) => { const member = companyMembers.find(m => m.id === appt.memberId); if(member) { setAppointments(prev => [...prev, { ...appt, id: `appt-${Date.now()}`, memberName: member.name }]); addToast('Appointment scheduled!', 'success'); } }} rules={automationRules} onUpdateRule={(rule) => setAutomationRules(prev => prev.map(r => r.id === rule.id ? rule : r))} onAddRule={handleAddAutomationRule} processFlow={processFlow} onUpdateProcessFlow={setProcessFlow} docTemplates={docTemplates} onUpdateTemplates={setDocTemplates} currentUser={currentUser} users={companyUsers} onViewMember={onViewMember} />;
            case 'masterMember': return <MasterData 
                addToast={addToast} 
                allMembers={companyMembers} 
                businessVerticals={businessVerticals} 
                onUpdateBusinessVerticals={handleUpdateBusinessVerticals} 
                leadSources={leadSources} 
                onUpdateLeadSources={handleUpdateLeadSources} 
                schemes={schemes} 
                onUpdateSchemes={handleUpdateSchemes} 
                companies={providersForMaster}
                onUpdateCompanies={handleMasterCompaniesUpdate}
                finrootsBranches={companyBranches} 
                onUpdateFinrootsBranches={handleUpdateFinrootsBranches} 
                finrootsCompanyInfo={finrootsCompanyInfo} 
                onUpdateFinRootsCompanyInfo={setFinrootsCompanyInfo} 
                geographies={geographies} 
                onUpdateGeographies={handleUpdateGeographies} 
                relationshipTypes={relationshipTypes} 
                onUpdateRelationshipTypes={handleUpdateRelationshipTypes} 
                documentMasters={documentMasters} 
                onUpdateDocumentMasters={handleUpdateDocumentMasters} 
                schemeDocumentMappings={schemeDocumentMappings} 
                onUpdateSchemeDocumentMappings={handleUpdateSchemeDocumentMappings} 
                giftMasters={giftMasters} 
                onUpdateGiftMasters={handleUpdateGiftMasters} 
                giftMappings={giftMappings}
                onUpdateGiftMappings={setGiftMappings}
                taskStatuses={taskStatusMasters} 
                onUpdateTaskStatuses={handleUpdateTaskStatusMasters} 
                customerCategories={customerCategories} 
                onUpdateCustomerCategories={handleUpdateCustomerCategories} 
                bankMasters={bankMasters} 
                onUpdateBankMasters={handleUpdateBankMasters} 
                customerSubCategories={customerSubCategories} 
                onUpdateCustomerSubCategories={handleUpdateCustomerSubCategories} 
                customerGroups={customerGroups} 
                onUpdateCustomerGroups={handleUpdateCustomerGroups} 
                taskMasters={taskMasters} 
                onUpdateTaskMasters={handleUpdateTaskMasters} 
                subTaskMasters={subTaskMasters} 
                onUpdateSubTaskMasters={handleUpdateSubTaskMasters} 
                policyChecklistMasters={policyChecklistMasters} 
                onUpdatePolicyChecklistMasters={handleUpdatePolicyChecklistMasters} 
                insuranceTypes={insuranceTypes} 
                onUpdateInsuranceTypes={handleUpdateInsuranceTypes} 
                insuranceFields={insuranceFields} 
                onUpdateInsuranceFields={handleUpdateInsuranceFields} 
                operatingCompanies={operatingCompanies} 
                onUpdateOperatingCompanies={handleUpdateOperatingCompany}
                routes={routes}
                onUpdateRoutes={handleUpdateRoutes}
                rolePermissions={rolePermissions}
                onUpdateRolePermissions={handleUpdateRolePermissions}
                currentUser={currentUser} />;
            case 'reports & insights': return <ReportsAndInsights members={companyMembers} users={companyUsers} tasks={allTasks} attendance={attendance} onUpdateAttendance={handleUpdateAttendanceByAdmin} addToast={addToast} allLeads={companyLeads} currentUser={currentUser} leadSources={leadSources} />;
            case 'taskManagement': return <TaskManagement allTasks={allTasks} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onCreateTask={handleCreateTask} onCreateBulkTask={handleCreateBulkTask} onOpenTask={handleOpenTask} users={companyUsers} members={companyMembers} leads={companyLeads} taskStatusMasters={taskStatusMasters} addToast={addToast} currentUser={currentUser} finrootsBranches={companyBranches} onReassignTask={handleReassignTask} />;
            default: return <div>Not Implemented</div>;
        }
    };
    

    return (
        <>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {isForgotPasswordModalOpen && (
                <ForgotPasswordModal
                    isOpen={isForgotPasswordModalOpen}
                    onClose={() => setIsForgotPasswordModalOpen(false)}
                    users={allUsers}
                    onResetPassword={async (company, employeeId, newPassword) => {
                        const user = allUsers.find(u => u.employeeId.toLowerCase() === employeeId.toLowerCase() && u.company === company);
                        if(user) {
                           await handleSaveAdvisor({...user, password: newPassword});
                           return true;
                        }
                        return false;
                    }}
                    addToast={addToast}
                    operatingCompanies={operatingCompanies}
                />
            )}

            {!currentUser ? (
                <Login onLogin={handleLogin} onForgotPassword={() => setIsForgotPasswordModalOpen(true)} theme={theme} toggleTheme={toggleTheme} allBranches={allBranches} />
            ) : (
                <div className={`h-screen flex overflow-hidden ${theme}`}>
                    <Sidebar 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                        isSidebarOpen={isSidebarOpen} 
                        setIsSidebarOpen={setIsSidebarOpen} 
                        onLogout={handleLogout} 
                        user={currentUser} 
                        rolePermissions={rolePermissions}
                    />
                    <main className="flex-1 bg-brand-light dark:bg-gray-900 flex flex-col overflow-hidden md:ml-64">
                        <div className="sticky top-0 z-10 bg-brand-light/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 flex justify-between items-center border-b dark:border-gray-800 flex-shrink-0">
                            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <Menu size={24} />
                            </button>
                            <div className="flex-1 font-bold text-gray-800 dark:text-white pl-4">{currentUser?.company}</div>
                            <div className="flex items-center gap-4">
                                <div className="relative" ref={notificationDropdownRef}>
                                    <button onClick={() => setIsNotificationDropdownOpen(p => !p)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors relative">
                                        <Bell size={20} />
                                        {undismissedNotifications.length > 0 && !dropdownCleared && (
                                            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-brand-light dark:ring-gray-900" />
                                        )}
                                    </button>
                                    {isNotificationDropdownOpen && (
                                        <NotificationDropdown
                                            notifications={undismissedNotifications}
                                            isCleared={dropdownCleared}
                                            onViewAll={() => {
                                                setIsNotificationDropdownOpen(false);
                                                setActiveTab('actionHub');
                                            }}
                                            onClearAll={handleClearDropdown}
                                        />
                                    )}
                                </div>
                                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto">
                            {renderActiveComponent()}
                        </div>
                    </main>
                    {isAttendanceModalOpen && currentUser && (
                        <AttendanceModal
                            isOpen={isAttendanceModalOpen}
                            onClose={() => setIsAttendanceModalOpen(false)}
                            onMarkAttendance={handleMarkAttendance}
                            advisorName={currentUser.name}
                        />
                    )}
                    {isMemberModalOpen && (
                        <MemberModal
                            isOpen={isMemberModalOpen}
                            onClose={() => setIsMemberModalOpen(false)}
                            member={editingMember}
                            initialTab={initialModalTab}
                            onSave={handleSaveMember}
                            addToast={addToast}
                            onCreateTask={(task) => 
                                handleCreateTask(task)
                            }
                            onRelieveMember={handleRelieveMember}
                            currentUser={currentUser}
                            users={companyUsers}
                            routes={routes}
                            onUpdateRoutes={handleUpdateRoutes}
                            processFlow={processFlow}
                            onGenerateProposal={(member, policy) => { setProposalContext({ member, policy }); setIsProposalModalOpen(true); }}
                            onFindUpsell={handleFindUpsell}
                            allMembers={allMembers}
                            schemes={schemes}
                            companies={insuranceProviders}
                            documentMasters={documentMasters}
                            schemeDocumentMappings={schemeDocumentMappings}
                            relationshipTypes={relationshipTypes}
                            leadSources={leadSources}
                            geographies={geographies}
                            onUpdateGeographies={handleUpdateGeographies}
                            bankMasters={bankMasters}
                            customerCategories={customerCategories}
                            customerSubCategories={customerSubCategories}
                            customerGroups={customerGroups}
                            allTasks={allTasks}
                            subTaskMasters={subTaskMasters}
                            taskStatusMasters={taskStatusMasters}
                            policyChecklistMasters={policyChecklistMasters}
                            onUpdatePolicyChecklistMasters={handleUpdatePolicyChecklistMasters}
                            insuranceTypes={insuranceTypes}
                            insuranceFields={insuranceFields}
                            onUpdateInsuranceFields={handleUpdateInsuranceFields}
                            onCreateReferrer={handleCreateReferrer}
                        />
                    )}
                     {isAdvisorModalOpen && (
                        <AdvisorModal
                            isOpen={isAdvisorModalOpen}
                            onClose={() => setIsAdvisorModalOpen(false)}
                            advisor={editingAdvisor}
                            onSave={handleSaveAdvisor}
                            addToast={addToast}
                            allMembers={companyMembers}
                            users={companyUsers}
                            finrootsBranches={companyBranches}
                            currentUser={currentUser}
                            geographies={geographies}
                            onUpdateGeographies={handleUpdateGeographies}
                            bankMasters={bankMasters}
                        />
                    )}
                    {isLeadModalOpen && currentUser && (
                        <LeadModal
                            isOpen={isLeadModalOpen}
                            onClose={() => setIsLeadModalOpen(false)}
                            lead={editingLead}
                            onSave={async (leadData) => {
                                if (!currentUser) return;
                                const isNew = !leadData.id;
                                try {
                                    if (isNew) {
                                        const createdAt = new Date().toISOString();
                                        const newLeadData = {
                                            ...leadData,
                                            lastUpdatedAt: createdAt,
                                            activityLog: [{
                                                timestamp: createdAt,
                                                action: 'Created' as const,
                                                details: 'Lead was created.',
                                                by: currentUser.id,
                                            }]
                                        };
                                        const created = await createLead(newLeadData as Omit<Lead, 'id'|'createdAt'|'company'|'companyId'>, currentUser.companyId);
                                        setAllLeads(prev => [...prev, created]);
                                        addToast("Lead created successfully!", "success");
                                    } else {
                                        const oldLead = allLeads.find(l => l.id === leadData.id);
                                        if (!oldLead) throw new Error("Could not find original lead to update.");
                                        const newLogs = generateLeadActivityLog(oldLead, leadData, currentUser.id);
                                        const updatedLeadData = {
                                            ...leadData,
                                            lastUpdatedAt: new Date().toISOString(),
                                            activityLog: [...(oldLead.activityLog || []), ...newLogs]
                                        };
                                        const updated = await updateLead(updatedLeadData as Lead);
                                        setAllLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
                                        addToast("Lead updated successfully!", "success");
                                    }
                                } catch (error) {
                                    addToast(`Error saving lead: ${(error as Error).message}`, "error");
                                } finally {
                                    setIsLeadModalOpen(false);
                                }
                            }}
                            addToast={addToast}
                            currentUser={currentUser}
                            users={companyUsers}
                            leadSources={leadSources}
                            finrootsBranches={companyBranches}
                            insuranceTypes={insuranceTypes}
                            allMembers={companyMembers}
                            onCreateReferrer={handleCreateReferrer}
                        />
                    )}
                    {isAnnualReviewModalOpen && (
                        <AnnualReviewModal
                            isOpen={isAnnualReviewModalOpen}
                            onClose={() => setIsAnnualReviewModalOpen(false)}
                            member={editingMember}
                            isLoading={isGeneratingReview}
                            reviewContent={reviewContent}
                            setReviewContent={setReviewContent}
                            addToast={addToast}
                        />
                    )}
                    {isProposalModalOpen && proposalContext && currentUser && (
                        <ProposalGeneratorModal
                            isOpen={isProposalModalOpen}
                            onClose={() => setIsProposalModalOpen(false)}
                            member={proposalContext.member}
                            policy={proposalContext.policy}
                            advisorName={currentUser.name}
                            templates={docTemplates}
                            onSave={handleSaveMember}
                            addToast={addToast}
                        />
                    )}
                    {isConversationalCreatorOpen && (
                        <ConversationalCreatorModal
                            isOpen={isConversationalCreatorOpen}
                            onClose={() => setIsConversationalCreatorOpen(false)}
                            onComplete={handleCreateWithConversation}
                            addToast={addToast}
                        />
                    )}
                    {isDuplicateModalOpen && (
                        <DuplicateMemberModal
                            isOpen={isDuplicateModalOpen}
                            onClose={() => setIsDuplicateModalOpen(false)}
                            duplicates={duplicateMatches}
                            pendingMember={pendingDuplicateMember}
                            onCreateNew={handleCreateAnyway}
                            onUpdateExisting={handleUpdateExistingDuplicate}
                            addToast={addToast}
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default App;
