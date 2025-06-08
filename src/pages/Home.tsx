import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFilter } from '../context/FilterContext';
import GlobalFilter from '../components/common/GlobalFilter';
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
  Loader2
} from 'lucide-react';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedEmpresa, selectedMonth, selectedYear } = useFilter();

  const { visualizacoes, loading, error } = useVisualizacoes(
    selectedEmpresa,
    selectedMonth,
    selectedYear
  );

  const calculateVariation = (atual: number, anterior: number, ordem?: number, pagina?: string) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    
    // Lógica especial para card de ordem 2 na página home (despesas)
    if (pagina === 'home' && ordem === 2) {
      // Para despesas (valores negativos), inverte a lógica:
      // Se pagou menos (valor menos negativo), é uma redução (positivo)
      // Se pagou mais (valor mais negativo), é um aumento (negativo)
      if (anterior < 0 && atual < 0) {
        // Ambos são negativos (despesas)
        // Se atual > anterior (ex: -100 > -200), pagou menos, então é redução (positivo)
        return ((anterior - atual) / Math.abs(anterior)) * 100;
      }
    }
    
    // Para outros casos, mantém a lógica normal
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

  // Função para processar os dados do gráfico e tornar valores positivos
  const processChartData = (dados: any[]) => {
    if (!dados || dados.length === 0) return dados;

    return dados.map(item => {
      const newItem = { ...item };
      Object.keys(newItem).forEach(key => {
        if (key !== 'name' && typeof newItem[key] === 'number') {
          newItem[key] = Math.abs(newItem[key]);
        }
      });
      return newItem;
    });
  };

  const renderNoEmpresaSelected = () => (
    <div className={`rounded-xl p-8 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
      <Building className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Selecione uma empresa
      </h2>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Para visualizar os dados do dashboard, selecione uma empresa no filtro acima
      </p>
    </div>
  );

  const renderErrorState = () => (
    <div className="px-6 mb-4">
      <div className={`p-4 rounded-lg border ${
        isDark 
          ? 'bg-red-900/20 border-red-800 text-red-300' 
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        <p className="font-medium">Erro de Conectividade</p>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-xs mt-2 opacity-75">
          Configure o Supabase para aceitar requisições de http://localhost:5173
        </p>
      </div>
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
        <div className={`h-4 w-24 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      </div>
      <div className="space-y-2">
        <div className={`h-8 w-36 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className={`h-4 w-24 rounded animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      </div>
    </div>
  );

  const renderLoadingChart = () => (
    <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className={`h-6 w-48 rounded mb-4 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    </div>
  );

  const renderLoadingList = () => (
    <div className={`rounded-xl p-6 h-full ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className={`h-6 w-48 rounded mb-6 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
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
      <div className="px-10 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Visualize e acompanhe os principais indicadores do seu negócio
          </p>
        </div>

        <GlobalFilter />
      </div>

      {error && renderErrorState()}

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
                      icon={getFinancialIcon(visualizacao.nome_exibicao)}
                      currentValue={visualizacao.valor_atual || 0}
                      previousValue={visualizacao.valor_anterior}
                      variation={calculateVariation(
                        visualizacao.valor_atual || 0,
                        visualizacao.valor_anterior || 0,
                        visualizacao.ordem,
                        'home'
                      )}
                      ordem={visualizacao.ordem}
                      pagina="home"
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

                      // Processa os dados do gráfico para tornar valores positivos
                      const processedData = processChartData(visualizacao.dados_grafico);

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
                              data={processedData}
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

export default Home;