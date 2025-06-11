import React from 'react';
import { Home, LineChart, ShoppingCart, TrendingUp, FileText, BarChart, Table, Calculator, Settings, Receipt } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useUser } from '../../../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
  collapsed: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ collapsed }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart, path: '/vendas' },
    { id: 'analise', label: 'Análise', icon: LineChart, path: '/analise' },
    { id: 'analise-vendas', label: 'Análise de Vendas', icon: TrendingUp, path: '/analise-vendas' },
    { id: 'despesas-vendas', label: 'Desp. de Vendas', icon: Receipt, path: '/despesas-vendas' },
    { id: 'graficos', label: 'Gráficos', icon: BarChart, path: '/graficos' },
    { id: 'evolucao', label: 'Evolução Mensal', icon: Table, path: '/evolucao' },
    { id: 'dre', label: 'DRE', icon: Calculator, path: '/dre' },
    { id: 'cadastros', label: 'Cadastros', icon: FileText, path: '/cadastros' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/configuracoes' }
  ];

  // Filtra os itens do menu baseado nas rotas permitidas do usuário
  const filteredMenuItems = menuItems.filter(item => {
    // Se o usuário for master, mostra todas as rotas
    if (user?.role === 'master') return true;
    // Se não tiver rotas_permitidas definido, não mostra nada
    if (!user?.rotas_permitidas) return false;
    // Mostra apenas as rotas permitidas
    return user.rotas_permitidas.includes(item.id);
  });

  return (
    <nav className="flex-grow p-4">
      <div className="space-y-2">
        {filteredMenuItems.map(({ id, label, icon: Icon, path }) => (
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