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

// Cache para armazenar os resultados das consultas
const lancamentosCache = new Map<string, { data: Lancamento[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Cache para composição de indicadores
const indicadoresComposicaoCache = new Map<string, { componentes: any[]; timestamp: number }>();

// Função para buscar vendas de clientes
async function buscarVendasClientes(mes: number, ano: number): Promise<Lancamento[]> {
  const startDate = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
  const endDate = mes === 11 
    ? `${ano + 1}-01-01`
    : `${ano}-${String(mes + 2).padStart(2, '0')}-01`;

  const { data: vendas = [] } = await supabase
    .from('registro_de_vendas')
    .select(`
      id,
      valor,
      cliente:cliente_id(id, razao_social)
    `)
    .gte('data_venda', startDate)
    .lt('data_venda', endDate)
    .order('valor', { ascending: false });

  return vendas.map(venda => ({
    valor: venda.valor,
    tipo: 'Receita',
    cliente_id: venda.cliente?.id,
    cliente: venda.cliente
  }));
}

// Função auxiliar para buscar a composição de um indicador
async function buscarComposicaoIndicador(indicadorId: string): Promise<any[]> {
  // Verifica o cache
  const cached = indicadoresComposicaoCache.get(indicadorId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.componentes;
  }

  const { data, error } = await supabase
    .from('indicadores_composicao')
    .select(`
      indicador_base_id,
      componente_indicador_id,
      componente_categoria_id
    `)
    .eq('indicador_base_id', indicadorId);

  if (error) {
    console.error('Erro ao buscar composição do indicador:', error);
    return [];
  }

  // Atualiza o cache
  indicadoresComposicaoCache.set(indicadorId, {
    componentes: data || [],
    timestamp: Date.now()
  });

  return data || [];
}

// Função recursiva para buscar lançamentos de um indicador e seus componentes
async function buscarLancamentosRecursivos(
  mes: number,
  ano: number,
  indicadorId: string,
  visitados = new Set<string>()
): Promise<Lancamento[]> {
  // Evita loops infinitos
  if (visitados.has(indicadorId)) {
    return [];
  }
  visitados.add(indicadorId);

  // Busca os lançamentos diretos do indicador
  const { data: lancamentosDiretos = [] } = await supabase
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
    .eq('ano', ano)
    .eq('indicador_id', indicadorId);

  // Busca a composição do indicador
  const componentes = await buscarComposicaoIndicador(indicadorId);

  // Busca lançamentos recursivamente para cada componente
  const lancamentosComponentes = await Promise.all(
    componentes.map(async (componente) => {
      const lancamentos: Lancamento[] = [];

      // Se tem indicador componente, busca recursivamente
      if (componente.componente_indicador_id) {
        const lancamentosIndicador = await buscarLancamentosRecursivos(
          mes,
          ano,
          componente.componente_indicador_id,
          visitados
        );
        lancamentos.push(...lancamentosIndicador);
      }

      // Se tem categoria componente, busca os lançamentos
      if (componente.componente_categoria_id) {
        const { data: lancamentosCategoria = [] } = await supabase
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
          .eq('ano', ano)
          .eq('categoria_id', componente.componente_categoria_id);

        lancamentos.push(...lancamentosCategoria);
      }

      return lancamentos;
    })
  );

  // Combina todos os lançamentos
  return [...lancamentosDiretos, ...lancamentosComponentes.flat()];
}

export const getLancamentos = async (
  mes: number,
  ano: number,
  filtros?: ComponenteFiltro
) => {
  try {
    if (!filtros) return [];

    // Se a tabela_origem for registro_venda, busca as vendas dos clientes
    if (filtros.tabela_origem === 'registro_venda') {
      return buscarVendasClientes(mes, ano);
    }

    // Cria uma chave única para o cache
    const cacheKey = `${mes}-${ano}-${JSON.stringify(filtros)}`;
    
    // Verifica o cache
    const cached = lancamentosCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    let lancamentos: Lancamento[] = [];

    if (filtros.indicador_id) {
      // Se temos um indicador específico, usamos a busca recursiva
      lancamentos = await buscarLancamentosRecursivos(mes, ano, filtros.indicador_id);
    } else {
      // Para outros casos, mantemos a lógica original
      const ids = await buscarIdsDisponiveis(filtros);
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

      if (filtros.todos !== true) {
        if (filtros.categoria_id) {
          query.eq('categoria_id', filtros.categoria_id);
        }
        if (filtros.cliente_id) {
          query.eq('cliente_id', filtros.cliente_id);
        }
      } else {
        const campo = {
          categorias: 'categoria_id',
          indicadores: 'indicador_id',
          clientes: 'cliente_id'
        }[filtros.tabela_origem as string];

        if (campo) {
          query.in(campo, ids);
        }
      }

      const { data } = await query;
      lancamentos = data || [];
    }

    // Atualiza o cache
    lancamentosCache.set(cacheKey, {
      data: lancamentos,
      timestamp: Date.now()
    });

    return lancamentos;
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return [];
  }
};

export const getTituloLancamento = (lancamento: Lancamento): string => {
  if (lancamento.cliente?.razao_social) return lancamento.cliente.razao_social;
  if (lancamento.categoria?.nome) return lancamento.categoria.nome;
  if (lancamento.indicador?.nome) return lancamento.indicador.nome;
  return 'Sem título';
};