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
  Building
} from 'lucide-react';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());

  const { visualizacoes, loading } = useVisualizacoes(
    selectedEmpresa,
    selectedMonth,
    selectedYear
  );

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

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Visualize e acompanhe os principais indicadores do seu negócio
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
        ) : loading ? (
          <div className="flex items-center justify-center flex-1">
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Carregando visualizações...
            </p>
          </div>
        ) : (
          <>
            {cardsVisualizacoes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="flex-1 min-h-[300px]">
                {graficoVisualizacoes
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
                  })}
              </div>
            )}

            {listaVisualizacoes.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          </>
        )}
      </div>
    </div>
  );
};

export default Home;