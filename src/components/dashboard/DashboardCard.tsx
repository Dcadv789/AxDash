import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ArrowUpRight, ArrowDownRight, DivideIcon as LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  currentValue: number;
  previousValue?: number;
  variation?: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon: Icon,
  currentValue,
  previousValue,
  variation
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isPositive = variation && variation > 0;
  const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`rounded-xl p-5 relative overflow-hidden transition-all duration-200 h-[140px]
      ${isDark ? 'bg-[#151515] hover:bg-gray-800/50' : 'bg-white hover:bg-gray-50'}`}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-indigo-600" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
          <Icon className={`h-5 w-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
        <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {title}
        </h3>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(currentValue)}
          </p>
          {previousValue !== undefined && (
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Anterior: {formatCurrency(previousValue)}
            </p>
          )}
        </div>
        {variation !== undefined && variation !== 0 && (
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
              ${isPositive 
                ? 'text-green-500 bg-green-500/10' 
                : 'text-red-500 bg-red-500/10'}`}>
              <ArrowIcon className="h-4 w-4" />
              <span>{Math.abs(variation).toFixed(1)}%</span>
            </div>
            <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              vs. mês anterior
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardCard;