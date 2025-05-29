import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import EmpresaFilter from '../components/common/EmpresaFilter';
import DateFilter from '../components/common/DateFilter';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Visualizacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  ordem: number;
  ativo: boolean;
  nome_exibicao: string;
  tipo_visualizacao: string;
  valor_atual?: number;
  valor_anterior?: number;
  itens?: { titulo: string; valor: string }[];
}

const Home: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1);
  const [selectedYear, setSelectedYear] = useState(
    hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear()
  );

  useEffect(() => {
    fetchVisualizacoes();
  }, [selectedEmpresa, selectedMonth, selectedYear]);

  const fetchVisualizacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('config_visualizacoes')
        .select('*')
        .eq('pagina', 'home')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setVisualizacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar visualizações:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateVariation = (atual: number, anterior: number) => {
    if (!anterior) return 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const getFinancialIcon = (title: string) => {
    const normalizedTitle = title.toLowerCase();
    if (normalizedTitle.includes('receita')) return DollarSign;
    if (normalizedTitle.includes('despesa')) return CreditCard;
    if (normalizedTitle.includes('lucro')) return PiggyBank;
    return Wallet;
  };

  const renderCard = (visualizacao: Visualizacao) => {
    const variation = calculateVariation(
      visualizacao.valor_atual || 0,
      visualizacao.valor_anterior || 0
    );
    const Icon = getFinancialIcon(visualizacao.nome_exibicao);
    const isPositive = variation > 0;
    const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div
        key={visualizacao.id}
        className={`rounded-xl p-6 relative overflow-hidden transition-all duration-200
          ${isDark ? 'bg-[#151515] hover:bg-gray-800/50' : 'bg-white hover:bg-gray-50'}`}
      >
        {/* Barra decorativa na lateral esquerda */}
        <div className={`absolute top-0 left-0 w-1 h-full bg-indigo-500/30`} />
        
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Icon className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </div>
          <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {visualizacao.nome_exibicao}
          </h3>
        </div>

        <div className="flex items-end justify-between">
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(visualizacao.valor_atual || 0)}
          </p>
          {variation !== 0 && (
            <div className={`flex flex-col items-end`}>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
                ${isPositive 
                  ? 'text-green-500 bg-green-500/10' 
                  : 'text-red-500 bg-red-500/10'}`}>
                <ArrowIcon className="h-4 w-4" />
                <span>{Math.abs(variation).toFixed(1)}%</span>
              </div>
              <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                vs. mês anterior
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLista = (visualizacao: Visualizacao) => {
    return (
      <div
        key={visualizacao.id}
        className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {visualizacao.nome_exibicao}
        </h3>
        <div className="space-y-3">
          {visualizacao.itens?.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.titulo}
              </span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.valor}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVisualizacao = (visualizacao: Visualizacao) => {
    switch (visualizacao.tipo_visualizacao) {
      case 'card':
        return renderCard(visualizacao);
      case 'lista':
        return renderLista(visualizacao);
      case 'grafico':
        return (
          <div
            key={visualizacao.id}
            className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}
          >
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {visualizacao.nome_exibicao}
            </h3>
            <div className="h-[300px] flex items-center justify-center">
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Área do gráfico: {visualizacao.descricao}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const cardsVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'card');
  const graficoVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'grafico');
  const listaVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'lista');

  return (
    <div className="h-full">
      <div className="px-6 mb-6">
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Visualize e acompanhe os principais indicadores do seu negócio
        </p>
      </div>

      <div className={`mx-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} py-4 px-6 rounded-xl mb-6`}>
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-4">
            <EmpresaFilter
              value={selectedEmpresa}
              onChange={setSelectedEmpresa}
              className="flex-1"
            />
            <DateFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Carregando visualizações...
          </p>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {cardsVisualizacoes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cardsVisualizacoes
                .sort((a, b) => a.ordem - b.ordem)
                .map(renderVisualizacao)}
            </div>
          )}

          {graficoVisualizacoes.length > 0 && (
            <div className="space-y-6">
              {graficoVisualizacoes
                .sort((a, b) => a.ordem - b.ordem)
                .map(renderVisualizacao)}
            </div>
          )}

          {listaVisualizacoes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {listaVisualizacoes
                .filter(w => w.ordem === 6)
                .map(renderVisualizacao)}
              {listaVisualizacoes
                .filter(w => w.ordem === 7)
                .map(renderVisualizacao)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;