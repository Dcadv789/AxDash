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

// Cache para armazenar os resultados das visualizações
const visualizacoesCache = new Map<string, { data: Visualizacao[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useVisualizacoes = (empresaId: string, mes: number, ano: number, pagina: string = 'home') => {
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Cria uma chave única para o cache baseada nos parâmetros
  const cacheKey = useMemo(() => 
    `${empresaId}-${mes}-${ano}-${pagina}`, 
    [empresaId, mes, ano, pagina]
  );

  useEffect(() => {
    const fetchVisualizacoes = async () => {
      if (!empresaId) {
        setVisualizacoes([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Verifica o cache
        const cached = visualizacoesCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setVisualizacoes(cached.data);
          setLoading(false);
          return;
        }

        // Busca as configurações de visualização com uma única query otimizada
        const { data: configVisualizacoes, error } = await supabase
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

        if (error) throw error;

        // Processa as visualizações em paralelo
        const visualizacoesProcessadas = await Promise.all(
          configVisualizacoes.map(async (config) => {
            const visualizacao: Visualizacao = {
              id: config.id,
              nome_exibicao: config.nome_exibicao,
              tipo_visualizacao: config.tipo_visualizacao,
              tipo_grafico: config.tipo_grafico,
              ordem: config.ordem,
            };

            if (!config.componentes) return visualizacao;

            // Processa os diferentes tipos de visualização
            switch (config.tipo_visualizacao) {
              case 'card': {
                const { valorAtual, valorAnterior } = await processarCard(config.componentes, mes, ano, config.ordem);
                
                // Tratamento especial para widget 10
                if (pagina === 'vendas' && config.ordem === 10) {
                  visualizacao.valor_atual = valorAtual / 10;
                  visualizacao.valor_anterior = valorAnterior / 10;
                } 
                // Tratamento especial para ordens 6 e 7 na página de vendas
                else if (pagina === 'vendas' && (config.ordem === 6 || config.ordem === 7)) {
                  const widgetOrdem1 = configVisualizacoes.find(v => v.ordem === 1);
                  if (widgetOrdem1) {
                    const { valorAtual: valorBase } = await processarCard(widgetOrdem1.componentes, mes, ano, 1);
                    const { valorAtual: valorBaseMesAnterior } = await processarCard(widgetOrdem1.componentes, mes === 0 ? 11 : mes - 1, mes === 0 ? ano - 1 : ano, 1);
                    
                    const porcentagemAtual = (valorAtual / valorBase) * 100;
                    const porcentagemAnterior = (valorAnterior / valorBaseMesAnterior) * 100;
                    
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
                visualizacao.itens = await processarLista(config.componentes, mes, ano);
                break;

              case 'grafico':
                visualizacao.dados_grafico = await processarGrafico(config.componentes, mes, ano);
                break;
            }

            return visualizacao;
          })
        );

        // Atualiza o cache
        visualizacoesCache.set(cacheKey, {
          data: visualizacoesProcessadas,
          timestamp: Date.now()
        });

        setVisualizacoes(visualizacoesProcessadas);
      } catch (error) {
        console.error('Erro ao buscar visualizações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisualizacoes();
  }, [cacheKey]);

  return { visualizacoes, loading };
};

// Funções auxiliares otimizadas
async function processarCard(componentes: any[], mes: number, ano: number, ordem: number) {
  let valorAtual = 0;
  let valorAnterior = 0;

  // Se a ordem for 5, calcula o saldo acumulado
  if (ordem === 5) {
    // Calcula todos os meses até o mês atual
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
            })
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
              })
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
    // Para outras ordens, mantém o comportamento original
    const mesAnterior = mes === 0 ? 11 : mes - 1;
    const anoAnterior = mes === 0 ? ano - 1 : ano;

    await Promise.all(componentes.map(async (componente) => {
      const [lancamentosAtuais, lancamentosAnteriores] = await Promise.all([
        getLancamentos(mes, ano, {
          categoria_id: componente.categoria?.id,
          indicador_id: componente.indicador?.id,
          tabela_origem: componente.tabela_origem,
          todos: componente.todos,
        }),
        getLancamentos(mesAnterior, anoAnterior, {
          categoria_id: componente.categoria?.id,
          indicador_id: componente.indicador?.id,
          tabela_origem: componente.tabela_origem,
          todos: componente.todos,
        })
      ]);

      valorAtual += calcularSomaLancamentos(lancamentosAtuais);
      valorAnterior += calcularSomaLancamentos(lancamentosAnteriores);
    }));
  }

  return { valorAtual, valorAnterior };
}

async function processarLista(componentes: any[], mes: number, ano: number) {
  const itens = [];

  // Busca todos os lançamentos em paralelo
  const lancamentosPorComponente = await Promise.all(
    componentes.map(componente =>
      getLancamentos(mes, ano, {
        categoria_id: componente.categoria?.id,
        indicador_id: componente.indicador?.id,
        tabela_origem: componente.tabela_origem,
        todos: componente.todos,
      })
    )
  );

  // Processa os resultados
  lancamentosPorComponente.forEach(lancamentos => {
    lancamentos.forEach(lancamento => {
      itens.push({
        titulo: getTituloLancamento(lancamento),
        valor: lancamento.valor,
        tipo: lancamento.tipo,
      });
    });
  });

  return itens.sort((a, b) => b.valor - a.valor);
}

async function processarGrafico(componentes: any[], mes: number, ano: number) {
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

  // Busca dados para todos os meses em paralelo
  const dadosPorMes = await Promise.all(
    mesesProcessar.map(async ({ mes: mesAtual, ano: anoAtual }) => {
      const dadosMes: any = {
        name: `${mesAtual + 1}/${anoAtual}`
      };

      const lancamentosPorComponente = await Promise.all(
        componentes.map(async (componente) => {
          const lancamentos = await getLancamentos(mesAtual, anoAtual, {
            categoria_id: componente.categoria?.id,
            indicador_id: componente.indicador?.id,
            tabela_origem: componente.tabela_origem,
            todos: componente.todos,
          });

          const chave = componente.categoria?.nome || 
                       componente.indicador?.nome || 
                       'Total';

          return { chave, valor: calcularSomaLancamentos(lancamentos) };
        })
      );

      lancamentosPorComponente.forEach(({ chave, valor }) => {
        dadosMes[chave] = valor;
      });

      return dadosMes;
    })
  );

  return dadosPorMes;
}

function calcularSomaLancamentos(lancamentos: any[]) {
  return lancamentos.reduce((acc, lanc) => 
    acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor), 
    0
  );
}