import { supabase } from '../lib/supabase';

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

export const getLancamentos = async (
  mes: number,
  ano: number,
  filtros?: { categoria_id?: string; indicador_id?: string }
) => {
  try {
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

    if (filtros?.categoria_id) {
      query.eq('categoria_id', filtros.categoria_id);
    }
    if (filtros?.indicador_id) {
      query.eq('indicador_id', filtros.indicador_id);
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