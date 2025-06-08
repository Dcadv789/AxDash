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
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos (reduzido para atualizar mais frequentemente)

// Cache para lançamentos por período
const lancamentosCache = new Map<string, { data: any[]; timestamp: number }>();

export const getDreData = async (mes: number, ano: number): Promise<DreConta[]> => {
  try {
    // Cria uma chave única para o cache
    const cacheKey = `${mes}-${ano}`;
    
    // Verifica o cache
    const cached = dreCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    console.log('Iniciando busca de dados DRE...');
    const startTime = Date.now();

    // Busca todas as contas e componentes em paralelo
    const [contasResult, componentesResult] = await Promise.all([
      supabase
        .from('dre_contas')
        .select('*')
        .eq('ativo', true)
        .eq('visivel', true)
        .order('ordem'),
      supabase
        .from('dre_componentes')
        .select('*')
    ]);

    if (contasResult.error) throw contasResult.error;
    if (componentesResult.error) throw componentesResult.error;

    const contas = contasResult.data;
    const componentes = componentesResult.data;

    console.log(`Dados básicos carregados em ${Date.now() - startTime}ms`);

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

    console.log('Hierarquia organizada, iniciando cálculo de valores...');

    // Pré-carrega todos os lançamentos necessários em paralelo
    const periodosParaCarregar = [];
    for (let i = 0; i < 13; i++) {
      let mesAtual = mes - i;
      let anoAtual = ano;
      
      while (mesAtual < 0) {
        mesAtual += 12;
        anoAtual--;
      }
      
      periodosParaCarregar.push({ mes: mesAtual, ano: anoAtual });
    }

    // Agrupa componentes por tipo para otimizar consultas
    const componentesPorTipo = {
      categorias: new Set<string>(),
      indicadores: new Set<string>(),
      clientes: new Set<string>()
    };

    componentes.forEach(comp => {
      if (comp.categoria_id) componentesPorTipo.categorias.add(comp.categoria_id);
      if (comp.indicador_id) componentesPorTipo.indicadores.add(comp.indicador_id);
      if (comp.conta_id) componentesPorTipo.clientes.add(comp.conta_id);
    });

    // Carrega todos os lançamentos em paralelo para todos os períodos
    const lancamentosPorPeriodo = await Promise.all(
      periodosParaCarregar.map(async ({ mes: mesAtual, ano: anoAtual }) => {
        const cacheKeyLanc = `${mesAtual}-${anoAtual}`;
        const cachedLanc = lancamentosCache.get(cacheKeyLanc);
        
        if (cachedLanc && Date.now() - cachedLanc.timestamp < CACHE_DURATION) {
          return { periodo: { mes: mesAtual, ano: anoAtual }, lancamentos: cachedLanc.data };
        }

        // Busca todos os lançamentos do período de uma vez
        const { data: lancamentos, error } = await supabase
          .from('lancamentos')
          .select(`
            valor,
            tipo,
            categoria_id,
            indicador_id,
            cliente_id
          `)
          .eq('mes', mesAtual + 1)
          .eq('ano', anoAtual);

        if (error) {
          console.error('Erro ao buscar lançamentos:', error);
          return { periodo: { mes: mesAtual, ano: anoAtual }, lancamentos: [] };
        }

        const lancamentosData = lancamentos || [];
        
        // Atualiza cache de lançamentos
        lancamentosCache.set(cacheKeyLanc, {
          data: lancamentosData,
          timestamp: Date.now()
        });

        return { periodo: { mes: mesAtual, ano: anoAtual }, lancamentos: lancamentosData };
      })
    );

    console.log(`Lançamentos carregados em ${Date.now() - startTime}ms`);

    // Cria um mapa de lançamentos por período para acesso rápido
    const lancamentosPorPeriodoMap = new Map();
    lancamentosPorPeriodo.forEach(({ periodo, lancamentos }) => {
      const key = `${periodo.mes}-${periodo.ano}`;
      lancamentosPorPeriodoMap.set(key, lancamentos);
    });

    // Função otimizada para calcular valores
    const calcularValores = (conta: DreConta) => {
      // Busca componentes da conta
      const componentesConta = componentes.filter(c => c.dre_conta_id === conta.id);
      
      // Para cada mês no período
      for (let i = 0; i < 13; i++) {
        let mesAtual = mes - i;
        let anoAtual = ano;
        
        while (mesAtual < 0) {
          mesAtual += 12;
          anoAtual--;
        }

        const key = `${mesAtual}-${anoAtual}`;
        const lancamentosPeriodo = lancamentosPorPeriodoMap.get(key) || [];

        let valorMes = 0;

        // Processa cada componente
        for (const componente of componentesConta) {
          // Filtra lançamentos relevantes para este componente
          const lancamentosFiltrados = lancamentosPeriodo.filter(lanc => {
            if (componente.categoria_id && lanc.categoria_id === componente.categoria_id) return true;
            if (componente.indicador_id && lanc.indicador_id === componente.indicador_id) return true;
            if (componente.conta_id && lanc.cliente_id === componente.conta_id) return true;
            return false;
          });

          valorMes += lancamentosFiltrados.reduce((acc, lanc) => 
            acc + (lanc.tipo === 'Receita' ? lanc.valor : -lanc.valor), 
            0
          );
        }

        conta.valores_mensais[i] = valorMes;
      }

      // Calcula valor total (último mês)
      conta.valor = conta.valores_mensais[0];

      // Processa filhos recursivamente
      if (conta.children) {
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

    console.log(`Valores calculados em ${Date.now() - startTime}ms`);

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

    console.log(`DRE processado em ${Date.now() - startTime}ms`);

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