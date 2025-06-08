import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFilter } from '../context/FilterContext';
import GlobalFilter from '../components/common/GlobalFilter';
import DashboardChart from '../components/dashboard/DashboardChart';
import { useVisualizacoes } from '../hooks/useVisualizacoes';
import { Building, Loader2, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Componente {
  id: string;
  nome: string;
  tabela_origem: string;
  selected?: boolean;
}

// Cache para componentes
const componentesCache = new Map<string, { data: Record<string, Componente[]>; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const Graficos: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedEmpresa, selectedMonth, selectedYear } = useFilter();
  const [componentesPorGrafico, setComponentesPorGrafico] = useState<Record<string, Componente[]>>({});
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [loadingComponentes, setLoadingComponentes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { visualizacoes, loading } = useVisualizacoes(
    selectedEmpresa,
    selectedMonth,
    selectedYear,
    'graficos'
  );

  const graficoVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'grafico');

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

  useEffect(() => {
    const fetchComponentes = async () => {
      try {
        setLoadingComponentes(true);
        setError(null);

        // Verifica o cache
        const cacheKey = 'componentes-graficos';
        const cached = componentesCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setComponentesPorGrafico(cached.data);
          setLoadingComponentes(false);
          return;
        }

        console.log('Iniciando busca de componentes...');
        const startTime = Date.now();

        // Busca todos os componentes de uma vez com joins otimizados
        const { data: componentes, error } = await supabase
          .from('config_visualizacoes_componentes')
          .select(`
            id,
            visualizacao_id,
            categoria:categorias(id, nome),
            indicador:indicadores(id, nome)
          `);

        if (error) {
          if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
            throw new Error('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
          }
          throw error;
        }

        console.log(`Componentes carregados em ${Date.now() - startTime}ms`);

        // Processa os componentes de forma otimizada
        const componentesAgrupados: Record<string, Componente[]> = {};
        
        (componentes || []).forEach(comp => {
          const visualizacaoId = comp.visualizacao_id;
          if (!componentesAgrupados[visualizacaoId]) {
            componentesAgrupados[visualizacaoId] = [];
          }

          // Adiciona categoria se existir
          if (comp.categoria) {
            componentesAgrupados[visualizacaoId].push({
              id: comp.categoria.id,
              nome: comp.categoria.nome,
              tabela_origem: 'categorias',
              selected: false
            });
          }

          // Adiciona indicador se existir
          if (comp.indicador) {
            componentesAgrupados[visualizacaoId].push({
              id: comp.indicador.id,
              nome: comp.indicador.nome,
              tabela_origem: 'indicadores',
              selected: false
            });
          }
        });

        // Remove duplicatas por visualização
        Object.keys(componentesAgrupados).forEach(visualizacaoId => {
          const componentesUnicos = new Map();
          componentesAgrupados[visualizacaoId].forEach(comp => {
            const key = `${comp.id}-${comp.tabela_origem}`;
            if (!componentesUnicos.has(key)) {
              componentesUnicos.set(key, comp);
            }
          });
          componentesAgrupados[visualizacaoId] = Array.from(componentesUnicos.values());
        });

        console.log(`Componentes processados em ${Date.now() - startTime}ms`);

        // Atualiza o cache
        componentesCache.set(cacheKey, {
          data: componentesAgrupados,
          timestamp: Date.now()
        });

        setComponentesPorGrafico(componentesAgrupados);
      } catch (error: any) {
        console.error('Erro ao buscar componentes:', error);
        
        if (error.message?.includes('Erro de conectividade') || error.message?.includes('Failed to fetch')) {
          setError('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
        } else {
          setError(`Erro ao carregar componentes: ${error.message || 'Erro desconhecido'}`);
        }
      } finally {
        setLoadingComponentes(false);
      }
    };

    fetchComponentes();
  }, []);

  useEffect(() => {
    // Fecha o menu quando clicar fora
    const handleClickFora = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-dropdown')) {
        setMenuAberto(null);
      }
    };

    document.addEventListener('click', handleClickFora);
    return () => document.removeEventListener('click', handleClickFora);
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
      <div className={`h-6 w-48 rounded mb-4 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-10 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gráficos
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Visualize todos os gráficos do sistema
          </p>
        </div>

        <GlobalFilter />
      </div>

      {error && (
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
      )}

      <div className="px-6 flex-1 min-h-0">
        <div className="h-full overflow-y-auto custom-scrollbar pr-2">
          {!selectedEmpresa ? (
            renderNoEmpresaSelected()
          ) : loading || loadingComponentes ? (
            <div className="space-y-6 pb-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-[400px]">
                  {renderLoadingChart()}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {graficoVisualizacoes
                .sort((a, b) => a.ordem - b.ordem)
                .map(visualizacao => {
                  if (!visualizacao.dados_grafico) return null;

                  const componentesDisponiveis = componentesPorGrafico[visualizacao.id] || [];
                  const componentesSelecionados = componentesDisponiveis.filter(c => c.selected);
                  const todosComponentesSelecionados = componentesDisponiveis.length > 0 && componentesDisponiveis.length === componentesSelecionados.length;
                  const algunsComponentesSelecionados = componentesSelecionados.length > 0;

                  const series = componentesSelecionados.map(componente => ({
                    dataKey: componente.nome,
                    name: componente.nome
                  }));

                  // Processa os dados do gráfico para tornar valores positivos
                  const processedData = processChartData(visualizacao.dados_grafico);

                  return (
                    <div key={visualizacao.id}>
                      <div className={`rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {visualizacao.nome_exibicao}
                          </h3>
                          
                          {componentesDisponiveis.length > 0 && (
                            <div className="relative menu-dropdown">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAberto(menuAberto === visualizacao.id ? null : visualizacao.id);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                                  ${isDark 
                                    ? 'hover:bg-gray-800 text-gray-300' 
                                    : 'hover:bg-gray-100 text-gray-600'}`}
                              >
                                <span className="text-sm">
                                  {componentesSelecionados.length} componente{componentesSelecionados.length !== 1 ? 's' : ''} selecionado{componentesSelecionados.length !== 1 ? 's' : ''}
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${menuAberto === visualizacao.id ? 'rotate-180' : ''}`} />
                              </button>

                              {menuAberto === visualizacao.id && (
                                <div className={`absolute right-0 top-full mt-1 w-64 rounded-lg shadow-lg z-10
                                  ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setComponentesPorGrafico(prev => ({
                                          ...prev,
                                          [visualizacao.id]: prev[visualizacao.id].map(comp => ({
                                            ...comp,
                                            selected: !todosComponentesSelecionados
                                          }))
                                        }));
                                      }}
                                      className={`flex items-center gap-2 w-full text-left text-sm
                                        ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                                    >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center
                                        ${todosComponentesSelecionados
                                          ? 'bg-indigo-600 border-indigo-600'
                                          : algunsComponentesSelecionados
                                            ? 'bg-indigo-600/50 border-indigo-600'
                                            : isDark
                                              ? 'border-gray-600'
                                              : 'border-gray-300'
                                        }`}>
                                        {todosComponentesSelecionados && (
                                          <Check className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      <span>Selecionar todos</span>
                                    </button>
                                  </div>
                                  
                                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {componentesDisponiveis.map(componente => (
                                      <button
                                        key={`${componente.id}-${componente.tabela_origem}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleComponenteToggle(visualizacao.id, componente.id);
                                        }}
                                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors
                                          ${isDark
                                            ? 'hover:bg-gray-700 text-gray-300'
                                            : 'hover:bg-gray-100 text-gray-600'}`}
                                      >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center
                                          ${componente.selected
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : isDark
                                              ? 'border-gray-600'
                                              : 'border-gray-300'
                                          }`}>
                                          {componente.selected && (
                                            <Check className="h-3 w-3 text-white" />
                                          )}
                                        </div>
                                        <span className="truncate">{componente.nome}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                          isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                          {componente.tabela_origem === 'categorias' ? 'Cat' : 'Ind'}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="h-[350px]">
                          <DashboardChart
                            type={visualizacao.tipo_grafico || 'line'}
                            data={processedData}
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
    </div>
  );
};

export default Graficos;