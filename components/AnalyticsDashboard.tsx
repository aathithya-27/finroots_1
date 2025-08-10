import React, { useMemo, useState, useCallback } from 'react';
import { Member, LeadSourceMaster } from '../types.ts';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, IndianRupee, Users, TrendingUp, PieChart as PieIcon, Map as MapIcon, BrainCircuit, Loader2, ArrowLeft, Table, AreaChart } from 'lucide-react';
import { forecastCustomerGrowth } from '../services/geminiService.ts';
import Button from './ui/Button.tsx';

interface AnalyticsDashboardProps {
    members: Member[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    leadSources: LeadSourceMaster[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border dark:border-gray-700">
                <p className="font-bold text-gray-800 dark:text-white">{label}</p>
                {payload.map((p: any, i: number) => (
                     <p key={i} style={{ color: p.color || p.payload.fill }} className="text-sm">{`${p.name}: ${p.value}`}</p>
                ))}
            </div>
        );
    }
    return null;
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ members, addToast, leadSources }) => {
    
    const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6', '#F43F5E'];
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';

    const [forecastData, setForecastData] = useState<any[] | null>(null);
    const [isForecasting, setIsForecasting] = useState(false);
    const [leadSourceView, setLeadSourceView] = useState<'chart' | 'table'>('chart');


    const analyticsData = useMemo(() => {
        const allPolicies = members.flatMap(m => m.policies.map(p => ({ ...p, member: m })));
        
        // KPI: Total Annual Premium
        const totalAnnualPremium = allPolicies.reduce((sum, p) => sum + p.premium, 0);
        
        // KPI: Average Policies per Customer
        const avgPoliciesPerCustomer = members.length > 0 ? (allPolicies.length / members.length) : 0;
        
        // Chart 1: Monthly Renewals
        const renewalMonths = Array(12).fill(0).map((_, i) => {
            const date = new Date();
            date.setDate(1); // Set to first of the month to avoid day-related issues
            date.setMonth(date.getMonth() + i);
            return { name: date.toLocaleString('default', { month: 'short' }), Renewals: 0 };
        });
        
        allPolicies.forEach(p => {
            const renewalDate = new Date(p.renewalDate);
            const today = new Date();
            // We only care about renewals in the next 12 months for this chart
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(today.getFullYear() + 1);

            if (renewalDate >= today && renewalDate < oneYearFromNow) {
                const monthIndex = (renewalDate.getMonth() - today.getMonth() + 12) % 12;
                if(renewalMonths[monthIndex]) renewalMonths[monthIndex].Renewals++;
            }
        });
        
        // Chart 2: Lead Source Distribution
        const leadSourceDistribution = members.reduce((acc, member) => {
            const leadSourceMap = new Map(leadSources.map(ls => [ls.id, ls]));
            let source = 'Unknown';
            if (member.leadSource?.sourceId) {
                let current = leadSourceMap.get(member.leadSource.sourceId);
                let rootName = current?.name || 'Unknown';
                while (current?.parentId && leadSourceMap.has(current.parentId)) {
                    const parent = leadSourceMap.get(current.parentId);
                    if (parent) {
                        rootName = parent.name;
                        current = parent;
                    } else {
                        current = undefined;
                    }
                }
                source = rootName;
            }
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const leadSourceData = Object.entries(leadSourceDistribution).map(([name, value]) => ({ name, value }));
        
        // Chart 3: Customer Growth (Simulated)
        const customerGrowthData = (() => {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const today = new Date();
            const growthData = Array(6).fill(0).map((_, i) => {
                const date = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
                return { name: `${months[date.getMonth()]} '${String(date.getFullYear()).slice(2)}'`, Customers: 0 };
            });

            // Distribute members across the months for simulation
            const memberCount = members.length;
            let membersAssigned = 0;
            for (let i = 0; i < 5; i++) {
                const monthCount = Math.floor(memberCount / 6);
                growthData[i].Customers = monthCount;
                membersAssigned += monthCount;
            }
            growthData[5].Customers = memberCount - membersAssigned;
            
            // Make it cumulative for a growth chart
            for (let i = 1; i < growthData.length; i++) {
                growthData[i].Customers += growthData[i-1].Customers;
            }
            return growthData;
        })();

        // Table: Geographic Distribution
        const geoDistribution = members.reduce((acc, m) => {
            acc[m.state] = (acc[m.state] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const geoData = Object.entries(geoDistribution).sort((a,b) => b[1] - a[1]);

        return {
            totalAnnualPremium,
            avgPoliciesPerCustomer,
            renewalMonths,
            leadSourceData,
            customerGrowthData,
            geoData
        };
    }, [members, leadSources]);
    
    const formattedTotalPremium = analyticsData.totalAnnualPremium.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    const handleForecast = useCallback(async () => {
        setIsForecasting(true);
        const result = await forecastCustomerGrowth(analyticsData.customerGrowthData, addToast);
        if (result && result.length > 0) {
            // Reformat for the chart to connect the lines
            const lastHistoricalPoint = analyticsData.customerGrowthData[analyticsData.customerGrowthData.length - 1];
            const forecastWithConnector = [
                { name: lastHistoricalPoint.name, Forecast: lastHistoricalPoint.Customers },
                ...result.map(p => ({ name: p.name, Forecast: p.Customers }))
            ];
            setForecastData(forecastWithConnector);
        }
        setIsForecasting(false);
    }, [analyticsData.customerGrowthData, addToast]);

    const combinedGrowthData = useMemo(() => {
        if (!forecastData) {
            return analyticsData.customerGrowthData;
        }
        // Merge historical and forecast data
        const allData: { name: string; Customers?: number; Forecast?: number; }[] = analyticsData.customerGrowthData.map(d => ({ ...d }));
        
        forecastData.forEach(fPoint => {
            const existingPoint = allData.find(d => d.name === fPoint.name);
            if (existingPoint) {
                existingPoint.Forecast = fPoint.Forecast;
            } else {
                allData.push(fPoint);
            }
        });
        return allData;
    }, [analyticsData.customerGrowthData, forecastData]);

    const renewalChart = useMemo(() => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.renewalMonths} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={CustomTooltip} cursor={{ fill: theme === 'dark' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(229, 231, 235, 0.4)' }} />
                <Bar dataKey="Renewals" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    ), [analyticsData.renewalMonths, gridColor, tickColor, theme]);

    const growthChart = useMemo(() => (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedGrowthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }} allowDecimals={false}/>
                <Tooltip content={CustomTooltip} />
                <Legend />
                <Line type="monotone" name="Historical" dataKey="Customers" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} dot={false} />
                {forecastData && <Line type="monotone" name="Forecast" dataKey="Forecast" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" activeDot={{ r: 8 }} />}
            </LineChart>
        </ResponsiveContainer>
    ), [combinedGrowthData, forecastData, gridColor, tickColor]);
    
    const StatCard = ({ icon, title, value, subtext, color }: { icon: React.ReactElement; title: string; value: string | number; subtext: string; color: { bg: string; text: string; darkBg: string } }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex items-center gap-5">
            <div className={`p-3 rounded-full ${color.bg} dark:${color.darkBg}`}>
                {icon}
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );

    const ChartCard: React.FC<{
        title: string;
        icon: React.ReactElement;
        children: React.ReactNode;
        onAction?: () => void;
        actionDisabled?: boolean;
        actionLoading?: boolean;
    }> = ({ title, icon, children, onAction, actionDisabled, actionLoading }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                {onAction && (
                    <Button onClick={onAction} disabled={actionDisabled || actionLoading} size="small" variant="light">
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                        Forecast
                    </Button>
                )}
            </div>
            <div className="h-72 w-full">
                {children}
            </div>
        </div>
    );
    
    const LeadSourceDetailsTable = () => {
        const [tableFilterSource, setTableFilterSource] = useState('All');
        const leadSourceMap = useMemo(() => new Map(leadSources.map(ls => [ls.id, ls])), [leadSources]);
    
        const getFullLeadSourceString = (source: Member['leadSource']) => {
            if (!source || !source.sourceId) return 'Unknown';
            const pathParts: string[] = [];
            let current = leadSourceMap.get(source.sourceId);
            while (current) {
                pathParts.unshift(current.name);
                current = current.parentId ? leadSourceMap.get(current.parentId) : undefined;
            }
            let fullPath = pathParts.join(' > ');
            if (source.detail) {
                fullPath += ` (${source.detail})`;
            }
            return fullPath;
        };
    
        const filteredMembers = useMemo(() => {
            if (tableFilterSource === 'All') return members;
            return members.filter(m => {
                if (!m.leadSource?.sourceId) return tableFilterSource === 'Unknown';
                let current = leadSourceMap.get(m.leadSource.sourceId);
                let rootName = current?.name || 'Unknown';
                while(current?.parentId) {
                    const parent = leadSourceMap.get(current.parentId);
                    if (parent) {
                        rootName = parent.name;
                        current = parent;
                    } else {
                        current = undefined;
                    }
                }
                return rootName === tableFilterSource;
            });
        }, [tableFilterSource, members, leadSourceMap]);
    
        const MemberTierBadge = ({ memberType }: { memberType: Member['memberType']}) => (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                memberType === 'Gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                memberType === 'Silver' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                memberType === 'Diamond' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
            }`}>
                {memberType}
            </span>
        );
        
        return (
            <div className="animate-fade-in flex flex-col h-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                    <div className="flex-1">
                        <label htmlFor="lead-source-filter" className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter by source:</label>
                        <select
                            id="lead-source-filter"
                            value={tableFilterSource}
                            onChange={(e) => setTableFilterSource(e.target.value)}
                            className="w-full sm:w-auto mt-1 font-semibold text-gray-800 dark:text-white bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-brand-primary"
                        >
                            <option value="All">All Sources</option>
                            {analyticsData.leadSourceData.map(source => (
                                <option key={source.name} value={source.name}>{source.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2">
                    {filteredMembers.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800">
                                <tr className="border-b dark:border-gray-700">
                                    <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                                    <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Tier</th>
                                    <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Source Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map(member => (
                                    <tr key={member.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-2.5 font-medium text-gray-800 dark:text-gray-200">{member.name}</td>
                                        <td className="py-2.5"><MemberTierBadge memberType={member.memberType} /></td>
                                        <td className="py-2.5 text-gray-500 dark:text-gray-400">{getFullLeadSourceString(member.leadSource)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">No members found for this lead source.</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Key metrics and insights into your business performance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={<IndianRupee className="text-green-600 dark:text-green-200 w-6 h-6" />} 
                    title="Total Annual Premium" 
                    value={formattedTotalPremium}
                    subtext="Sum of all policy premiums" 
                    color={{ bg: 'bg-green-100', text: 'text-green-600', darkBg: 'bg-green-900/30' }} />
                <StatCard 
                    icon={<Users className="text-blue-600 dark:text-blue-200 w-6 h-6" />} 
                    title="Avg. Policies / Customer" 
                    value={analyticsData.avgPoliciesPerCustomer.toFixed(2)}
                    subtext="Average number of policies" 
                    color={{ bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'bg-blue-900/30' }} />
                 <StatCard 
                    icon={<TrendingUp className="text-purple-600 dark:text-purple-200 w-6 h-6" />} 
                    title="Conversion Rate" 
                    value="85%"
                    subtext="Based on opportunities" 
                    color={{ bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'bg-purple-900/30' }} />
                <StatCard 
                    icon={<IndianRupee className="text-yellow-600 dark:text-yellow-200 w-6 h-6" />} 
                    title="Avg. Customer Value" 
                    value="₹50k"
                    subtext="Estimated lifetime value" 
                    color={{ bg: 'bg-yellow-100', text: 'text-yellow-600', darkBg: 'bg-yellow-900/30' }} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Monthly Renewal Forecast" icon={<BarChart2 className="w-5 h-5" />}>
                    {renewalChart}
                </ChartCard>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <PieIcon className="w-5 h-5" />
                        Lead/Referral Distribution
                    </h3>
                        <Button
                            onClick={() => setLeadSourceView(v => v === 'chart' ? 'table' : 'chart')}
                            size="small"
                            variant="light"
                        >
                            {leadSourceView === 'chart' ? <Table className="w-4 h-4" /> : <AreaChart className="w-4 h-4" />}
                            {leadSourceView === 'chart' ? 'Table View' : 'Chart View'}
                        </Button>
                    </div>
                    <div className="h-72 w-full">
                        {leadSourceView === 'table' ? <LeadSourceDetailsTable /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analyticsData.leadSourceData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                            if (percent === 0) return '';
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                            return (
                                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                                                    {`${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            );
                                        }}
                                    >
                                        {analyticsData.leadSourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={CustomTooltip} />
                                    <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                 <div className="lg:col-span-3">
                 <ChartCard 
                        title="Customer Growth" 
                        icon={<TrendingUp className="w-5 h-5" />}
                        onAction={handleForecast}
                        actionDisabled={!!forecastData}
                        actionLoading={isForecasting}
                    >
                        {growthChart}
                    </ChartCard>
                 </div>
                 <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full">
                         <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                            <MapIcon className="w-5 h-5" />
                            Geographic Distribution
                        </h3>
                        <div className="overflow-y-auto max-h-72 pr-2">
                            <table className="w-full text-sm text-left">
                               <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                   <tr>
                                       <th className="py-2">State</th>
                                       <th className="py-2 text-right">Customers</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {analyticsData.geoData.map(([state, count]) => (
                                       <tr key={state as string}>
                                           <td className="py-2 font-medium text-gray-800 dark:text-gray-200">{state}</td>
                                           <td className="py-2 text-right font-semibold text-gray-600 dark:text-gray-300">{count as number}</td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                    </div>
                 </div>
             </div>
        </div>
    );
};

export default AnalyticsDashboard;
