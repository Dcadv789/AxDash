import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ListItem {
  titulo: string;
  valor: number;
  tipo: string;
  variacao?: number;
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
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar max-h-[211px]">
        {items.length === 0 ? (
          <div className={`flex items-center justify-center h-32 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhum item para exibir
          </div>
        ) : (
          items.map((item, index) => (
            <div 
              key={index}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors
                ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {index + 1}
              </div>
              
              <span className={`flex-1 font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.titulo}
              </span>

              <span className={`font-semibold whitespace-nowrap ${
                item.tipo === 'Receita'
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {formatCurrency(item.valor)}
              </span>

              {item.variacao !== undefined && (
                <div className={`flex items-center ${
                  item.variacao >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {item.variacao >= 0 
                    ? <TrendingUp className="h-4 w-4" />
                    : <TrendingDown className="h-4 w-4" />
                  }
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardList;