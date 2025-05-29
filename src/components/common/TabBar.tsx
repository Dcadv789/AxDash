import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`${className}`}>
      <nav className="inline-flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${activeTab === tab.id
                ? `${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'} shadow-sm`
                : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabBar;