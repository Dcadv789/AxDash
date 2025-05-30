import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

interface ListItem {
  titulo: string;
  valor: number;
  tipo: string;
}

interface DashboardListProps {
  title: string;
  items?: ListItem[];
}

const DashboardList: React.FC<DashboardListProps> = ({ title, items = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {items.map((item, index) => (
          <div 
            key={index}
            className={`flex items-center justify-between p-4 rounded-lg transition-colors
              ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                ${item.tipo === 'Receita'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
                }`}>
                {item.tipo === 'Receita' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                {item.titulo}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                item.tipo === 'Receita'
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {formatCurrency(item.valor)}
              </span>
              <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardList;