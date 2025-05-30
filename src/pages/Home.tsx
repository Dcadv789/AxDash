import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import EmpresaFilter from '../components/common/EmpresaFilter';
import DateFilter from '../components/common/DateFilter';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardList from '../components/dashboard/DashboardList';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  PiggyBank,
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
  itens?: { titulo: string; valor: number; tipo: string }[];
}

interface Componente {
  id: string;
  categoria_id?: string;
  indicador_id?: string;
}

interface Lancamento {
  valor: number;
  tipo: 'Receita' | 'Despesa';
  descricao: string;
}

const Home: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());

  const calcularValorRecursivo = async (
    componente: Componente,
    mes: number,
    ano: number
  ): Promise<Lancamento[]> => {
    try {
      const query = supabase
        .from('lancamentos')
        .select('valor, tipo, descricao')
        .eq('mes', mes + 1)
        .eq('ano', ano);

      if (componente.categoria_id) {
        query.eq('categoria_id', componente.categoria_id);
      } else if (componente.indicador_id) {
        query.eq('indicador_id', componente.indicador_id);
      }

      const { data: lancamentos, error } = await query;

      if (error) {
        console.error('Erro ao buscar lançamentos:', error);
        return [];
      }

      return lancamentos || [];
    } catch (error) {
      console.error('Erro ao calcular valor:', error);
      return [];
    }
  };

  const calcularValorAnterior = async (
    componente: Componente,
    mes: number,
    ano: number
  ): Promise<Lancamento[]> => {
    let mesAnterior = mes - 1;
    let anoAnterior = ano;
    
    if (mesAnterior < 0) {
      mesAnterior = 11;
      anoAnterior--;
    }

    return calcularValorRecursivo(componente, mesAnterior, anoAnterior);
  };

  const fetchVisualizacoes = async () => {
    try {
      setLoading(true);
      const { data: configVisualizacoes, error } = await supabase
        .from('config_visualizacoes')
        .select('*, config_visualizacoes_componentes(*)')
        .eq('pagina', 'home')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;

      const visualizacoesProcessadas = await Promise.all(
        (configVisualizacoes || []).map(async (visualizacao) => {
          let valorAtual = 0;
          let valorAnterior = 0;
          let itens: { titulo: string; valor: number; tipo: string }[] = [];

          if (visualizacao.config_visualizacoes_componentes) {
            for (const componente of visualizacao.config_visualizacoes_componentes) {
              const lancamentosAtuais = await calcularValorRecursivo(
                componente,
                selectedMonth,
                selectedYear
              );
              
              const lancamentosAnteriores = await calcularValorAnterior(
                componente,
                selectedMonth,
                selectedYear
              );

              lancamentosAtuais.forEach(lancamento => {
                if (lancamento.tipo === 'Receita') {
                  valorAtual += lancamento.valor;
                } else if (lancamento.tipo === 'Despesa') {
                  valorAtual -= lancamento.valor;
                }

                if (visualizacao.tipo_visualizacao === 'lista') {
                  itens.push({
                    titulo: lancamento.descricao,
                    valor: Math.abs(lancamento.valor),
                    tipo: lancamento.tipo
                  });
                }
              });

              lancamentosAnteriores.forEach(lancamento => {
                if (lancamento.tipo === 'Receita') {
                  valorAnterior += lancamento.valor;
                } else if (lancamento.tipo === 'Despesa') {
                  valorAnterior -= lancamento.valor;
                }
              });
            }

            if (visualizacao.tipo_visualizacao === 'lista') {
              itens.sort((a, b) => b.valor - a.valor);
              itens = itens.slice(0, 10);
            }
          }

          return {
            ...visualizacao,
            valor_atual: valorAtual,
            valor_anterior: valorAnterior,
            itens
          };
        })
      );

      setVisualizacoes(visualizacoesProcessadas);
    } catch (error) {
      console.error('Erro ao buscar visualizações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualizacoes();
  }, [selectedEmpresa, selectedMonth, selectedYear]);

  const calculateVariation = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  };

  const getFinancialIcon = (title: string) => {
    const normalizedTitle = title.toLowerCase();
    if (normalizedTitle.includes('receita')) return DollarSign;
    if (normalizedTitle.includes('despesa')) return CreditCard;
    if (normalizedTitle.includes('lucro')) return PiggyBank;
    return Wallet;
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
                .map(visualizacao => (
                  <DashboardCard
                    key={visualizacao.id}
                    title={visualizacao.nome_exibicao}
                    icon={getFinancialIcon(visualizacao.nome_exibicao)}
                    currentValue={visualizacao.valor_atual || 0}
                    previousValue={visualizacao.valor_anterior}
                    variation={calculateVariation(
                      visualizacao.valor_atual || 0,
                      visualizacao.valor_anterior || 0
                    )}
                  />
                ))}
            </div>
          )}

          {graficoVisualizacoes.length > 0 && (
            <div className="space-y-6">
              {graficoVisualizacoes
                .sort((a, b) => a.ordem - b.ordem)
                .map(visualizacao => (
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
                ))}
            </div>
          )}

          {listaVisualizacoes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {listaVisualizacoes
                .sort((a, b) => a.ordem - b.ordem)
                .map(visualizacao => (
                  <DashboardList
                    key={visualizacao.id}
                    title={visualizacao.nome_exibicao}
                    items={visualizacao.itens}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;