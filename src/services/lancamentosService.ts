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

// Cache mais agressivo para lançamentos POR EMPRESA
const lancamentosCache = new Map<string, { data: Lancamento[]; timestamp: number }>();
const CACHE_DURATION = 90 * 1000; // 90 segundos - cache mais agressivo

// Cache para composição de indicadores
const indicadoresComposicaoCache = new Map<string, { componentes: any[]; timestamp: number }>();
const INDICADORES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Cache para vendas de clientes POR EMPRESA
const vendasClientesCache = new Map<string, { data: Lancamento[]; timestamp: number }>();

// Função melhorada para detectar e tratar erros de conectividade/CORS
function handleConnectionError(error: any, context: string): never {
  console.error(`${context}:`, error);
  
  // Detecta diferentes tipos de erros de conectividade
  const isConnectionError = 
    error.message?.includes('Failed to fetch') || 
    error.name === 'TypeError' || 
    error.message?.includes('NetworkError') ||
    error.message?.includes('fetch') ||
    error.message?.includes('CORS') ||
    error.code === 'NETWORK_ERROR' ||
    error.status === 0;

  if (isConnectionError) {
    throw new Error(`CORS_ERROR: Erro de conectividade detectado. Para resolver este problema:

1. Acesse o painel do Supabase (https://supabase.com/dashboard)
2. Vá para Configurações do Projeto > API
3. Na seção "CORS origins", adicione: http://localhost:5173
4. Salve as alterações e recarregue a página

Detalhes técnicos: ${error.message || 'Falha na comunicação com o servidor'}`);
  }
  
  throw new Error(`${context}: ${error.message || 'Erro desconhecido'}`);
}

// Função otimizada para buscar vendas de clientes FILTRADA POR EMPRESA
async function buscarVendasClientes(mes: number, ano: number, empresaId?: string): Promise<Lancamento[]> {
  const cacheKey = `vendas-${mes}-${ano}-${empresaId || 'all'}`;
  
  // Verifica cache primeiro
  const cached = vendasClientesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const startDate = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
    const endDate = mes === 11 
      ? `${ano + 1}-01-01`
      : `${ano}-${String(mes + 2).padStart(2, '0')}-01`;

    let query = supabase
      .from('registro_de_vendas')
      .select(`
        id,
        valor,
        cliente:cliente_id(id, razao_social)
      `)
      .gte('data_venda', startDate)
      .lt('data_venda', endDate);

    // FILTRO CRÍTICO: Aplica filtro de empresa se fornecido
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }

    const { data: vendas, error } = await query
      .order('valor', { ascending: false })
      .limit(100); // Limita para performance

    if (error) {
      handleConnectionError(error, 'Erro ao buscar vendas de clientes');
    }

    const result = (vendas || []).map(venda => ({
      valor: venda.valor,
      tipo: 'Receita' as const,
      cliente_id: venda.cliente?.id,
      cliente: venda.cliente
    }));

    // Atualiza cache
    vendasClientesCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('CORS_ERROR')) {
      throw error;
    }
    console.error('Erro ao buscar vendas de clientes:', error);
    // Retorna array vazio em caso de erro para não quebrar a aplicação
    return [];
  }
}

// Função auxiliar otimizada para buscar a composição de um indicador
async function buscarComposicaoIndicador(indicadorId: string): Promise<any[]> {
  try {
    // Verifica o cache
    const cached = indicadoresComposicaoCache.get(indicadorId);
    if (cached && Date.now() - cached.timestamp < INDICADORES_CACHE_DURATION) {
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
      handleConnectionError(error, 'Erro ao buscar composição do indicador');
    }

    const componentes = data || [];

    // Atualiza o cache
    indicadoresComposicaoCache.set(indicadorId, {
      componentes,
      timestamp: Date.now()
    });

    return componentes;
  } catch (error) {
    if (error instanceof Error && error.message.includes('CORS_ERROR')) {
      throw error;
    }
    console.error('Erro ao buscar composição do indicador:', error);
    // Retorna array vazio em caso de erro para não quebrar a aplicação
    return [];
  }
}

// Cache para lançamentos recursivos POR EMPRESA
const recursiveCache = new Map<string, { data: Lancamento[]; timestamp: number }>();

