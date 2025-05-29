import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Logo from './sidebar/Logo';
import DateTime from './sidebar/DateTime';
import Navigation from './sidebar/Navigation';
import Footer from './sidebar/Footer';
import { useTheme } from '../../context/ThemeContext';

const Sidebar: React.FC = () => {
  const { theme, isSidebarCollapsed, toggleSidebar } = useTheme();
  const isDark = theme === 'dark';

  return (
    <aside className={`fixed top-6 bottom-6 rounded-2xl flex flex-col z-10 transition-all duration-300 ease-in-out
      ${isDark ? 'bg-[#151515]' : 'bg-white'}
      ${isSidebarCollapsed ? 'w-24' : 'w-60'}`}>
      <button
        onClick={toggleSidebar}
        className={`absolute -right-3 top-[6.5rem] w-6 h-6 rounded-full 
          flex items-center justify-center transition-all duration-300
          ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>
      <Logo collapsed={isSidebarCollapsed} />
      {!isSidebarCollapsed && <DateTime />}
      <Navigation collapsed={isSidebarCollapsed} />
      <Footer collapsed={isSidebarCollapsed} />
    </aside>
  );
};

export default Sidebar;