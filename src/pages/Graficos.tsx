import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import EmpresaFilter from '../components/common/EmpresaFilter';
import DateFilter from '../components/common/DateFilter';
import DashboardChart from '../components/dashboard/DashboardChart';
import { useVisualizacoes } from '../hooks/useVisualizacoes';
import { Building, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Componente {
  id: string;
  nome: string;
  tabela_origem: string;
  selected?: boolean;
}

const Graficos: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [componentesPorGrafico, setComponentesPorGrafico] = useState<Record<string, Componente[]>>({});
  
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());

  const { visualizacoes, loading } = useVisualizacoes(
    selectedEmpresa,
    selectedMonth,
    selectedYear,
    'graficos'
  );

  const graficoVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'grafico');

  useEffect(() => {
    const fetchComponentes = async () => {
      try {
        const { data: componentes, error } = await supabase
          .from('config_visualizacoes_componentes')
          .select(`
            id,
            visualizacao_id,
            categoria:categorias(id, nome),
            indicador:indicadores(id, nome)
          `);

        if (error) throw error;

        const componentesAgrupados: Record<string, Componente[]> = {};
        
        componentes?.forEach(comp => {
          const visualizacaoId = comp.visualizacao_id;
          if (!componentesAgrupados[visualizacaoId]) {
            componentesAgrupados[visualizacaoId] = [];
          }

          if (comp.categoria) {
            componentesAgrupados[visualizacaoId].push({
              id: comp.categoria.id,
              nome: comp.categoria.nome,
              tabela_origem: 'categorias',
              selected: true
            });
          }

          if (comp.indicador) {
            componentesAgrupados[visualizacaoId].push({
              id: comp.indicador.id,
              nome: comp.indicador.nome,
              tabela_origem: 'indicadores',
              selected: true
            });
          }
        });

        setComponentesPorGrafico(componentesAgrupados);
      } catch (error) {
        console.error('Erro ao buscar componentes:', error);
      }
    };

    fetchComponentes();
  }, []);

  const handleComponenteToggle = (visualizacaoId: string, componenteId: string) => {
    setComponentesPorGrafico(prev => ({
      ...prev,
      [visualizacaoId]: prev[visualizacaoId].map(comp => 
        comp.id === componenteId ? { ...comp, selected: !comp.selected } : comp
      )
    }));
  };

  const renderNoEmpresaSelected = () => (
    <div className={`rounded-xl p-8 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
      <Building className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Selecione uma empresa
      </h2>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Para visualizar os gráficos, selecione uma empresa no filtro acima
      </p>
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

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gráficos
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Visualize todos os gráficos do sistema
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

      <div className="px-6 flex-1 flex flex-col gap-6 min-h-0 overflow-auto pb-6">
        {!selectedEmpresa ? (
          renderNoEmpresaSelected()
        ) : loading ? (
          <div className="space-y-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-[400px]">
                {renderLoadingChart()}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {graficoVisualizacoes
              .sort((a, b) => a.ordem - b.ordem)
              .map(visualizacao => {
                if (!visualizacao.dados_grafico) return null;

                const componentesDisponiveis = componentesPorGrafico[visualizacao.id] || [];
                const componentesSelecionados = componentesDisponiveis.filter(c => c.selected);

                const series = componentesSelecionados.map(componente => ({
                  dataKey: componente.nome,
                  name: componente.nome
                }));

                return (
                  <div key={visualizacao.id}>
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {visualizacao.nome_exibicao}
                        </h3>
                        <div className="flex items-center gap-3">
                          {componentesDisponiveis.map(componente => (
                            <label
                              key={componente.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={componente.selected}
                                onChange={() => handleComponenteToggle(visualizacao.id, componente.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {componente.nome}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="h-[350px]">
                        <DashboardChart
                          type={visualizacao.tipo_grafico || 'line'}
                          data={visualizacao.dados_grafico}
                          series={series}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Graficos;