import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useTheme } from '../../context/ThemeContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, isSidebarCollapsed } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex justify-center ${theme === 'dark' ? 'bg-[#000000]' : 'bg-gray-100'}`}>
      <div className="max-w-[1920px] w-full px-6">
        <div className="flex relative pt-6">
          <Sidebar />
          
          <div className={`flex-grow transition-all duration-300 ${isSidebarCollapsed ? 'ml-28' : 'ml-64'} pt-[2px]`}>
            <Topbar />
            
            <main className="mt-4">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;