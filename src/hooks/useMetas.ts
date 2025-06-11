import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MetasData {
  totalMetas: number;
  totalMetasAnterior: number;
  totalVendas: number;
  totalVendasAnterior: number;
  percentualAtingimento: number;
  percentualAtingimentoAnterior: number;
  quantidadeVendedores: number;
  quantidadeVendedoresAnterior: number;
}

interface ChartDataItem {
  name: string;
  [vendedor: string]: number | string;
}

interface TableDataItem {
  vendedor: string;
  metaAtual: number;
  vendasAtuais: number;
  percentualAtingimento: number;
  metaAnterior: number;
  vendasAnteriores: number;
  metaProxima: number;
  status: 'atingiu' | 'nao_atingiu' | 'superou';
}

// Cache para armazenar os resultados
const metasCache = new Map<string, { data: any; timestamp: number }>();
const vendedoresEmpresaCache = new Map<string, { vendedores: any[]; timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

export const useMetas = (empresaId: string, mes: number, ano: number, vendedorIds?: string) => {
  const [metasData, setMetasData] = useState<MetasData>({
    totalMetas: 0,
    totalMetasAnterior: 0,
    totalVendas: 0,
    totalVendasAnterior: 0,
    percentualAtingimento: 0,
    percentualAtingimentoAnterior: 0,
    quantidadeVendedores: 0,
    quantidadeVendedoresAnterior: 0,
  });
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [tableData, setTableData] = useState<TableDataItem[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca vendedores da empresa
  useEffect(() => {
    const fetchVendedores = async () => {
      if (!empresaId) {
        setVendedores([]);
        setLoadingVendedores(false);
        return;
      }

      try {
        setLoadingVendedores(true);
        setError(null);

        // Verifica o cache por empresa
        const cacheKey = `vendedores-metas-${empresaId}`;
        const cached = vendedoresEmpresaCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setVendedores(cached.vendedores);
          setLoadingVendedores(false);
          return;
        }

        console.log('Buscando vendedores para metas da empresa:', empresaId);
        const startTime = Date.now();

        // Busca vendedores ativos da empresa específica
        const { data: vendedoresData, error: vendedoresError } = await supabase
          .from('pessoas')
          .select('id, nome')
          .eq('empresa_id', empresaId)
          .eq('Ativo', true)
          .or('cargo.eq.Vendedor,cargo.eq.Ambos')
          .order('nome');

        if (vendedoresError) {
          if (vendedoresError.message?.includes('Failed to fetch') || vendedoresError.name === 'TypeError') {
            throw new Error('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
          }
          throw vendedoresError;
        }

        console.log(`Vendedores para metas carregados em ${Date.now() - startTime}ms`);

        const vendedoresList = vendedoresData || [];

        // Atualiza o cache por empresa
        vendedoresEmpresaCache.set(cacheKey, {
          vendedores: vendedoresList,
          timestamp: Date.now()
        });

        setVendedores(vendedoresList);
      } catch (error: any) {
        console.error('Erro ao buscar vendedores para metas:', error);
        
        if (error.message?.includes('Erro de conectividade') || error.message?.includes('Failed to fetch')) {
          setError('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
        } else {
          setError(`Erro ao carregar vendedores: ${error.message || 'Erro desconhecido'}`);
        }
      } finally {
        setLoadingVendedores(false);
      }
    };

    fetchVendedores();
  }, [empresaId]);

  // Busca dados de metas
  useEffect(() => {
    if (!empresaId) {
      // Reset data when no company is selected
      setMetasData({
        totalMetas: 0,
        totalMetasAnterior: 0,
        totalVendas: 0,
        totalVendasAnterior: 0,
        percentualAtingimento: 0,
        percentualAtingimentoAnterior: 0,
        quantidadeVendedores: 0,
        quantidadeVendedoresAnterior: 0,
      });
      setChartData([]);
      setTableData([]);
      setError(null);
      return;
    }

    fetchMetasData();
  }, [empresaId, mes, ano, vendedorIds]);

  const fetchMetasData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cria uma chave única para o cache incluindo a empresa e vendedores
      const cacheKey = `${empresaId}-${mes}-${ano}-${vendedorIds || 'all'}`;
      
      // Verifica o cache
      const cached = metasCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setMetasData(cached.data.metasData);
        setChartData(cached.data.chartData);
        setTableData(cached.data.tableData);
        setLoading(false);
        return;
      }

      console.log('Iniciando busca de dados de metas para empresa:', empresaId, 'vendedores:', vendedorIds);
      const startTime = Date.now();

      // Calcula o mês anterior e próximo
      const mesAnterior = mes === 0 ? 11 : mes - 1;
      const anoAnterior = mes === 0 ? ano - 1 : ano;
      const mesProximo = mes === 11 ? 0 : mes + 1;
      const anoProximo = mes === 11 ? ano + 1 : ano;

      // Função para criar query base com filtros
      const createMetasQuery = (mes: number, ano: number) => {
        let query = supabase
          .from('metas_vendas')
          .select(`
            *,
            pessoa:pessoas!inner(id, nome, empresa_id, Ativo)
          `)
          .eq('mes', mes + 1)
          .eq('ano', ano)
          .eq('pessoa.empresa_id', empresaId)
          .eq('pessoa.Ativo', true);

        // Aplica filtro de vendedores se especificado
        if (vendedorIds && vendedorIds.trim()) {
          const vendedorIdsList = vendedorIds.split(',').filter(id => id.trim());
          if (vendedorIdsList.length > 0) {
            query = query.in('pessoa_id', vendedorIdsList);
          }
        }

        return query;
      };

      // Função para criar query de vendas com filtros
      const createVendasQuery = (startDate: string, endDate: string) => {
        let query = supabase
          .from('registro_de_vendas')
          .select(`
            valor,
            vendedor:vendedor_id!inner(id, nome, Ativo)
          `)
          .eq('empresa_id', empresaId)
          .eq('vendedor.Ativo', true)
          .gte('data_venda', startDate)
          .lt('data_venda', endDate);

        // Aplica filtro de vendedores se especificado
        if (vendedorIds && vendedorIds.trim()) {
          const vendedorIdsList = vendedorIds.split(',').filter(id => id.trim());
          if (vendedorIdsList.length > 0) {
            query = query.in('vendedor_id', vendedorIdsList);
          }
        }

        return query;
      };

      // Busca metas do mês atual, anterior e próximo em paralelo
      const [metasAtuaisResult, metasAnterioresResult, metasProximasResult] = await Promise.all([
        createMetasQuery(mes, ano),
        createMetasQuery(mesAnterior, anoAnterior),
        createMetasQuery(mesProximo, anoProximo)
      ]);

      if (metasAtuaisResult.error) {
        throw new Error(`Erro ao buscar metas atuais: ${metasAtuaisResult.error.message}`);
      }
      if (metasAnterioresResult.error) {
        throw new Error(`Erro ao buscar metas anteriores: ${metasAnterioresResult.error.message}`);
      }
      if (metasProximasResult.error) {
        throw new Error(`Erro ao buscar metas próximas: ${metasProximasResult.error.message}`);
      }

      // Busca vendas para o mês atual e anterior
      const [vendasAtuaisQuery, vendasAnterioresQuery] = await Promise.all([
        createVendasQuery(
          `${ano}-${String(mes + 1).padStart(2, '0')}-01`,
          mes === 11 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 2).padStart(2, '0')}-01`
        ),
        createVendasQuery(
          `${anoAnterior}-${String(mesAnterior + 1).padStart(2, '0')}-01`,
          `${ano}-${String(mes + 1).padStart(2, '0')}-01`
        )
      ]);

      if (vendasAtuaisQuery.error) {
        throw new Error(`Erro ao buscar vendas atuais: ${vendasAtuaisQuery.error.message}`);
      }
      if (vendasAnterioresQuery.error) {
        throw new Error(`Erro ao buscar vendas anteriores: ${vendasAnterioresQuery.error.message}`);
      }

      // Busca dados para o gráfico (últimos 13 meses)
      const chartQueries = [];
      for (let i = 0; i < 13; i++) {
        let mesAtual = mes - i;
        let anoAtual = ano;
        while (mesAtual < 0) {
          mesAtual += 12;
          anoAtual--;
        }

        const startDate = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-01`;
        const endDate = mesAtual === 11 
          ? `${anoAtual + 1}-01-01`
          : `${anoAtual}-${String(mesAtual + 2).padStart(2, '0')}-01`;

        chartQueries.push({
          mes: mesAtual,
          ano: anoAtual,
          metasQuery: createMetasQuery(mesAtual, anoAtual),
          vendasQuery: createVendasQuery(startDate, endDate)
        });
      }

      // Executa consultas do gráfico em paralelo
      const chartResults = await Promise.all(
        chartQueries.map(async ({ mes: mesAtual, ano: anoAtual, metasQuery, vendasQuery }) => {
          const [metasResult, vendasResult] = await Promise.all([metasQuery, vendasQuery]);
          return {
            mes: mesAtual,
            ano: anoAtual,
            metas: metasResult.data || [],
            vendas: vendasResult.data || []
          };
        })
      );

      console.log(`Dados carregados em ${Date.now() - startTime}ms para empresa ${empresaId} (vendedores filtrados)`);

      // Processa dados principais
      const metasAtuais = metasAtuaisResult.data || [];
      const metasAnteriores = metasAnterioresResult.data || [];
      const metasProximas = metasProximasResult.data || [];
      const vendasAtuais = vendasAtuaisQuery.data || [];
      const vendasAnteriores = vendasAnterioresQuery.data || [];

      const totalMetas = metasAtuais.reduce((acc, meta) => acc + meta.valor_meta, 0);
      const totalMetasAnterior = metasAnteriores.reduce((acc, meta) => acc + meta.valor_meta, 0);
      const totalVendas = vendasAtuais.reduce((acc, venda) => acc + venda.valor, 0);
      const totalVendasAnterior = vendasAnteriores.reduce((acc, venda) => acc + venda.valor, 0);

      const percentualAtingimento = totalMetas > 0 ? (totalVendas / totalMetas) * 100 : 0;
      const percentualAtingimentoAnterior = totalMetasAnterior > 0 ? (totalVendasAnterior / totalMetasAnterior) * 100 : 0;

      const processedMetasData = {
        totalMetas,
        totalMetasAnterior,
        totalVendas,
        totalVendasAnterior,
        percentualAtingimento,
        percentualAtingimentoAnterior,
        quantidadeVendedores: metasAtuais.length,
        quantidadeVendedoresAnterior: metasAnteriores.length
      };

      // Processa dados do gráfico
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const processedChartData = chartResults.map(({ mes: mesAtual, ano: anoAtual, metas, vendas }) => {
        const metasPorVendedor: Record<string, number> = {};
        const vendasPorVendedor: Record<string, number> = {};

        // Agrupa metas por vendedor
        metas.forEach(meta => {
          const vendedorNome = meta.pessoa?.nome || 'Sem vendedor';
          metasPorVendedor[`${vendedorNome} (Meta)`] = (metasPorVendedor[`${vendedorNome} (Meta)`] || 0) + meta.valor_meta;
        });

        // Agrupa vendas por vendedor
        vendas.forEach(venda => {
          const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
          vendasPorVendedor[`${vendedorNome} (Vendas)`] = (vendasPorVendedor[`${vendedorNome} (Vendas)`] || 0) + venda.valor;
        });

        return {
          name: `${meses[mesAtual]}/${String(anoAtual).slice(-2)}`,
          ...metasPorVendedor,
          ...vendasPorVendedor
        };
      }).reverse();

      // Processa dados da tabela
      const vendedoresMap = new Map();
      
      // Adiciona metas atuais
      metasAtuais.forEach(meta => {
        const vendedorNome = meta.pessoa?.nome || 'Sem vendedor';
        if (!vendedoresMap.has(vendedorNome)) {
          vendedoresMap.set(vendedorNome, {
            vendedor: vendedorNome,
            metaAtual: 0,
            vendasAtuais: 0,
            percentualAtingimento: 0,
            metaAnterior: 0,
            vendasAnteriores: 0,
            metaProxima: 0,
            status: 'nao_atingiu' as const
          });
        }
        vendedoresMap.get(vendedorNome).metaAtual += meta.valor_meta;
      });

      // Adiciona metas anteriores
      metasAnteriores.forEach(meta => {
        const vendedorNome = meta.pessoa?.nome || 'Sem vendedor';
        if (vendedoresMap.has(vendedorNome)) {
          vendedoresMap.get(vendedorNome).metaAnterior += meta.valor_meta;
        }
      });

      // Adiciona metas próximas
      metasProximas.forEach(meta => {
        const vendedorNome = meta.pessoa?.nome || 'Sem vendedor';
        if (vendedoresMap.has(vendedorNome)) {
          vendedoresMap.get(vendedorNome).metaProxima += meta.valor_meta;
        }
      });

      // Adiciona vendas atuais
      vendasAtuais.forEach(venda => {
        const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
        if (vendedoresMap.has(vendedorNome)) {
          vendedoresMap.get(vendedorNome).vendasAtuais += venda.valor;
        }
      });

      // Adiciona vendas anteriores
      vendasAnteriores.forEach(venda => {
        const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
        if (vendedoresMap.has(vendedorNome)) {
          vendedoresMap.get(vendedorNome).vendasAnteriores += venda.valor;
        }
      });

      // Calcula percentual de atingimento e status
      const processedTableData = Array.from(vendedoresMap.values()).map(vendedor => {
        const percentual = vendedor.metaAtual > 0 ? (vendedor.vendasAtuais / vendedor.metaAtual) * 100 : 0;
        let status: 'atingiu' | 'nao_atingiu' | 'superou' = 'nao_atingiu';
        
        if (percentual >= 110) {
          status = 'superou';
        } else if (percentual >= 100) {
          status = 'atingiu';
        }

        return {
          ...vendedor,
          percentualAtingimento: percentual,
          status
        };
      });

      console.log(`Dados processados em ${Date.now() - startTime}ms para empresa ${empresaId} (vendedores filtrados)`);

      // Atualiza o cache
      const cacheData = {
        metasData: processedMetasData,
        chartData: processedChartData,
        tableData: processedTableData
      };

      metasCache.set(cacheKey, {
        data: cacheData,
        timestamp: Date.now()
      });

      // Atualiza estados
      setMetasData(processedMetasData);
      setChartData(processedChartData);
      setTableData(processedTableData);

    } catch (error: any) {
      console.error('Erro ao buscar dados de metas:', error);
      
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setError('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
      } else {
        setError(`Erro ao carregar dados de metas: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    metasData,
    chartData,
    tableData,
    vendedores,
    loading,
    loadingVendedores,
    error
  };
};