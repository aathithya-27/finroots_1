import React, { useRef, useEffect, useMemo } from 'react';
import {
    Shield, User, Users, MapPin, LayoutDashboard, FileText, LogOut, BarChart2, NotebookText,
    X, MessageSquare, Percent, Briefcase, Zap, UserPlus, Gift, TrendingUp, CalendarClock, Database, Wrench, ListTodo
} from 'lucide-react';
import { Tab, RolePermissions } from '../types.ts';
import { User as UserType } from '../types.ts';

interface NavLinkProps {
    tab: Tab;
    label: string;
    icon: React.ReactNode;
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    closeSidebar?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ tab, label, icon, activeTab, setActiveTab, closeSidebar }) => (
    <button
        onClick={() => {
            setActiveTab(tab);
            if(closeSidebar) closeSidebar();
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${
            activeTab === tab
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
    >
        {icon}
        {label}
    </button>
);

interface SidebarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
    user: UserType | null;
    rolePermissions: RolePermissions[];
}

interface NavItem {
    tab: Tab;
    label: string;
    icon: React.ReactNode;
    adminOnly: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
    { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, adminOnly: false },
    { tab: 'reports & insights', label: 'Reports & Insights', icon: <BarChart2 size={20}/>, adminOnly: false },
    { tab: 'advisors', label: 'Advisor Management', icon: <UserPlus size={20}/>, adminOnly: true },
    { tab: 'pipeline', label: 'Lead Management', icon: <Briefcase size={20}/>, adminOnly: false },
    { tab: 'customers', label: 'Customers', icon: <Users size={20}/>, adminOnly: false },
    { tab: 'taskManagement', label: 'Task Management', icon: <ListTodo size={20}/>, adminOnly: false },
    { tab: 'policies', label: 'Policies', icon: <FileText size={20}/>, adminOnly: false },
    { tab: 'notes', label: 'Notes', icon: <NotebookText size={20}/>, adminOnly: false },
    { tab: 'actionHub', label: 'Action Hub', icon: <Zap size={20}/>, adminOnly: false },
    { tab: 'servicesHub', label: 'Services Hub', icon: <Wrench size={20}/>, adminOnly: false },
    { tab: 'location', label: 'Location Services', icon: <MapPin size={20}/>, adminOnly: false },
    { tab: 'chatbot', label: 'WhatsApp Bot', icon: <MessageSquare size={20}/>, adminOnly: false },
    { tab: 'masterMember', label: 'Master Data', icon: <Database size={20} />, adminOnly: true }
];


const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, onLogout, user, rolePermissions }) => {
    const sidebarRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
            setIsSidebarOpen(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [sidebarRef, setIsSidebarOpen]);

    const navItems = useMemo(() => {
        if (user?.role === 'Admin') {
            return ALL_NAV_ITEMS;
        }
        if (user?.role === 'Advisor') {
            const advisorPermissions = rolePermissions.find(p => p.role === 'Advisor');
            if (!advisorPermissions) {
                // Fallback to old behavior if permissions are not loaded
                return ALL_NAV_ITEMS.filter(item => !item.adminOnly);
            }
            return ALL_NAV_ITEMS.filter(item => {
                // Admins see everything, for advisors we check the permissions object
                if (item.adminOnly) return false;
                return advisorPermissions.permissions[item.tab] === true;
            });
        }
        return [];
    }, [user?.role, rolePermissions]);
    
    const handleLogoutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onLogout();
    };
    
    const handleProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSidebarOpen(false);
        setActiveTab('profile');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            setActiveTab('masterMember');
                            if(setIsSidebarOpen) setIsSidebarOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left group"
                        aria-label="Edit company profile"
                    >
                        <Shield className="text-brand-primary" size={28} />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-blue-400 transition-colors">
                            {user?.company}
                        </h1>
                    </button>
                     <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" aria-label="Close menu">
                      <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
            
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                {navItems.map(item => (
                    <NavLink key={item.tab} {...item} activeTab={activeTab} setActiveTab={setActiveTab} closeSidebar={() => setIsSidebarOpen(false)} />
                ))}
            </nav>

            {user && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleProfileClick}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${
                            activeTab === 'profile'
                                ? 'bg-brand-primary text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        <User size={20}/> My Profile
                    </button>
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 mt-1.5"
                    >
                        <LogOut size={20}/> Logout
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile Sidebar */}
             <div 
                className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={() => setIsSidebarOpen(false)}
                role="dialog" 
                aria-modal="true"
            >
                <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            </div>
             <div 
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform ease-in-out duration-300 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <SidebarContent />
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20">
                <SidebarContent />
            </aside>
        </>
    );
};

export default Sidebar;
