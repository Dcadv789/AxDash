import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface IndicadorDataItem {
  vendedor: string;
  totalDespesas: number;
  totalVendas: number;
  percentual: number;
  percentualAnterior: number;
  status: 'acima' | 'abaixo' | 'igual';
  statusAnterior: 'acima' | 'abaixo' | 'igual';
}

interface IndicadorEficienciaProps {
  data: IndicadorDataItem[];
}

const IndicadorEficiencia: React.FC<IndicadorEficienciaProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const META_PERCENTUAL = 10; // Meta de 10%

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acima':
        return 'text-red-500';
      case 'abaixo':
        return 'text-green-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'acima':
        return 'bg-red-500/10 border-red-500/20';
      case 'abaixo':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return 'bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'acima':
        return 'Acima da Meta';
      case 'abaixo':
        return 'Dentro da Meta';
      default:
        return 'Na Meta';
    }
  };

  // Calcula variação em pontos percentuais em relação à meta
  const calculateVariationFromMeta = (percentual: number) => {
    return percentual - META_PERCENTUAL;
  };

  return (
    <div className={`rounded-xl p-6 h-full flex flex-col ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Eficiência vs Meta
      </h3>
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3 custom-scrollbar max-h-[280px]">
        {data.length === 0 ? (
          <div className={`flex items-center justify-center h-32 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhum dado disponível para vendedores ativos
          </div>
        ) : (
          data.map((item, index) => {
            const variationFromMeta = calculateVariationFromMeta(item.percentual);
            const isAboveMeta = item.percentual > META_PERCENTUAL;

            return (
              <div 
                key={index}
                className={`p-3 rounded-lg border transition-colors
                  ${getStatusBgColor(item.status)}
                  ${isDark ? 'hover:bg-opacity-20' : 'hover:bg-opacity-30'}`}
              >
                {/* Nome do Vendedor */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`} title={item.vendedor}>
                    {item.vendedor}
                  </h4>
                  <div className="flex items-center gap-1">
                    {isAboveMeta ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                
                {/* Valor Atual */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Atual:
                  </span>
                  <span className={`text-lg font-bold ${getStatusColor(item.status)}`}>
                    {formatPercentage(item.percentual)}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Meta:
                  </span>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-blue-500" />
                    <span className={`text-xs font-medium text-blue-500`}>
                      {formatPercentage(META_PERCENTUAL)}
                    </span>
                  </div>
                </div>

                {/* Variação em relação à meta */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Variação:
                  </span>
                  <span className={`text-xs font-medium ${
                    variationFromMeta > 0 ? 'text-red-500' : variationFromMeta < 0 ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {variationFromMeta > 0 ? '+' : ''}{variationFromMeta.toFixed(1)} p.p.
                  </span>
                </div>

                {/* Status */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.status === 'acima' 
                        ? 'bg-red-500/20 text-red-500' 
                        : item.status === 'abaixo'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default IndicadorEficiencia;