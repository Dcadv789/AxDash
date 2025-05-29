import React from 'react';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '../../../context/ThemeContext';

interface FooterProps {
  collapsed: boolean;
}

const Footer: React.FC<FooterProps> = ({ collapsed }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-auto px-4 pb-4">
      <div className="flex flex-col items-center gap-4">
        <div className={`w-full flex items-center justify-center pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <ThemeToggle collapsed={collapsed} />
        </div>
        {collapsed ? (
          <div className="flex flex-col items-center justify-center w-full gap-1">
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {currentYear}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              © Axory
            </div>
          </div>
        ) : (
          <div className={`text-center text-sm w-full ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            © {currentYear} Axory
          </div>
        )}
      </div>
    </div>
  );
};

export default Footer;