// Função recursiva otimizada para buscar lançamentos de um indicador FILTRADA POR EMPRESA
async function buscarLancamentosRecursivos(
  mes: number,
  ano: number,
  indicadorId: string,
  empresaId?: string,
  visitados = new Set<string>()
): Promise<Lancamento[]> {
  try {
    // Evita loops infinitos
    if (visitados.has(indicadorId)) {
      return [];
    }
    visitados.add(indicadorId);

    // Verifica cache recursivo COM EMPRESA
    const cacheKey = `recursive-${mes}-${ano}-${indicadorId}-${empresaId || 'all'}`;
    const cached = recursiveCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Busca os lançamentos diretos do indicador FILTRADOS POR EMPRESA
    let queryDiretos = supabase
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

    // FILTRO CRÍTICO: Aplica filtro de empresa
    if (empresaId) {
      queryDiretos = queryDiretos.eq('empresa_id', empresaId);
    }

    const { data: lancamentosDiretos, error: errorDiretos } = await queryDiretos;

    if (errorDiretos) {
      handleConnectionError(errorDiretos, 'Erro ao buscar lançamentos diretos');
    }

    // Busca a composição do indicador
    const componentes = await buscarComposicaoIndicador(indicadorId);

    // Busca lançamentos recursivamente para cada componente em paralelo
    const lancamentosComponentes = await Promise.all(
      componentes.map(async (componente) => {
        const lancamentos: Lancamento[] = [];

        try {
          // Se tem indicador componente, busca recursivamente
          if (componente.componente_indicador_id) {
            const lancamentosIndicador = await buscarLancamentosRecursivos(
              mes,
              ano,
              componente.componente_indicador_id,
              empresaId, // PASSA A EMPRESA PARA A RECURSÃO
              new Set(visitados) // Cria nova instância para evitar conflitos
            );
            lancamentos.push(...lancamentosIndicador);
          }

          // Se tem categoria componente, busca os lançamentos FILTRADOS POR EMPRESA
          if (componente.componente_categoria_id) {
            let queryCategoria = supabase
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

            // FILTRO CRÍTICO: Aplica filtro de empresa
            if (empresaId) {
              queryCategoria = queryCategoria.eq('empresa_id', empresaId);
            }

            const { data: lancamentosCategoria, error: errorCategoria } = await queryCategoria;

            if (errorCategoria) {
              handleConnectionError(errorCategoria, 'Erro ao buscar lançamentos da categoria');
            }
            
            lancamentos.push(...(lancamentosCategoria || []));
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('CORS_ERROR')) {
            // Re-propaga erros de CORS para serem tratados no nível superior
            throw error;
          }
          console.error('Erro ao processar componente:', error);
          // Continua com array vazio para este componente
        }

        return lancamentos;
      })
    );

    // Combina todos os lançamentos
    const result = [...(lancamentosDiretos || []), ...lancamentosComponentes.flat()];
    
    // Atualiza cache
    recursiveCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('CORS_ERROR')) {
      throw error;
    }
    console.error('Erro na busca recursiva de lançamentos:', error);
    // Retorna array vazio em caso de erro para não quebrar a aplicação
    return [];
  }
}

export const getLancamentos = async (
  mes: number,
  ano: number,
  filtros?: ComponenteFiltro,
  empresaId?: string // NOVO PARÂMETRO PARA FILTRAR POR EMPRESA
) => {
  try {
    if (!filtros) return [];

    // Se a tabela_origem for registro_venda, busca as vendas dos clientes FILTRADAS POR EMPRESA
    if (filtros.tabela_origem === 'registro_venda') {
      return buscarVendasClientes(mes, ano, empresaId);
    }

    // Cria uma chave única para o cache COM EMPRESA
    const cacheKey = `${mes}-${ano}-${JSON.stringify(filtros)}-${empresaId || 'all'}`;
    
    // Verifica o cache
    const cached = lancamentosCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    let lancamentos: Lancamento[] = [];

    if (filtros.indicador_id) {
      // Se temos um indicador específico, usamos a busca recursiva otimizada COM FILTRO DE EMPRESA
      lancamentos = await buscarLancamentosRecursivos(mes, ano, filtros.indicador_id, empresaId);
    } else {
      // Para outros casos, otimiza a consulta COM FILTRO DE EMPRESA
      const ids = await buscarIdsDisponiveis(filtros);
      if (ids.length === 0) return [];

      let query = supabase
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

      // FILTRO CRÍTICO: Aplica filtro de empresa SEMPRE
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      // Aplica filtros de forma otimizada
      if (filtros.todos !== true) {
        if (filtros.categoria_id) {
          query = query.eq('categoria_id', filtros.categoria_id);
        }
        if (filtros.cliente_id) {
          query = query.eq('cliente_id', filtros.cliente_id);
        }
      } else {
        const campo = {
          categorias: 'categoria_id',
          indicadores: 'indicador_id',
          clientes: 'cliente_id'
        }[filtros.tabela_origem as string];

        if (campo && ids.length > 0) {
          // Limita a consulta para evitar queries muito grandes
          const idsLimitados = ids.slice(0, 50);
          query = query.in(campo, idsLimitados);
        }
      }

      // Adiciona limite para performance
      query = query.limit(1000);

      const { data, error } = await query;
      
      if (error) {
        handleConnectionError(error, 'Erro ao buscar lançamentos');
      }

      lancamentos = data || [];
    }

    // Atualiza o cache
    lancamentosCache.set(cacheKey, {
      data: lancamentos,
      timestamp: Date.now()
    });

    return lancamentos;
  } catch (error) {
    if (error instanceof Error && error.message.includes('CORS_ERROR')) {
      throw error;
    }
    console.error('Erro ao buscar lançamentos:', error);
    // Retorna array vazio em caso de erro para não quebrar a aplicação
    return [];
  }
};

export const getTituloLancamento = (lancamento: Lancamento): string => {
  if (lancamento.cliente?.razao_social) return lancamento.cliente.razao_social;
  if (lancamento.categoria?.nome) return lancamento.categoria.nome;
  if (lancamento.indicador?.nome) return lancamento.indicador.nome;
  return 'Sem título';
};