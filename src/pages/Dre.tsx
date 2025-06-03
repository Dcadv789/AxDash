import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Building, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import EmpresaFilter from '../components/common/EmpresaFilter';
import DateFilter from '../components/common/DateFilter';
import { getDreData } from '../services/dreService';

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

const Dre: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [loading, setLoading] = useState(false);
  const [contas, setContas] = useState<DreConta[]>([]);
  const [expandedContas, setExpandedContas] = useState<Set<string>>(new Set());
  
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());

  React.useEffect(() => {
    const fetchData = async () => {
      if (!selectedEmpresa) {
        setContas([]);
        return;
      }

      setLoading(true);
      try {
        const data = await getDreData(selectedMonth, selectedYear);
        setContas(data);
      } catch (error) {
        console.error('Erro ao carregar DRE:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmpresa, selectedMonth, selectedYear]);

  const toggleConta = (contaId: string) => {
    setExpandedContas(prev => {
      const next = new Set(prev);
      if (next.has(contaId)) {
        next.delete(contaId);
      } else {
        next.add(contaId);
      }
      return next;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(Math.abs(value)).replace('R$', '').trim();
  };

  const renderNoEmpresaSelected = () => (
    <div className={`rounded-xl p-8 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
      <Building className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Selecione uma empresa
      </h2>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Para visualizar o DRE, selecione uma empresa no filtro acima
      </p>
    </div>
  );

  const renderConta = (conta: DreConta, level: number = 0) => {
    const hasChildren = conta.children && conta.children.length > 0;
    const isExpanded = expandedContas.has(conta.id);
    const paddingLeft = `${level * 1.5 + 1.5}rem`;

    return (
      <React.Fragment key={conta.id}>
        <tr className={`
          ${isDark 
            ? hasChildren ? 'bg-gray-800/30 hover:bg-gray-800/50' : 'hover:bg-gray-800/30'
            : hasChildren ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
          }
        `}>
          <td className={`sticky left-0 z-10 px-6 py-2 whitespace-nowrap border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-inherit`} style={{ paddingLeft }}>
            <div className="flex items-center gap-1.5">
              {hasChildren && (
                <button
                  onClick={() => toggleConta(conta.id)}
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
          {conta.valores_mensais.slice().reverse().map((valor, index) => (
            <td
              key={index}
              className={`px-3 py-2 text-center whitespace-nowrap text-sm font-medium
                ${valor >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              <div className="inline-block min-w-[60px]">
                {formatCurrency(valor)}
              </div>
            </td>
          ))}
        </tr>
        {hasChildren && isExpanded && conta.children?.map(child => renderConta(child, level + 1))}
      </React.Fragment>
    );
  };

  const getMeses = () => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const result = [];
    
    for (let i = 12; i >= 0; i--) {
      let mesAtual = selectedMonth - i;
      let anoAtual = selectedYear;
      while (mesAtual < 0) {
        mesAtual += 12;
        anoAtual--;
      }
      result.push(`${meses[mesAtual]}/${String(anoAtual).slice(-2)}`);
    }
    return result;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 flex items-center justify-between mb-3">
        <div>
          <h1 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            DRE
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Demonstração do Resultado do Exercício
          </p>
        </div>

        <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
          <EmpresaFilter
            value={selectedEmpresa}
            onChange={setSelectedEmpresa}
          />
          <DateFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>
      </div>

      <div className="px-6 flex-1 min-h-0">
        {!selectedEmpresa ? (
          renderNoEmpresaSelected()
        ) : loading ? (
          <div className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} flex items-center justify-center`}>
            <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
        ) : (
          <div className={`rounded-xl ${isDark ? 'bg-[#151515]' : 'bg-white'} h-full flex flex-col`}>
            <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                    <th className={`sticky left-0 z-20 px-6 py-2 text-left text-xs font-medium border-r
                      ${isDark 
                        ? 'bg-gray-800/50 text-gray-400 border-gray-700' 
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                      } uppercase tracking-wider min-w-[300px] max-w-[300px]`}>
                      Conta
                    </th>
                    {getMeses().map((mes, index) => (
                      <th key={index} className={`px-3 py-2 text-center text-xs font-medium 
                        ${isDark ? 'text-gray-400' : 'text-gray-500'} 
                        uppercase tracking-wider min-w-[100px]`}>
                        {mes}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {contas.map(conta => renderConta(conta))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dre;