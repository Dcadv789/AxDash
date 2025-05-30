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
    <div className={`rounded-xl p-6 h-full flex flex-col ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
        {items.map((item, index) => (
          <div 
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors
              ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                ${item.tipo === 'Receita'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
                }`}>
                {item.tipo === 'Receita' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              </div>
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-medium truncate`}>
                {item.titulo}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold whitespace-nowrap ${
                item.tipo === 'Receita'
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {formatCurrency(item.valor)}
              </span>
              <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardList;