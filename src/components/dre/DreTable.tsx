import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface DreConta {
  id: string;
  nome: string;
  simbolo: string;
  ordem: number;
  conta_pai?: string;
  children?: DreConta[];
  valor: number;
  valores_mensais: number[];
  expanded?: boolean;
}

interface DreTableProps {
  contas: DreConta[];
  meses: string[];
  showVariation: boolean;
  showFullPeriod: boolean;
  expandedContas: Set<string>;
  onToggleConta: (contaId: string) => void;
}

const DreTable: React.FC<DreTableProps> = ({
  contas,
  meses,
  showVariation,
  showFullPeriod,
  expandedContas,
  onToggleConta
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(Math.abs(value)).replace('R$', '').trim();
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  };

  const calcularTotal = (valores: number[]) => {
    const numMeses = showFullPeriod ? 12 : 6;
    return valores.slice(0, numMeses).reduce((acc, valor) => acc + valor, 0);
  };

  const renderConta = (conta: DreConta, level: number = 0) => {
    const hasChildren = conta.children && conta.children.length > 0;
    const isExpanded = expandedContas.has(conta.id);
    const paddingLeft = `${level * 1.5 + 1.5}rem`;
    const total = calcularTotal(conta.valores_mensais);

    return (
      <React.Fragment key={conta.id}>
        <tr className={`
          ${isDark 
            ? hasChildren ? 'bg-gray-800/30 hover:bg-gray-800/50' : 'hover:bg-gray-800/30'
            : hasChildren ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
          }
        `}>
          <td className={`sticky left-0 z-10 px-4 py-2 whitespace-nowrap border-r ${
            isDark 
              ? 'border-gray-700 bg-[#151515]' 
              : 'border-gray-200 bg-white'
          }`} style={{ paddingLeft }}>
            <div className="flex items-center gap-1.5">
              {hasChildren && (
                <button
                  onClick={() => onToggleConta(conta.id)}
                  className={`p-0.5 rounded transition-colors ${
                    isDark
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {conta.simbolo}
              </span>
              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} ${hasChildren ? 'font-medium' : ''}`}>
                {conta.nome}
              </span>
            </div>
          </td>
          {conta.valores_mensais.slice(0, meses.length).reverse().map((valor, index) => {
            const mesAnterior = index < conta.valores_mensais.length - 1 ? conta.valores_mensais[conta.valores_mensais.length - index - 2] : 0;
            const variacao = calcularVariacao(valor, mesAnterior);

            return (
              <React.Fragment key={index}>
                <td className={`px-1.5 py-2 text-center whitespace-nowrap text-sm font-medium
                  ${valor >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  <div className="inline-block min-w-[60px]">
                    {formatCurrency(valor)}
                  </div>
                </td>
                {showVariation && (
                  <td className={`pl-0.5 pr-2 py-2 text-center whitespace-nowrap text-xs font-medium border-r
                    ${isDark ? 'border-gray-700/30' : 'border-gray-200/30'}
                    ${variacao >= 0 ? 'text-green-500/70' : 'text-red-500/70'}`}
                  >
                    {formatPercentage(variacao)}
                  </td>
                )}
              </React.Fragment>
            );
          })}
          <td className={`px-1.5 py-2 text-center whitespace-nowrap text-sm font-medium border-l ${isDark ? 'border-gray-700' : 'border-gray-200'}
            ${total >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            <div className="inline-block min-w-[60px]">
              {formatCurrency(total)}
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && conta.children?.map(child => renderConta(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="h-full relative">
      <div className="absolute inset-0 overflow-auto custom-scrollbar mx-3">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
              <th className={`sticky left-0 z-20 px-4 py-2 text-left text-xs font-medium border-r
                ${isDark 
                  ? 'bg-[#151515] text-gray-400 border-gray-700' 
                  : 'bg-white text-gray-500 border-gray-200'
                } uppercase tracking-wider min-w-[280px] max-w-[280px]`}>
                Conta
              </th>
              {meses.map((mes, index) => (
                <React.Fragment key={index}>
                  <th className={`px-1.5 py-2 text-center text-xs font-medium
                    ${isDark ? 'text-gray-400' : 'text-gray-500'} 
                    uppercase tracking-wider min-w-[80px]`}>
                    {mes}
                  </th>
                  {showVariation && (
                    <th className={`pl-0.5 pr-2 py-2 text-center text-xs font-medium border-r
                      ${isDark ? 'text-gray-400 border-gray-700/30' : 'text-gray-500 border-gray-200/30'} 
                      uppercase tracking-wider min-w-[50px]`}>
                      Var.%
                    </th>
                  )}
                </React.Fragment>
              ))}
              <th className={`px-1.5 py-2 text-center text-xs font-medium border-l
                ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'} 
                uppercase tracking-wider min-w-[80px]`}>
                Total {showFullPeriod ? '12M' : '6M'}
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {contas.map(conta => renderConta(conta))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DreTable;