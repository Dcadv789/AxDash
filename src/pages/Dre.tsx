import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFilter } from '../context/FilterContext';
import { getDreData } from '../services/dreService';
import DreHeader from '../components/dre/DreHeader';
import DreTable from '../components/dre/DreTable';
import NoEmpresaSelected from '../components/dre/NoEmpresaSelected';

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
  const { selectedEmpresa, selectedMonth, selectedYear } = useFilter();
  const [loading, setLoading] = useState(false);
  const [contas, setContas] = useState<DreConta[]>([]);
  const [expandedContas, setExpandedContas] = useState<Set<string>>(new Set());
  const [showVariation, setShowVariation] = useState(false);
  const [showFullPeriod, setShowFullPeriod] = useState(true);

  useEffect(() => {
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

  const getMeses = () => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const result = [];
    const numMeses = showFullPeriod ? 13 : 6;
    
    for (let i = numMeses - 1; i >= 0; i--) {
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
      <div className="px-10 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            DRE
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Demonstração do Resultado do Exercício
          </p>
        </div>

        <DreHeader
          showVariation={showVariation}
          onToggleVariation={setShowVariation}
          showFullPeriod={showFullPeriod}
          onTogglePeriod={setShowFullPeriod}
        />
      </div>

      <div className="px-6 flex-1 min-h-0 pb-6">
        {!selectedEmpresa ? (
          <NoEmpresaSelected />
        ) : loading ? (
          <div className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} flex items-center justify-center`}>
            <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
        ) : (
          <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#151515]' : 'bg-white'} h-full`}>
            <DreTable
              contas={contas}
              meses={getMeses()}
              showVariation={showVariation}
              showFullPeriod={showFullPeriod}
              expandedContas={expandedContas}
              onToggleConta={toggleConta}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dre;