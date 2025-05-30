import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getLancamentos, getTituloLancamento, ListItem, Lancamento } from '../services/lancamentosService';

export interface Visualizacao {
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
  itens?: ListItem[];
}

interface Componente {
  id: string;
  categoria_id?: string;
  indicador_id?: string;
  tabela_origem?: string;
  todos?: boolean;
}

export const useVisualizacoes = (empresaId: string, mes: number, ano: number) => {
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loading, setLoading] = useState(true);

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

    return getLancamentos(mesAnterior, anoAnterior, componente);
  };

  const processarLancamentos = (
    lancamentosAtuais: Lancamento[],
    lancamentosAnteriores: Lancamento[],
    tipoVisualizacao: string
  ) => {
    let valorAtual = 0;
    let itens: ListItem[] = [];

    lancamentosAtuais.forEach(lancamento => {
      const valorLancamento = lancamento.tipo === 'Receita' ? lancamento.valor : -lancamento.valor;
      valorAtual += valorLancamento;

      if (tipoVisualizacao === 'lista') {
        const lancamentoAnterior = lancamentosAnteriores.find(l => 
          (l.categoria_id && l.categoria_id === lancamento.categoria_id) ||
          (l.indicador_id && l.indicador_id === lancamento.indicador_id) ||
          (l.cliente_id && l.cliente_id === lancamento.cliente_id)
        );
        
        const valorAnterior = lancamentoAnterior ? lancamentoAnterior.valor : 0;
        const variacao = valorAnterior ? ((lancamento.valor - valorAnterior) / valorAnterior) * 100 : 0;

        itens.push({
          titulo: getTituloLancamento(lancamento),
          valor: Math.abs(lancamento.valor),
          tipo: lancamento.tipo,
          variacao
        });
      }
    });

    return { valorAtual, itens };
  };

  const fetchVisualizacoes = async () => {
    try {
      // Se não houver empresa selecionada, retorna array vazio
      if (!empresaId) {
        setVisualizacoes([]);
        setLoading(false);
        return;
      }

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
          let itens: ListItem[] = [];

          if (visualizacao.config_visualizacoes_componentes) {
            for (const componente of visualizacao.config_visualizacoes_componentes) {
              const lancamentosAtuais = await getLancamentos(mes, ano, componente);
              const lancamentosAnteriores = await calcularValorAnterior(componente, mes, ano);

              const { valorAtual: valorComponente, itens: itensComponente } = processarLancamentos(
                lancamentosAtuais,
                lancamentosAnteriores,
                visualizacao.tipo_visualizacao
              );

              valorAtual += valorComponente;
              itens = [...itens, ...itensComponente];

              const { valorAtual: valorAnteriorComponente } = processarLancamentos(
                lancamentosAnteriores,
                [],
                visualizacao.tipo_visualizacao
              );
              valorAnterior += valorAnteriorComponente;
            }

            if (visualizacao.tipo_visualizacao === 'lista') {
              itens = itens
                .reduce((acc: ListItem[], current) => {
                  const x = acc.find(item => item.titulo === current.titulo);
                  if (!x) return acc.concat([current]);
                  return acc;
                }, [])
                .sort((a, b) => b.valor - a.valor)
                .slice(0, 10);
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
      setVisualizacoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualizacoes();
  }, [empresaId, mes, ano]);

  return { visualizacoes, loading };
};