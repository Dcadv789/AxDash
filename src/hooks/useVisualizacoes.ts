import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getLancamentos, getTituloLancamento } from '../services/lancamentosService';

interface Visualizacao {
  id: string;
  nome_exibicao: string;
  tipo_visualizacao: 'card' | 'grafico' | 'lista';
  tipo_grafico?: 'line' | 'bar' | 'area';
  ordem: number;
  valor_atual?: number;
  valor_anterior?: number;
  itens?: any[];
  dados_grafico?: any[];
}

// Cache global mais agressivo
const visualizacoesCache = new Map<string, { data: Visualizacao[]; timestamp: number }>();
const configCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos
const CONFIG_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos para configurações

export const useVisualizacoes = (empresaId: string, mes: number, ano: number, pagina: string = 'home') => {
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cria uma chave única para o cache baseada nos parâmetros COM EMPRESA
  const cacheKey = useMemo(() => 
    `${empresaId}-${mes}-${ano}-${pagina}`, 
    [empresaId, mes, ano, pagina]
  );

  useEffect(() => {
    const fetchVisualizacoes = async () => {
      if (!empresaId) {
        setVisualizacoes([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Verifica o cache primeiro
        const cached = visualizacoesCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setVisualizacoes(cached.data);
          setLoading(false);
          return;
        }

        console.log('🚀 Iniciando busca otimizada de visualizações COM FILTRO DE EMPRESA...');
        const startTime = Date.now();

        // Busca configurações com cache separado
        let configVisualizacoes;
        const configCached = configCache.get(pagina);
        
        if (configCached && Date.now() - configCached.timestamp < CONFIG_CACHE_DURATION) {
          configVisualizacoes = configCached.data;
          console.log('📋 Configurações carregadas do cache');
        } else {
          const { data, error } = await supabase
            .from('config_visualizacoes')
            .select(`
              id,
              nome_exibicao,
              tipo_visualizacao,
              tipo_grafico,
              ordem,
              componentes:config_visualizacoes_componentes (
                *,
                categoria:categorias (id, nome),
                indicador:indicadores (id, nome)
              )
            `)
            .eq('pagina', pagina)
            .order('ordem');

          if (error) {
            if (error.message?.includes('Failed to fetch') || 
                error.name === 'TypeError' || 
                error.message?.includes('NetworkError') ||
                error.message?.includes('fetch')) {
              throw new Error('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
            }
            throw error;
          }

          configVisualizacoes = data;
          configCache.set(pagina, { data: configVisualizacoes, timestamp: Date.now() });
          console.log('📋 Configurações carregadas do servidor');
        }

        console.log(`⚡ Configurações prontas em ${Date.now() - startTime}ms`);

        // Processa as visualizações com otimizações agressivas E FILTRO DE EMPRESA
        const visualizacoesProcessadas = await Promise.all(
          configVisualizacoes.map(async (config) => {
            const visualizacao: Visualizacao = {
              id: config.id,
              nome_exibicao: config.nome_exibicao,
              tipo_visualizacao: config.tipo_visualizacao,
              tipo_grafico: config.tipo_grafico,
              ordem: config.ordem,
            };

            if (!config.componentes || config.componentes.length === 0) {
              return visualizacao;
            }

            try {
              // Processa os diferentes tipos de visualização COM FILTRO DE EMPRESA
              switch (config.tipo_visualizacao) {
                case 'card': {
                  const { valorAtual, valorAnterior } = await processarCardOtimizado(
                    config.componentes, 
                    mes, 
                    ano, 
                    config.ordem, 
                    pagina,
                    empresaId // PASSA A EMPRESA
                  );
                  
                  // Tratamento especial para widget 10 na página de vendas
                  if (pagina === 'vendas' && config.ordem === 10) {
                    visualizacao.valor_atual = valorAtual / 100;
                    visualizacao.valor_anterior = valorAnterior / 100;
                  } 
                  // Tratamento especial para ordens 6 e 7 na página de vendas
                  else if (pagina === 'vendas' && (config.ordem === 6 || config.ordem === 7)) {
                    const widgetOrdem1 = configVisualizacoes.find(v => v.ordem === 1);
                    if (widgetOrdem1) {
                      const { valorAtual: valorBase } = await processarCardOtimizado(
                        widgetOrdem1.componentes, 
                        mes, 
                        ano, 
                        1, 
                        pagina,
                        empresaId // PASSA A EMPRESA
                      );
                      const { valorAtual: valorBaseMesAnterior } = await processarCardOtimizado(
                        widgetOrdem1.componentes, 
                        mes === 0 ? 11 : mes - 1, 
                        mes === 0 ? ano - 1 : ano, 
                        1, 
                        pagina,
                        empresaId // PASSA A EMPRESA
                      );
                      
                      const porcentagemAtual = valorBase !== 0 ? (valorAtual / valorBase) * 100 : 0;
                      const porcentagemAnterior = valorBaseMesAnterior !== 0 ? (valorAnterior / valorBaseMesAnterior) * 100 : 0;
                      
                      visualizacao.valor_atual = porcentagemAtual;
                      visualizacao.valor_anterior = porcentagemAnterior;
                    }
                  } else {
                    visualizacao.valor_atual = valorAtual;
                    visualizacao.valor_anterior = valorAnterior;
                  }
                  break;
                }

                case 'lista':
                  visualizacao.itens = await processarListaOtimizada(config.componentes, mes, ano, empresaId);
                  break;

                case 'grafico':
                  visualizacao.dados_grafico = await processarGraficoOtimizado(config.componentes, mes, ano, empresaId);
                  break;
              }
            } catch (componentError: any) {
              console.error(`Erro ao processar componente ${config.id}:`, componentError);
              
              // Se for erro de conectividade, propaga para o nível superior
              if (componentError.message?.includes('Erro de conectividade')) {
                throw componentError;
              }
              
              // Para outros erros, continua com valores padrão
              if (config.tipo_visualizacao === 'card') {
                visualizacao.valor_atual = 0;
                visualizacao.valor_anterior = 0;
              } else if (config.tipo_visualizacao === 'lista') {
                visualizacao.itens = [];
              } else if (config.tipo_visualizacao === 'grafico') {
                visualizacao.dados_grafico = [];
              }
            }

            return visualizacao;
          })
        );

        console.log(`🎯 Visualizações processadas em ${Date.now() - startTime}ms COM FILTRO DE EMPRESA`);

        // Atualiza o cache
        visualizacoesCache.set(cacheKey, {
          data: visualizacoesProcessadas,
          timestamp: Date.now()
        });

        setVisualizacoes(visualizacoesProcessadas);
      } catch (error: any) {
        console.error('Erro ao buscar visualizações:', error);
        
        if (error.message?.includes('Erro de conectividade') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError') ||
            error.name === 'TypeError') {
          setError('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
        } else {
          setError(`Erro ao carregar visualizações: ${error.message || 'Erro desconhecido'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVisualizacoes();
  }, [cacheKey]);

  return { visualizacoes, loading, error };
};

// Cache para lançamentos por período COM EMPRESA
const lancamentosCache = new Map<string, { data: any[]; timestamp: number }>();

// Função otimizada para processar cards COM FILTRO DE EMPRESA
async function processarCardOtimizado(
  componentes: any[], 
  mes: number, 
  ano: number, 
  ordem: number, 
  pagina: string = 'home',
  empresaId: string // NOVO PARÂMETRO
) {
  let valorAtual = 0;
  let valorAnterior = 0;

  try {
    // Se a ordem for 5, calcula o saldo acumulado (mantém lógica original)
    if (ordem === 5) {
      for (let anoAtual = 2024; anoAtual <= ano; anoAtual++) {
        const mesInicial = anoAtual === 2024 ? 0 : 0;
        const mesFinal = anoAtual === ano ? mes : 11;

        for (let mesAtual = mesInicial; mesAtual <= mesFinal; mesAtual++) {
          const lancamentosMes = await Promise.all(
            componentes.map(componente =>
              getLancamentos(mesAtual, anoAtual, {
                categoria_id: componente.categoria?.id,
                indicador_id: componente.indicador?.id,
                tabela_origem: componente.tabela_origem,
                todos: componente.todos,
              }, empresaId) // PASSA A EMPRESA
            )
          );

          valorAtual += lancamentosMes.flat().reduce((acc, lanc) => 
            acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor), 
            0
          );
        }
      }

      // Para o valor anterior, calculamos até o mês anterior
      if (mes > 0) {
        for (let anoAtual = 2024; anoAtual <= ano; anoAtual++) {
          const mesInicial = anoAtual === 2024 ? 0 : 0;
          const mesFinal = anoAtual === ano ? mes - 1 : 11;

          for (let mesAtual = mesInicial; mesAtual <= mesFinal; mesAtual++) {
            const lancamentosMes = await Promise.all(
              componentes.map(componente =>
                getLancamentos(mesAtual, anoAtual, {
                  categoria_id: componente.categoria?.id,
                  indicador_id: componente.indicador?.id,
                  tabela_origem: componente.tabela_origem,
                  todos: componente.todos,
                }, empresaId) // PASSA A EMPRESA
              )
            );

            valorAnterior += lancamentosMes.flat().reduce((acc, lanc) => 
              acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor), 
              0
            );
          }
        }
      }
    } else {
      // Para outras ordens, usa cache agressivo COM FILTRO DE EMPRESA
      const mesAnterior = mes === 0 ? 11 : mes - 1;
      const anoAnterior = mes === 0 ? ano - 1 : ano;

      // Busca lançamentos com cache COM EMPRESA
      const [lancamentosAtuais, lancamentosAnteriores] = await Promise.all([
        buscarLancamentosComCache(mes, ano, componentes, empresaId),
        buscarLancamentosComCache(mesAnterior, anoAnterior, componentes, empresaId)
      ]);

      valorAtual = calcularSomaLancamentos(lancamentosAtuais);
      valorAnterior = calcularSomaLancamentos(lancamentosAnteriores);
    }
  } catch (error: any) {
    console.error('Erro ao processar card:', error);
    
    // Se for erro de conectividade, propaga
    if (error.message?.includes('Erro de conectividade')) {
      throw error;
    }
    
    // Para outros erros, retorna valores zerados
    valorAtual = 0;
    valorAnterior = 0;
  }

  return { valorAtual, valorAnterior };
}

// Função para buscar lançamentos com cache agressivo COM FILTRO DE EMPRESA
async function buscarLancamentosComCache(mes: number, ano: number, componentes: any[], empresaId: string) {
  const cacheKey = `${mes}-${ano}-${empresaId}-${JSON.stringify(componentes.map(c => ({ 
    categoria_id: c.categoria?.id, 
    indicador_id: c.indicador?.id, 
    tabela_origem: c.tabela_origem,
    todos: c.todos 
  })))}`;

  const cached = lancamentosCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const lancamentos = await Promise.all(
      componentes.map(componente =>
        getLancamentos(mes, ano, {
          categoria_id: componente.categoria?.id,
          indicador_id: componente.indicador?.id,
          tabela_origem: componente.tabela_origem,
          todos: componente.todos,
        }, empresaId) // PASSA A EMPRESA
      )
    );

    const result = lancamentos.flat();
    lancamentosCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error: any) {
    console.error('Erro ao buscar lançamentos com cache:', error);
    
    // Se for erro de conectividade, propaga
    if (error.message?.includes('Erro de conectividade')) {
      throw error;
    }
    
    // Para outros erros, retorna array vazio
    return [];
  }
}

// Função otimizada para processar listas COM FILTRO DE EMPRESA
async function processarListaOtimizada(componentes: any[], mes: number, ano: number, empresaId: string) {
  try {
    const lancamentos = await buscarLancamentosComCache(mes, ano, componentes, empresaId);
    
    const itens = lancamentos.map(lancamento => ({
      titulo: getTituloLancamento(lancamento),
      valor: lancamento.valor,
      tipo: lancamento.tipo,
    }));

    return itens.sort((a, b) => b.valor - a.valor).slice(0, 10); // Limita a 10 itens para performance
  } catch (error: any) {
    console.error('Erro ao processar lista:', error);
    
    // Se for erro de conectividade, propaga
    if (error.message?.includes('Erro de conectividade')) {
      throw error;
    }
    
    // Para outros erros, retorna array vazio
    return [];
  }
}

// Função otimizada para processar gráficos COM FILTRO DE EMPRESA
async function processarGraficoOtimizado(componentes: any[], mes: number, ano: number, empresaId: string) {
  try {
    const dadosGrafico = [];
    const mesesProcessar = Array.from({ length: 13 }, (_, i) => {
      let mesAtual = mes - (12 - i);
      let anoAtual = ano;
      while (mesAtual < 0) {
        mesAtual += 12;
        anoAtual--;
      }
      return { mes: mesAtual, ano: anoAtual };
    });

    // Busca dados para todos os meses em paralelo com cache COM FILTRO DE EMPRESA
    const dadosPorMes = await Promise.all(
      mesesProcessar.map(async ({ mes: mesAtual, ano: anoAtual }) => {
        const dadosMes: any = {
          name: `${mesAtual + 1}/${anoAtual}`
        };

        try {
          // Processa cada componente separadamente para manter a estrutura original
          const lancamentosPorComponente = await Promise.all(
            componentes.map(async (componente) => {
              const lancamentos = await getLancamentos(mesAtual, anoAtual, {
                categoria_id: componente.categoria?.id,
                indicador_id: componente.indicador?.id,
                tabela_origem: componente.tabela_origem,
                todos: componente.todos,
              }, empresaId); // PASSA A EMPRESA

              const chave = componente.categoria?.nome || 
                           componente.indicador?.nome || 
                           'Total';

              return { chave, valor: calcularSomaLancamentos(lancamentos) };
            })
          );

          // Adiciona cada componente como uma série separada no gráfico
          lancamentosPorComponente.forEach(({ chave, valor }) => {
            dadosMes[chave] = valor;
          });
        } catch (error: any) {
          console.error(`Erro ao processar dados do mês ${mesAtual}/${anoAtual}:`, error);
          
          // Se for erro de conectividade, propaga
          if (error.message?.includes('Erro de conectividade')) {
            throw error;
          }
          
          // Para outros erros, adiciona valores zerados
          componentes.forEach(componente => {
            const chave = componente.categoria?.nome || 
                         componente.indicador?.nome || 
                         'Total';
            dadosMes[chave] = 0;
          });
        }

        return dadosMes;
      })
    );

    return dadosPorMes;
  } catch (error: any) {
    console.error('Erro ao processar gráfico:', error);
    
    // Se for erro de conectividade, propaga
    if (error.message?.includes('Erro de conectividade')) {
      throw error;
    }
    
    // Para outros erros, retorna array vazio
    return [];
  }
}

function calcularSomaLancamentos(lancamentos: any[]) {
  return lancamentos.reduce((acc, lanc) => 
    acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor), 
    0
  );
}