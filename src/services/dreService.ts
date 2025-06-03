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
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getDreData = async (mes: number, ano: number): Promise<DreConta[]> => {
  try {
    // Cria uma chave única para o cache
    const cacheKey = `${mes}-${ano}`;
    
    // Verifica o cache
    const cached = dreCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Busca todas as contas ativas e visíveis
    const { data: contas, error: contasError } = await supabase
      .from('dre_contas')
      .select('*')
      .eq('ativo', true)
      .eq('visivel', true)
      .order('ordem');

    if (contasError) throw contasError;

    // Busca todos os componentes
    const { data: componentes, error: componentesError } = await supabase
      .from('dre_componentes')
      .select('*');

    if (componentesError) throw componentesError;

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

    // Função para calcular valores recursivamente
    const calcularValores = async (conta: DreConta) => {
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

        let valorMes = 0;

        // Processa cada componente
        for (const componente of componentesConta) {
          const lancamentos = await getLancamentos(mesAtual, anoAtual, {
            categoria_id: componente.categoria_id,
            indicador_id: componente.indicador_id,
            cliente_id: componente.conta_id
          });

          valorMes += lancamentos.reduce((acc, lanc) => 
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
        await Promise.all(conta.children.map(child => calcularValores(child)));
        
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
    await Promise.all(contasRaiz.map(conta => calcularValores(conta)));

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