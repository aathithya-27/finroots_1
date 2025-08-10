import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="flex space-x-2 sm:space-x-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`inline-block px-2 sm:px-4 py-3 font-medium text-sm rounded-t-md focus:outline-none transition-colors duration-200 whitespace-nowrap
            ${
              activeTab === tab
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default Tabs;
