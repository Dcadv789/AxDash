import { supabase } from '../lib/supabase';
import { buscarIdsDisponiveis } from './componentesService';

export interface Lancamento {
  valor: number;
  tipo: 'Receita' | 'Despesa';
  categoria_id?: string;
  indicador_id?: string;
  cliente_id?: string;
  categoria?: { nome: string };
  indicador?: { nome: string };
  cliente?: { razao_social: string };
}

export interface ListItem {
  titulo: string;
  valor: number;
  tipo: string;
  variacao?: number;
}

interface ComponenteFiltro {
  categoria_id?: string;
  indicador_id?: string;
  cliente_id?: string;
  tabela_origem?: string;
  todos?: boolean;
}

export const getLancamentos = async (
  mes: number,
  ano: number,
  filtros?: ComponenteFiltro
) => {
  try {
    if (!filtros) return [];

    // Normalize table name if it's 'indicador'
    const filtrosNormalizados = {
      ...filtros,
      tabela_origem: filtros.tabela_origem === 'indicador' ? 'indicadores' : filtros.tabela_origem
    };

    const ids = await buscarIdsDisponiveis(filtrosNormalizados);
    if (ids.length === 0) return [];

    const query = supabase
      .from('lancamentos')
      .select(`
        valor,
        tipo,
        categoria_id,
        indicador_id,
        cliente_id,
        categoria:categorias(nome),
        indicador:indicadores(nome),
        cliente:clientes(razao_social)
      `)
      .eq('mes', mes + 1)
      .eq('ano', ano);

    // Se todos não for true, usa eq ao invés de in
    if (filtrosNormalizados.todos !== true) {
      if (filtrosNormalizados.categoria_id) {
        query.eq('categoria_id', filtrosNormalizados.categoria_id);
      }
      if (filtrosNormalizados.indicador_id) {
        query.eq('indicador_id', filtrosNormalizados.indicador_id);
      }
      if (filtrosNormalizados.cliente_id) {
        query.eq('cliente_id', filtrosNormalizados.cliente_id);
      }
    } else {
      // Se todos for true, usa in com todos os IDs disponíveis
      if (filtrosNormalizados.tabela_origem === 'categorias') {
        query.in('categoria_id', ids);
      } else if (filtrosNormalizados.tabela_origem === 'indicadores') {
        query.in('indicador_id', ids);
      } else if (filtrosNormalizados.tabela_origem === 'clientes') {
        query.in('cliente_id', ids);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Lancamento[];
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return [];
  }
};

export const getTituloLancamento = (lancamento: Lancamento): string => {
  if (lancamento.categoria?.nome) return lancamento.categoria.nome;
  if (lancamento.indicador?.nome) return lancamento.indicador.nome;
  if (lancamento.cliente?.razao_social) return lancamento.cliente.razao_social;
  return 'Sem título';
};