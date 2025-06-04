import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import EmpresaFilter from '../components/common/EmpresaFilter';
import DateFilter from '../components/common/DateFilter';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardList from '../components/dashboard/DashboardList';
import DashboardChart from '../components/dashboard/DashboardChart';
import { useVisualizacoes } from '../hooks/useVisualizacoes';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  PiggyBank,
  Building,
  Loader2,
  Target,
  BarChart,
  LineChart,
  PieChart,
  ArrowUpCircle
} from 'lucide-react';

const Vendas: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());

  const { visualizacoes, loading } = useVisualizacoes(
    selectedEmpresa,
    selectedMonth,
    selectedYear,
    'vendas'
  );

  const calculateVariation = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  };

  const getFinancialIcon = (ordem: number) => {
    switch (ordem) {
      case 1: return DollarSign;
      case 2: return Target;
      case 3: return BarChart;
      case 4: return PieChart;
      case 5: return LineChart;
      case 6: return ArrowUpCircle;
      case 7: return TrendingUp;
      case 8: return Wallet;
      case 9: return CreditCard;
      case 10: return PiggyBank;
      default: return DollarSign;
    }
  };

  const cardsVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'card');
  const graficoVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'grafico');
  const listaVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'lista');

  const renderNoEmpresaSelected = () => (
    <div className={`rounded-xl p-8 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
      <Building className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Selecione uma empresa
      </h2>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Para visualizar os dados de vendas, selecione uma empresa no filtro acima
      </p>
    </div>
  );

  const renderLoadingCard = () => (
    <div className={`rounded-xl p-5 relative overflow-hidden transition-all duration-200 h-[140px] animate-pulse
      ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500/50 to-indigo-600/50" />
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
          <Loader2 className={`h-5 w-5 animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
        <div className={`h-4 w-24 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      </div>
      <div className="space-y-2">
        <div className={`h-8 w-36 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className={`h-4 w-24 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      </div>
    </div>
  );

  const renderLoadingChart = () => (
    <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className={`h-6 w-48 rounded mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    </div>
  );

  const renderLoadingList = () => (
    <div className={`rounded-xl p-6 h-full ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className={`h-6 w-48 rounded mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-12 rounded animate-pulse ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Vendas
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Acompanhe o desempenho das suas vendas em tempo real
          </p>
        </div>

        <div className={`flex items-center gap-4 py-2 px-4 rounded-xl ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
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

      <div className="px-6 flex-1 flex flex-col gap-4 min-h-0 overflow-auto pb-6">
        {!selectedEmpresa ? (
          renderNoEmpresaSelected()
        ) : (
          <>
            {/* Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <React.Fragment key={i}>
                    {renderLoadingCard()}
                  </React.Fragment>
                ))
              ) : (
                cardsVisualizacoes
                  .sort((a, b) => a.ordem - b.ordem)
                  .map(visualizacao => (
                    <DashboardCard
                      key={visualizacao.id}
                      title={visualizacao.nome_exibicao}
                      icon={getFinancialIcon(visualizacao.ordem)}
                      currentValue={visualizacao.valor_atual || 0}
                      previousValue={visualizacao.valor_anterior}
                      variation={calculateVariation(
                        visualizacao.valor_atual || 0,
                        visualizacao.valor_anterior || 0
                      )}
                      isPercentage={visualizacao.ordem === 6 || visualizacao.ordem === 7 || visualizacao.ordem === 10}
                    />
                  ))
              )}
            </div>

            {/* Chart Section */}
            {(loading || graficoVisualizacoes.length > 0) && (
              <div className="flex-1 h-[400px]">
                {loading ? (
                  renderLoadingChart()
                ) : (
                  graficoVisualizacoes
                    .sort((a, b) => a.ordem - b.ordem)
                    .map(visualizacao => {
                      if (!visualizacao.dados_grafico) return null;

                      const series = Object.keys(visualizacao.dados_grafico[0])
                        .filter(key => key !== 'name')
                        .map(key => ({
                          dataKey: key,
                          name: key
                        }));

                      return (
                        <div
                          key={visualizacao.id}
                          className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}
                        >
                          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {visualizacao.nome_exibicao}
                          </h3>
                          <div className="h-[calc(100%-2.5rem)]">
                            <DashboardChart
                              type={visualizacao.tipo_grafico || 'line'}
                              data={visualizacao.dados_grafico}
                              series={series}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* Lists Section */}
            {(loading || listaVisualizacoes.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loading ? (
                  Array(2).fill(0).map((_, i) => (
                    <React.Fragment key={i}>
                      {renderLoadingList()}
                    </React.Fragment>
                  ))
                ) : (
                  listaVisualizacoes
                    .sort((a, b) => a.ordem - b.ordem)
                    .map(visualizacao => (
                      <DashboardList
                        key={visualizacao.id}
                        title={visualizacao.nome_exibicao}
                        items={visualizacao.itens}
                      />
                    ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Vendas;