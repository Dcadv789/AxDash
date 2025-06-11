import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Receipt, TrendingUp, Users, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DespesasCardsProps {
  data: {
    totalDespesas: number;
    totalDespesasAnterior: number;
    mediaDespesas: number;
    mediaDespesasAnterior: number;
    maiorDespesa: number;
    maiorDespesaAnterior: number;
    quantidadeVendedores: number;
    quantidadeVendedoresAnterior: number;
  };
}

const DespesasCards: React.FC<DespesasCardsProps> = ({ data }) => {
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

  const cardData = [
    {
      title: "Total de Despesas",
      icon: Receipt,
      currentValue: data.totalDespesas,
      previousValue: data.totalDespesasAnterior,
      variation: calculateVariation(data.totalDespesas, data.totalDespesasAnterior)
    },
    {
      title: "Média por Vendedor",
      icon: TrendingUp,
      currentValue: data.mediaDespesas,
      previousValue: data.mediaDespesasAnterior,
      variation: calculateVariation(data.mediaDespesas, data.mediaDespesasAnterior)
    },
    {
      title: "Maior Despesa",
      icon: Target,
      currentValue: data.maiorDespesa,
      previousValue: data.maiorDespesaAnterior,
      variation: calculateVariation(data.maiorDespesa, data.maiorDespesaAnterior)
    },
    {
      title: "Vendedores Ativos",
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
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {card.isNumber ? card.currentValue.toLocaleString('pt-BR') : formatCurrency(card.currentValue)}
                </p>
                {card.previousValue !== undefined && (
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Anterior: {card.isNumber ? card.previousValue.toLocaleString('pt-BR') : formatCurrency(card.previousValue)}
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
                    <span>{Math.abs(card.variation).toFixed(2)}%</span>
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

export default DespesasCards;