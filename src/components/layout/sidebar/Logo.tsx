import React from 'react';
import { Layers } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

interface LogoProps {
  collapsed: boolean;
}

const Logo: React.FC<LogoProps> = ({ collapsed }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`p-6 flex items-center justify-center gap-3 border-b transition-all duration-300
      ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <Layers size={28} className="text-indigo-500" />
      {!collapsed && (
        <span className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
          AppLogo
        </span>
      )}
    </div>
  );
};

export default Logo