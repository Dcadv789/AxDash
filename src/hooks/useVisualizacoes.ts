import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getLancamentos, getTituloLancamento } from '../services/lancamentosService';

interface Visualizacao {
  id: string;
  nome_exibicao: string;
  descricao: string;
  tipo_visualizacao: 'card' | 'grafico' | 'lista';
  tipo_grafico?: 'line' | 'bar' | 'area';
  ordem: number;
  valor_atual?: number;
  valor_anterior?: number;
  itens?: any[];
  dados_grafico?: any[];
}

export const useVisualizacoes = (empresaId: string, mes: number, ano: number) => {
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisualizacoes = async () => {
      if (!empresaId) {
        setVisualizacoes([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Busca as configurações de visualização
        const { data: configVisualizacoes, error } = await supabase
          .from('config_visualizacoes')
          .select(`
            *,
            componentes:config_visualizacoes_componentes(
              *,
              categoria:categorias(id, nome),
              indicador:indicadores(id, nome)
            )
          `)
          .order('ordem');

        if (error) throw error;

        // Para cada visualização, processa os dados
        const visualizacoesProcessadas = await Promise.all(
          configVisualizacoes.map(async (config) => {
            const visualizacao: Visualizacao = {
              id: config.id,
              nome_exibicao: config.nome_exibicao,
              descricao: config.descricao,
              tipo_visualizacao: config.tipo_visualizacao,
              tipo_grafico: config.tipo_grafico,
              ordem: config.ordem,
            };

            // Processa os componentes associados
            if (config.componentes) {
              if (config.tipo_visualizacao === 'card') {
                let valorAtual = 0;
                let valorAnterior = 0;

                // Calcula o valor atual
                for (const componente of config.componentes) {
                  const lancamentosAtuais = await getLancamentos(mes, ano, {
                    categoria_id: componente.categoria?.id,
                    indicador_id: componente.indicador?.id,
                    tabela_origem: componente.tabela_origem,
                    todos: componente.todos,
                  });

                  valorAtual += lancamentosAtuais.reduce((acc, lanc) => {
                    return acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor);
                  }, 0);

                  // Calcula o valor do mês anterior
                  const mesAnterior = mes === 0 ? 11 : mes - 1;
                  const anoAnterior = mes === 0 ? ano - 1 : ano;
                  
                  const lancamentosAnteriores = await getLancamentos(mesAnterior, anoAnterior, {
                    categoria_id: componente.categoria?.id,
                    indicador_id: componente.indicador?.id,
                    tabela_origem: componente.tabela_origem,
                    todos: componente.todos,
                  });

                  valorAnterior += lancamentosAnteriores.reduce((acc, lanc) => {
                    return acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor);
                  }, 0);
                }

                visualizacao.valor_atual = valorAtual;
                visualizacao.valor_anterior = valorAnterior;
              } else if (config.tipo_visualizacao === 'lista') {
                const itens = [];

                for (const componente of config.componentes) {
                  const lancamentos = await getLancamentos(mes, ano, {
                    categoria_id: componente.categoria?.id,
                    indicador_id: componente.indicador?.id,
                    tabela_origem: componente.tabela_origem,
                    todos: componente.todos,
                  });

                  for (const lancamento of lancamentos) {
                    itens.push({
                      titulo: getTituloLancamento(lancamento),
                      valor: lancamento.valor,
                      tipo: lancamento.tipo,
                    });
                  }
                }

                visualizacao.itens = itens.sort((a, b) => b.valor - a.valor);
              } else if (config.tipo_visualizacao === 'grafico') {
                const dadosGrafico = [];
                const meses = [];

                // Gera array com os últimos 13 meses
                for (let i = 12; i >= 0; i--) {
                  let mesAtual = mes - i;
                  let anoAtual = ano;

                  while (mesAtual < 0) {
                    mesAtual += 12;
                    anoAtual--;
                  }

                  meses.push({ mes: mesAtual, ano: anoAtual });
                }

                // Para cada mês, busca os dados de todos os componentes
                for (const { mes: mesFiltro, ano: anoFiltro } of meses) {
                  const dadosMes: any = {
                    name: new Date(anoFiltro, mesFiltro).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    }).replace(' de ', '/')
                  };

                  for (const componente of config.componentes) {
                    const lancamentos = await getLancamentos(mesFiltro, anoFiltro, {
                      categoria_id: componente.categoria?.id,
                      indicador_id: componente.indicador?.id,
                      tabela_origem: componente.tabela_origem,
                      todos: componente.todos,
                    });

                    const valor = lancamentos.reduce((acc, lanc) => {
                      return acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor);
                    }, 0);

                    const chave = componente.categoria?.nome || 
                                componente.indicador?.nome || 
                                'Total';

                    dadosMes[chave] = valor;
                  }

                  dadosGrafico.push(dadosMes);
                }

                visualizacao.dados_grafico = dadosGrafico;
              }
            }

            return visualizacao;
          })
        );

        setVisualizacoes(visualizacoesProcessadas);
      } catch (error) {
        console.error('Erro ao buscar visualizações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisualizacoes();
  }, [empresaId, mes, ano]);

  return { visualizacoes, loading };
};