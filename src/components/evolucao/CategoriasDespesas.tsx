import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  valor_atual: number;
  valor_anterior: number;
  variacao: number;
}

interface CategoriasDespesasProps {
  categorias: Categoria[];
  loading: boolean;
}

const CategoriasDespesas: React.FC<CategoriasDespesasProps> = ({ categorias, loading }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-6 w-48 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-12 rounded ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-14.5rem)] rounded-xl ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Categorias de Despesas
        </h2>
      </div>
      
      <div className="overflow-auto custom-scrollbar h-[calc(100%-5.5rem)] px-1">
        <table className="w-full">
          <thead className={`sticky top-0 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <th className={`px-4 py-3 text-left text-xs font-medium tracking-wider
                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                #
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium tracking-wider
                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Categoria
              </th>
              <th className={`px-4 py-3 text-right text-xs font-medium tracking-wider
                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Mês Anterior
              </th>
              <th className={`px-4 py-3 text-right text-xs font-medium tracking-wider
                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Mês Atual
              </th>
              <th className={`px-4 py-3 text-right text-xs font-medium tracking-wider
                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Variação
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {categorias.map((categoria, index) => (
              <tr key={categoria.id} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {index + 1}
                </td>
                <td className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {categoria.nome}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatCurrency(categoria.valor_anterior)}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatCurrency(categoria.valor_atual)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className={`flex items-center justify-end gap-1
                    ${categoria.variacao > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {categoria.variacao > 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(categoria.variacao).toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriasDespesas;