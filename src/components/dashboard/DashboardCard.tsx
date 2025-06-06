import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ArrowUpRight, ArrowDownRight, DivideIcon as LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  currentValue: number;
  previousValue?: number;
  variation?: number;
  isPercentage?: boolean;
  isNumber?: boolean;
  ordem?: number;
  pagina?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon: Icon,
  currentValue,
  previousValue,
  variation,
  isPercentage,
  isNumber,
  ordem,
  pagina
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const calculatedVariation = variation ?? (previousValue !== undefined && previousValue !== 0
    ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100
    : (currentValue > 0 ? 100 : 0));

  const isPositive = currentValue >= 0;
  const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  const formatValue = (value: number) => {
    if (isNumber) {
      return value.toLocaleString('pt-BR');
    }
    if (isPercentage) {
      return `${value.toFixed(2)}%`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatVariation = () => {
    if (isPercentage && previousValue !== undefined) {
      // Para percentuais, mostra a diferença em pontos percentuais
      const pontosPercentuais = currentValue - previousValue;
      return `${Math.abs(pontosPercentuais).toFixed(2)} p.p.`;
    }
    return `${Math.abs(calculatedVariation).toFixed(2)}%`;
  };

  const getVariationDirection = () => {
    if (isPercentage && previousValue !== undefined) {
      return currentValue - previousValue >= 0;
    }
    
    // Lógica especial para card de ordem 2 na página home (despesas)
    if (pagina === 'home' && ordem === 2) {
      // Para despesas (valores negativos), inverte a lógica:
      // Se pagou menos (valor menos negativo), é uma redução (negativo)
      // Se pagou mais (valor mais negativo), é um aumento (positivo)
      if (previousValue !== undefined && previousValue < 0 && currentValue < 0) {
        // Ambos são negativos (despesas)
        // Se currentValue > previousValue (ex: -100 > -200), pagou menos, então é redução
        return currentValue < previousValue;
      }
    }
    
    return calculatedVariation >= 0;
  };

  const variationIsPositive = getVariationDirection();

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
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {formatValue(currentValue)}
          </p>
          {previousValue !== undefined && (
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Anterior: {formatValue(previousValue)}
            </p>
          )}
        </div>
        {previousValue !== undefined && calculatedVariation !== 0 && (
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
              ${variationIsPositive 
                ? 'text-green-500 bg-green-500/10' 
                : 'text-red-500 bg-red-500/10'}`}>
              {variationIsPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span>{formatVariation()}</span>
            </div>
            <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              vs. mês anterior
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;