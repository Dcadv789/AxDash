import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Target, TrendingUp, Award } from 'lucide-react';

interface TableDataItem {
  vendedor: string;
  metaAtual: number;
  vendasAtuais: number;
  percentualAtingimento: number;
  metaAnterior: number;
  vendasAnteriores: number;
  metaProxima: number;
  status: 'atingiu' | 'nao_atingiu' | 'superou';
}

interface MetasTableProps {
  data: TableDataItem[];
}

const MetasTable: React.FC<MetasTableProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'superou':
        return 'text-green-500';
      case 'atingiu':
        return 'text-blue-500';
      case 'nao_atingiu':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'superou':
        return 'Superou';
      case 'atingiu':
        return 'Atingiu';
      case 'nao_atingiu':
        return 'Não Atingiu';
      default:
        return 'N/A';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'superou':
        return <Award className="h-4 w-4" />;
      case 'atingiu':
        return <Target className="h-4 w-4" />;
      case 'nao_atingiu':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-xl p-6 h-full flex flex-col ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Performance por Vendedor
      </h3>
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar max-h-[280px]">
        {data.length === 0 ? (
          <div className={`flex items-center justify-center h-32 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhuma meta encontrada para vendedores ativos neste período
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className={`border-b ${isDark ? 'border-gray-700 bg-[#151515]' : 'border-gray-200 bg-white'}`}>
                  <th className={`px-3 py-2 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Vendedor
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Meta Atual
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Vendas
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    % Atingimento
                  </th>
                  <th className={`px-3 py-2 text-center text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Próxima Meta
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {data.map((item, index) => (
                  <tr key={index} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                    <td className={`px-3 py-3 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.vendedor}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatCurrency(item.metaAtual)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right font-medium ${
                      item.vendasAtuais >= item.metaAtual ? 'text-green-500' : 'text-orange-500'
                    }`}>
                      {formatCurrency(item.vendasAtuais)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right font-medium ${
                      item.percentualAtingimento >= 100 
                        ? 'text-green-500' 
                        : item.percentualAtingimento >= 80 
                          ? 'text-orange-500' 
                          : 'text-red-500'
                    }`}>
                      {formatPercentage(item.percentualAtingimento)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </div>
                    </td>
                    <td className={`px-3 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.metaProxima > 0 ? formatCurrency(item.metaProxima) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetasTable;