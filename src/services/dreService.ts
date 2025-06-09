import { supabase } from '../lib/supabase';
import { getLancamentos } from './lancamentosService';

interface DreConta {
  id: string;
  nome: string;
  simbolo: string;
  ordem: number;
  conta_pai?: string;
  children?: DreConta[];
  valor: number;
  valores_mensais: number[];
  expanded?: boolean;
}

interface DreComponente {
  dre_conta_id: string;
  categoria_id?: string;
  indicador_id?: string;
  conta_id?: string;
}

// Cache para armazenar os resultados
const dreCache = new Map<string, { data: DreConta[]; timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

// Cache para lançamentos por período e empresa - mais agressivo
const lancamentosEmpresaCache = new Map<string, { data: any[]; timestamp: number }>();
const LANCAMENTOS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Cache para composição de indicadores
const indicadoresComposicaoCache = new Map<string, { componentes: any[]; timestamp: number }>();
const INDICADORES_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Cache global para todos os indicadores
const todosIndicadoresCache = new Map<string, { indicadores: any[]; timestamp: number }>();

// Função para buscar TODOS os lançamentos de uma empresa em um período
async function buscarTodosLancamentosEmpresa(mes: number, ano: number, empresaId: string): Promise<any[]> {
  const cacheKey = `lancamentos-${mes}-${ano}-${empresaId}`;
  
  // Verifica cache
  const cached = lancamentosEmpresaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < LANCAMENTOS_CACHE_DURATION) {
    return cached.data;
  }

  try {
    const { data: lancamentos, error } = await supabase
      .from('lancamentos')
      .select(`
        valor,
        tipo,
        categoria_id,
        indicador_id,
        cliente_id
      `)
      .eq('mes', mes + 1)
      .eq('ano', ano)
      .eq('empresa_id', empresaId);

    if (error) throw error;

    const result = lancamentos || [];
    
    // Atualiza cache
    lancamentosEmpresaCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Erro ao buscar lançamentos da empresa:', error);
    return [];
  }
}

// Função para buscar TODAS as composições de indicadores de uma vez
async function buscarTodasComposicoesIndicadores(): Promise<Map<string, any[]>> {
  const cacheKey = 'todas-composicoes';
  
  // Verifica cache
  const cached = todosIndicadoresCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < INDICADORES_CACHE_DURATION) {
    return new Map(cached.indicadores);
  }

  try {
    const { data, error } = await supabase
      .from('indicadores_composicao')
      .select(`
        indicador_base_id,
        componente_indicador_id,
        componente_categoria_id
      `);

    if (error) throw error;

    // Organiza por indicador base
    const composicoesPorIndicador = new Map<string, any[]>();
    (data || []).forEach(comp => {
      if (!composicoesPorIndicador.has(comp.indicador_base_id)) {
        composicoesPorIndicador.set(comp.indicador_base_id, []);
      }
      composicoesPorIndicador.get(comp.indicador_base_id)!.push(comp);
    });

    // Atualiza cache
    todosIndicadoresCache.set(cacheKey, {
      indicadores: Array.from(composicoesPorIndicador.entries()),
      timestamp: Date.now()
    });

    return composicoesPorIndicador;
  } catch (error) {
    console.error('Erro ao buscar composições de indicadores:', error);
    return new Map();
  }
}

// Função otimizada para resolver indicadores recursivamente usando dados em memória
function resolverIndicadorRecursivo(
  indicadorId: string,
  lancamentosPorCategoria: Map<string, any[]>,
  lancamentosPorIndicador: Map<string, any[]>,
  composicoesPorIndicador: Map<string, any[]>,
  visitados = new Set<string>()
): any[] {
  // Evita loops infinitos
  if (visitados.has(indicadorId)) {
    return [];
  }
  visitados.add(indicadorId);

  let todosLancamentos: any[] = [];

  // Adiciona lançamentos diretos do indicador
  const lancamentosDiretos = lancamentosPorIndicador.get(indicadorId) || [];
  todosLancamentos.push(...lancamentosDiretos);

  // Busca composição do indicador
  const componentes = composicoesPorIndicador.get(indicadorId) || [];

  // Processa cada componente
  for (const componente of componentes) {
    // Se tem indicador componente, busca recursivamente
    if (componente.componente_indicador_id) {
      const lancamentosIndicador = resolverIndicadorRecursivo(
        componente.componente_indicador_id,
        lancamentosPorCategoria,
        lancamentosPorIndicador,
        composicoesPorIndicador,
        new Set(visitados) // Nova instância para evitar conflitos
      );
      todosLancamentos.push(...lancamentosIndicador);
    }

    // Se tem categoria componente, adiciona lançamentos da categoria
    if (componente.componente_categoria_id) {
      const lancamentosCategoria = lancamentosPorCategoria.get(componente.componente_categoria_id) || [];
      todosLancamentos.push(...lancamentosCategoria);
    }
  }

  return todosLancamentos;
}

export const getDreData = async (mes: number, ano: number, empresaId?: string): Promise<DreConta[]> => {
  try {
    // Se não há empresa selecionada, retorna vazio
    if (!empresaId) {
      return [];
    }

    // Cria uma chave única para o cache incluindo a empresa
    const cacheKey = `${mes}-${ano}-${empresaId}`;
    
    // Verifica o cache
    const cached = dreCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    console.log('🚀 Iniciando busca OTIMIZADA de dados DRE para empresa:', empresaId);
    const startTime = Date.now();

    // Primeiro, busca as contas DRE que pertencem à empresa
    const { data: dreEmpresas, error: dreEmpresasError } = await supabase
      .from('dre_empresas')
      .select('dre_conta_id')
      .eq('empresa_id', empresaId);

    if (dreEmpresasError) throw dreEmpresasError;

    // Se não há contas para esta empresa, retorna vazio
    if (!dreEmpresas || dreEmpresas.length === 0) {
      console.log('Nenhuma conta DRE encontrada para a empresa:', empresaId);
      return [];
    }

    const contasIdsPermitidos = dreEmpresas.map(de => de.dre_conta_id);

    // Busca dados básicos em paralelo
    const [contasResult, componentesResult, composicoesPorIndicador] = await Promise.all([
      supabase
        .from('dre_contas')
        .select('*')
        .in('id', contasIdsPermitidos)
        .eq('ativo', true)
        .eq('visivel', true)
        .order('ordem'),
      supabase
        .from('dre_componentes')
        .select('*')
        .in('dre_conta_id', contasIdsPermitidos),
      buscarTodasComposicoesIndicadores()
    ]);

    if (contasResult.error) throw contasResult.error;
    if (componentesResult.error) throw componentesResult.error;

    const contas = contasResult.data;
    const componentes = componentesResult.data;

    console.log(`⚡ Dados básicos carregados em ${Date.now() - startTime}ms`);

    // Mapa para armazenar as contas processadas
    const contasMap = new Map<string, DreConta>();
    const contasRaiz: DreConta[] = [];

    // Primeiro passo: criar objetos DreConta básicos
    for (const conta of contas) {
      const contaProcessada: DreConta = {
        id: conta.id,
        nome: conta.nome,
        simbolo: conta.simbolo,
        ordem: conta.ordem,
        conta_pai: conta.conta_pai,
        children: [],
        valor: 0,
        valores_mensais: Array(13).fill(0),
        expanded: true
      };
      contasMap.set(conta.id, contaProcessada);
    }

    // Segundo passo: organizar hierarquia
    contasMap.forEach(conta => {
      if (conta.conta_pai && contasMap.has(conta.conta_pai)) {
        contasMap.get(conta.conta_pai)?.children?.push(conta);
      } else {
        contasRaiz.push(conta);
      }
    });

    console.log('📊 Hierarquia organizada, carregando TODOS os lançamentos...');

    // OTIMIZAÇÃO PRINCIPAL: Carrega TODOS os lançamentos de TODOS os períodos de UMA VEZ
    const periodosParaCarregar = [];
    for (let i = 0; i < 13; i++) {
      let mesAtual = mes - i;
      let anoAtual = ano;
      
      while (mesAtual < 0) {
        mesAtual += 12;
        anoAtual--;
      }
      
      periodosParaCarregar.push({ mes: mesAtual, ano: anoAtual, indice: i });
    }

    // Carrega todos os lançamentos de todos os períodos em paralelo
    const lancamentosPorPeriodo = await Promise.all(
      periodosParaCarregar.map(async ({ mes: mesAtual, ano: anoAtual, indice }) => {
        const lancamentos = await buscarTodosLancamentosEmpresa(mesAtual, anoAtual, empresaId);
        return { indice, lancamentos };
      })
    );

    console.log(`🔥 TODOS os lançamentos carregados em ${Date.now() - startTime}ms`);

    // Organiza lançamentos por período e por tipo para acesso O(1)
    const lancamentosPorPeriodoOrganizados = lancamentosPorPeriodo.map(({ indice, lancamentos }) => {
      const porCategoria = new Map<string, any[]>();
      const porIndicador = new Map<string, any[]>();
      const porCliente = new Map<string, any[]>();

      lancamentos.forEach(lanc => {
        if (lanc.categoria_id) {
          if (!porCategoria.has(lanc.categoria_id)) {
            porCategoria.set(lanc.categoria_id, []);
          }
          porCategoria.get(lanc.categoria_id)!.push(lanc);
        }

        if (lanc.indicador_id) {
          if (!porIndicador.has(lanc.indicador_id)) {
            porIndicador.set(lanc.indicador_id, []);
          }
          porIndicador.get(lanc.indicador_id)!.push(lanc);
        }

        if (lanc.cliente_id) {
          if (!porCliente.has(lanc.cliente_id)) {
            porCliente.set(lanc.cliente_id, []);
          }
          porCliente.get(lanc.cliente_id)!.push(lanc);
        }
      });

      return {
        indice,
        porCategoria,
        porIndicador,
        porCliente
      };
    });

    console.log('🎯 Lançamentos organizados, iniciando cálculos...');

    // Função SUPER OTIMIZADA para calcular valores
    const calcularValores = (conta: DreConta) => {
      // Busca componentes da conta
      const componentesConta = componentes.filter(c => c.dre_conta_id === conta.id);
      
      // Para cada período
      lancamentosPorPeriodoOrganizados.forEach(({ indice, porCategoria, porIndicador, porCliente }) => {
        let valorMes = 0;

        // Processa cada componente
        for (const componente of componentesConta) {
          let lancamentosComponente: any[] = [];

          // Se tem categoria, busca lançamentos da categoria (O(1))
          if (componente.categoria_id) {
            const lancamentosCategoria = porCategoria.get(componente.categoria_id) || [];
            lancamentosComponente.push(...lancamentosCategoria);
          }

          // Se tem indicador, resolve recursivamente usando dados em memória
          if (componente.indicador_id) {
            const lancamentosIndicador = resolverIndicadorRecursivo(
              componente.indicador_id,
              porCategoria,
              porIndicador,
              composicoesPorIndicador
            );
            lancamentosComponente.push(...lancamentosIndicador);
          }

          // Se tem conta (cliente), busca lançamentos do cliente (O(1))
          if (componente.conta_id) {
            const lancamentosCliente = porCliente.get(componente.conta_id) || [];
            lancamentosComponente.push(...lancamentosCliente);
          }

          // Soma os valores dos lançamentos
          valorMes += lancamentosComponente.reduce((acc, lanc) => 
            acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor), 
            0
          );
        }

        conta.valores_mensais[indice] = valorMes;
      });

      // Calcula valor total (último mês)
      conta.valor = conta.valores_mensais[0];

      // Processa filhos recursivamente
      if (conta.children && conta.children.length > 0) {
        conta.children.forEach(child => calcularValores(child));
        
        // Soma valores dos filhos
        for (let i = 0; i < 13; i++) {
          conta.valores_mensais[i] += conta.children.reduce(
            (acc, child) => acc + child.valores_mensais[i],
            0
          );
        }
        conta.valor = conta.valores_mensais[0];
      }
    };

    // Calcula valores para todas as contas raiz
    contasRaiz.forEach(conta => calcularValores(conta));

    console.log(`💨 Valores calculados em ${Date.now() - startTime}ms`);

    // Ordena as contas por ordem
    const ordenarContas = (contas: DreConta[]) => {
      contas.sort((a, b) => a.ordem - b.ordem);
      contas.forEach(conta => {
        if (conta.children && conta.children.length > 0) {
          ordenarContas(conta.children);
        }
      });
    };
    ordenarContas(contasRaiz);

    console.log(`🚀 DRE OTIMIZADO processado em ${Date.now() - startTime}ms para empresa ${empresaId}`);

    // Atualiza o cache
    dreCache.set(cacheKey, {
      data: contasRaiz,
      timestamp: Date.now()
    });

    return contasRaiz;
  } catch (error) {
    console.error('Erro ao buscar dados do DRE:', error);
    return [];
  }
};