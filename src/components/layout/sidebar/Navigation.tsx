import React from 'react';
import { Home, LayoutDashboard, FileText } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  collapsed: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ collapsed }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'cadastros', label: 'Cadastros', icon: FileText, path: '/cadastros' },
  ];

  return (
    <nav className="flex-grow p-4">
      <div className="space-y-2">
        {menuItems.map(({ id, label, icon: Icon, path }) => (
          <button 
            key={id}
            onClick={() => navigate(path)}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-lg transition-colors duration-200
              ${location.pathname === path
                ? `${isDark ? 'bg-indigo-600' : 'bg-indigo-500'} text-white`
                : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
            <Icon size={22} />
            {!collapsed && label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;