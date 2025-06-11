import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface TableDataItem {
  vendedor: string;
  combustivel: number;
  alimentacao: number;
  hospedagem: number;
  comissao: number;
  salario: number;
  outras_despesas: number;
  total: number;
}

interface DespesasTableProps {
  data: TableDataItem[];
}

const DespesasTable: React.FC<DespesasTableProps> = ({ data }) => {
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
        Despesas por Vendedor
      </h3>
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar max-h-[280px]">
        {data.length === 0 ? (
          <div className={`flex items-center justify-center h-32 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhuma despesa encontrada para vendedores ativos neste período
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
                    Combustível
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Alimentação
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Hospedagem
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Comissão
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Salário
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Outras
                  </th>
                  <th className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                    Total
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
                      {formatCurrency(item.combustivel)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatCurrency(item.alimentacao)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatCurrency(item.hospedagem)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatCurrency(item.comissao)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatCurrency(item.salario)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatCurrency(item.outras_despesas)}
                    </td>
                    <td className={`px-3 py-3 text-sm text-right font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      {formatCurrency(item.total)}
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

export default DespesasTable;