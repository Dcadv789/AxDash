import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Target, TrendingUp, Users, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetasCardsProps {
  data: {
    totalMetas: number;
    totalMetasAnterior: number;
    totalVendas: number;
    totalVendasAnterior: number;
    percentualAtingimento: number;
    percentualAtingimentoAnterior: number;
    quantidadeVendedores: number;
    quantidadeVendedoresAnterior: number;
  };
}

const MetasCards: React.FC<MetasCardsProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const calculateVariation = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const cardData = [
    {
      title: "Total de Metas",
      icon: Target,
      currentValue: data.totalMetas,
      previousValue: data.totalMetasAnterior,
      variation: calculateVariation(data.totalMetas, data.totalMetasAnterior),
      isCurrency: true
    },
    {
      title: "Total de Vendas",
      icon: TrendingUp,
      currentValue: data.totalVendas,
      previousValue: data.totalVendasAnterior,
      variation: calculateVariation(data.totalVendas, data.totalVendasAnterior),
      isCurrency: true
    },
    {
      title: "% Atingimento",
      icon: Award,
      currentValue: data.percentualAtingimento,
      previousValue: data.percentualAtingimentoAnterior,
      variation: data.percentualAtingimento - data.percentualAtingimentoAnterior,
      isPercentage: true
    },
    {
      title: "Vendedores com Meta",
      icon: Users,
      currentValue: data.quantidadeVendedores,
      previousValue: data.quantidadeVendedoresAnterior,
      variation: calculateVariation(data.quantidadeVendedores, data.quantidadeVendedoresAnterior),
      isNumber: true
    }
  ];

  return (
    <>
      {cardData.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.currentValue >= 0;
        const variationIsPositive = card.variation >= 0;
        const ArrowIcon = variationIsPositive ? ArrowUpRight : ArrowDownRight;

        return (
          <div key={index} className={`rounded-xl p-5 relative overflow-hidden transition-all duration-200 h-[140px]
            ${isDark ? 'bg-[#151515] hover:bg-gray-800/50' : 'bg-white hover:bg-gray-50'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-indigo-600" />
            
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
                <Icon className={`h-5 w-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {card.title}
              </h3>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className={`text-2xl font-bold ${
                  card.title === '% Atingimento' 
                    ? card.currentValue >= 100 ? 'text-green-500' : 'text-orange-500'
                    : isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {card.isNumber 
                    ? card.currentValue.toLocaleString('pt-BR')
                    : card.isPercentage
                      ? formatPercentage(card.currentValue)
                      : formatCurrency(card.currentValue)
                  }
                </p>
                {card.previousValue !== undefined && (
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Anterior: {card.isNumber 
                      ? card.previousValue.toLocaleString('pt-BR')
                      : card.isPercentage
                        ? formatPercentage(card.previousValue)
                        : formatCurrency(card.previousValue)
                    }
                  </p>
                )}
              </div>
              {card.previousValue !== undefined && card.variation !== 0 && (
                <div className="flex flex-col items-end">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
                    ${variationIsPositive 
                      ? 'text-green-500 bg-green-500/10' 
                      : 'text-red-500 bg-red-500/10'}`}>
                    <ArrowIcon className="h-4 w-4" />
                    <span>
                      {card.isPercentage 
                        ? `${Math.abs(card.variation).toFixed(1)} p.p.`
                        : `${Math.abs(card.variation).toFixed(2)}%`
                      }
                    </span>
                  </div>
                  <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    vs. mês anterior
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default MetasCards;