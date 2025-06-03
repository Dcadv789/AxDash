import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import EmpresaFilter from '../components/common/EmpresaFilter';
import DateFilter from '../components/common/DateFilter';
import { Building, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
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
    <div className={`rounded-lg p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
      <Building className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h2 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Selecione uma empresa
      </h2>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
        <tr className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
          <td className="px-6 py-2" style={{ paddingLeft }}>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {hasChildren && (
                <button
                  onClick={() => toggleConta(conta.id)}
                  className={`p-0.5 rounded transition-colors
                    ${isDark
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-200 text-gray-600'}`}
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
              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {conta.nome}
              </span>
            </div>
          </td>
          {conta.valores_mensais.slice().reverse().map((valor, index) => (
            <td
              key={index}
              className={`px-3 py-2 text-right whitespace-nowrap text-sm font-medium
                ${valor >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {formatCurrency(valor)}
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
      <div className="px-4 flex items-center justify-between mb-3">
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

      <div className="px-4 flex-1 min-h-0 overflow-auto pb-4">
        {!selectedEmpresa ? (
          renderNoEmpresaSelected()
        ) : loading ? (
          <div className={`rounded-lg p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} flex items-center justify-center`}>
            <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
        ) : (
          <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                    <th className={`px-6 py-2 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider sticky left-0 z-10 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      Conta
                    </th>
                    {getMeses().map((mes, index) => (
                      <th key={index} className={`px-3 py-2 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider w-[90px]`}>
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