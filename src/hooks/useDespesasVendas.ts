import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DespesasData {
  totalDespesas: number;
  totalDespesasAnterior: number;
  mediaDespesas: number;
  mediaDespesasAnterior: number;
  maiorDespesa: number;
  maiorDespesaAnterior: number;
  quantidadeVendedores: number;
  quantidadeVendedoresAnterior: number;
}

interface ChartDataItem {
  name: string;
  [vendedor: string]: number | string;
}

interface TableDataItem {
  vendedor: string;
  combustivel: number;
  alimentacao: number;
  hospedagem: number;
  comissao: number;
  salario: number;
  outras_despesas: number;
  total: number;
}

interface IndicadorDataItem {
  vendedor: string;
  totalDespesas: number;
  totalVendas: number;
  percentual: number;
  percentualAnterior: number;
  status: 'acima' | 'abaixo' | 'igual';
  statusAnterior: 'acima' | 'abaixo' | 'igual';
}

// Cache para armazenar os resultados
const despesasCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

export const useDespesasVendas = (empresaId: string, mes: number, ano: number, vendedorIds?: string) => {
  const [despesasData, setDespesasData] = useState<DespesasData>({
    totalDespesas: 0,
    totalDespesasAnterior: 0,
    mediaDespesas: 0,
    mediaDespesasAnterior: 0,
    maiorDespesa: 0,
    maiorDespesaAnterior: 0,
    quantidadeVendedores: 0,
    quantidadeVendedoresAnterior: 0,
  });
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [tableData, setTableData] = useState<TableDataItem[]>([]);
  const [indicadorData, setIndicadorData] = useState<IndicadorDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) {
      // Reset data when no company is selected
      setDespesasData({
        totalDespesas: 0,
        totalDespesasAnterior: 0,
        mediaDespesas: 0,
        mediaDespesasAnterior: 0,
        maiorDespesa: 0,
        maiorDespesaAnterior: 0,
        quantidadeVendedores: 0,
        quantidadeVendedoresAnterior: 0,
      });
      setChartData([]);
      setTableData([]);
      setIndicadorData([]);
      setError(null);
      return;
    }

    fetchDespesasData();
  }, [empresaId, mes, ano, vendedorIds]);

  const fetchDespesasData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cria uma chave única para o cache incluindo a empresa e vendedores
      const cacheKey = `${empresaId}-${mes}-${ano}-${vendedorIds || 'all'}`;
      
      // Verifica o cache
      const cached = despesasCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setDespesasData(cached.data.despesasData);
        setChartData(cached.data.chartData);
        setTableData(cached.data.tableData);
        setIndicadorData(cached.data.indicadorData);
        setLoading(false);
        return;
      }

      console.log('Iniciando busca de dados de despesas para empresa:', empresaId, 'vendedores:', vendedorIds);
      const startTime = Date.now();

      // Calcula o mês anterior
      const mesAnterior = mes === 0 ? 11 : mes - 1;
      const anoAnterior = mes === 0 ? ano - 1 : ano;

      // Função para criar query base com filtros
      const createBaseQuery = (mes: number, ano: number) => {
        let query = supabase
          .from('despesas_vendedor')
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

      // Busca despesas do mês atual e anterior em paralelo - COM FILTRO DE VENDEDORES
      const [despesasAtuaisResult, despesasAnterioresResult] = await Promise.all([
        createBaseQuery(mes, ano),
        createBaseQuery(mesAnterior, anoAnterior)
      ]);

      if (despesasAtuaisResult.error) {
        throw new Error(`Erro ao buscar despesas atuais: ${despesasAtuaisResult.error.message}`);
      }
      if (despesasAnterioresResult.error) {
        throw new Error(`Erro ao buscar despesas anteriores: ${despesasAnterioresResult.error.message}`);
      }

      // Busca dados para o gráfico (últimos 13 meses) - COM FILTRO DE VENDEDORES
      const chartQueries = [];
      for (let i = 0; i < 13; i++) {
        let mesAtual = mes - i;
        let anoAtual = ano;
        while (mesAtual < 0) {
          mesAtual += 12;
          anoAtual--;
        }

        chartQueries.push({
          mes: mesAtual,
          ano: anoAtual,
          query: createBaseQuery(mesAtual, anoAtual)
        });
      }

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

      // Busca vendas para o indicador de eficiência (mês atual e anterior) - COM FILTRO DE VENDEDORES
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

      // Executa consultas do gráfico em paralelo
      const chartResults = await Promise.all(chartQueries.map(({ query }) => query));

      if (vendasAtuaisQuery.error) {
        throw new Error(`Erro ao buscar vendas atuais: ${vendasAtuaisQuery.error.message}`);
      }
      if (vendasAnterioresQuery.error) {
        throw new Error(`Erro ao buscar vendas anteriores: ${vendasAnterioresQuery.error.message}`);
      }

      console.log(`Dados carregados em ${Date.now() - startTime}ms para empresa ${empresaId} (vendedores filtrados)`);

      // Processa dados principais
      const despesasAtuais = despesasAtuaisResult.data || [];
      const despesasAnteriores = despesasAnterioresResult.data || [];

      const calcularTotalDespesa = (despesa: any) => {
        return (despesa.combustivel || 0) + 
               (despesa.alimentacao || 0) + 
               (despesa.hospedagem || 0) + 
               (despesa.comissao || 0) + 
               (despesa.salario || 0) + 
               (despesa.outras_despesas || 0);
      };

      const totalDespesas = despesasAtuais.reduce((acc, despesa) => acc + calcularTotalDespesa(despesa), 0);
      const totalDespesasAnterior = despesasAnteriores.reduce((acc, despesa) => acc + calcularTotalDespesa(despesa), 0);

      const mediaDespesas = totalDespesas / (despesasAtuais.length || 1);
      const mediaDespesasAnterior = totalDespesasAnterior / (despesasAnteriores.length || 1);

      const maiorDespesa = Math.max(...despesasAtuais.map(d => calcularTotalDespesa(d)), 0);
      const maiorDespesaAnterior = Math.max(...despesasAnteriores.map(d => calcularTotalDespesa(d)), 0);

      const processedDespesasData = {
        totalDespesas,
        totalDespesasAnterior,
        mediaDespesas,
        mediaDespesasAnterior,
        maiorDespesa,
        maiorDespesaAnterior,
        quantidadeVendedores: despesasAtuais.length,
        quantidadeVendedoresAnterior: despesasAnteriores.length
      };

      // Processa dados do gráfico
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const processedChartData = chartQueries.map(({ mes: mesAtual, ano: anoAtual }, index) => {
        const result = chartResults[index];
        const despesas = result.data || [];
        
        const despesasPorVendedor: Record<string, number> = {};
        despesas.forEach(despesa => {
          const vendedorNome = despesa.pessoa?.nome || 'Sem vendedor';
          const totalDespesa = calcularTotalDespesa(despesa);
          despesasPorVendedor[vendedorNome] = (despesasPorVendedor[vendedorNome] || 0) + totalDespesa;
        });

        return {
          name: `${meses[mesAtual]}/${String(anoAtual).slice(-2)}`,
          ...despesasPorVendedor
        };
      }).reverse();

      // Processa dados da tabela
      const despesasPorVendedor = new Map();
      despesasAtuais.forEach(despesa => {
        const vendedorNome = despesa.pessoa?.nome || 'Sem vendedor';
        if (!despesasPorVendedor.has(vendedorNome)) {
          despesasPorVendedor.set(vendedorNome, {
            vendedor: vendedorNome,
            combustivel: 0,
            alimentacao: 0,
            hospedagem: 0,
            comissao: 0,
            salario: 0,
            outras_despesas: 0,
            total: 0
          });
        }
        
        const vendedorData = despesasPorVendedor.get(vendedorNome);
        vendedorData.combustivel += despesa.combustivel || 0;
        vendedorData.alimentacao += despesa.alimentacao || 0;
        vendedorData.hospedagem += despesa.hospedagem || 0;
        vendedorData.comissao += despesa.comissao || 0;
        vendedorData.salario += despesa.salario || 0;
        vendedorData.outras_despesas += despesa.outras_despesas || 0;
        vendedorData.total = calcularTotalDespesa(vendedorData);
      });

      const processedTableData = Array.from(despesasPorVendedor.values());

      // Processa dados do indicador de eficiência
      const vendasAtuais = vendasAtuaisQuery.data || [];
      const vendasAnteriores = vendasAnterioresQuery.data || [];

      const vendasPorVendedor = new Map();
      const vendasAnterioresPorVendedor = new Map();

      vendasAtuais.forEach(venda => {
        const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
        vendasPorVendedor.set(vendedorNome, (vendasPorVendedor.get(vendedorNome) || 0) + venda.valor);
      });

      vendasAnteriores.forEach(venda => {
        const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
        vendasAnterioresPorVendedor.set(vendedorNome, (vendasAnterioresPorVendedor.get(vendedorNome) || 0) + venda.valor);
      });

      // Processa despesas do mês anterior por vendedor
      const despesasAnterioresPorVendedor = new Map();
      despesasAnteriores.forEach(despesa => {
        const vendedorNome = despesa.pessoa?.nome || 'Sem vendedor';
        if (!despesasAnterioresPorVendedor.has(vendedorNome)) {
          despesasAnterioresPorVendedor.set(vendedorNome, 0);
        }
        despesasAnterioresPorVendedor.set(vendedorNome, 
          despesasAnterioresPorVendedor.get(vendedorNome) + calcularTotalDespesa(despesa)
        );
      });

      const processedIndicadorData = Array.from(despesasPorVendedor.entries()).map(([vendedorNome, despesaData]) => {
        const totalVendas = vendasPorVendedor.get(vendedorNome) || 0;
        const totalVendasAnterior = vendasAnterioresPorVendedor.get(vendedorNome) || 0;
        const totalDespesasAnterior = despesasAnterioresPorVendedor.get(vendedorNome) || 0;
        
        const percentual = totalVendas > 0 ? (despesaData.total / totalVendas) * 100 : 0;
        const percentualAnterior = totalVendasAnterior > 0 ? (totalDespesasAnterior / totalVendasAnterior) * 100 : 0;
        
        const getStatus = (perc: number): 'acima' | 'abaixo' | 'igual' => {
          if (perc > 10) return 'acima';
          if (perc < 10) return 'abaixo';
          return 'igual';
        };

        return {
          vendedor: vendedorNome,
          totalDespesas: despesaData.total,
          totalVendas,
          percentual,
          percentualAnterior,
          status: getStatus(percentual),
          statusAnterior: getStatus(percentualAnterior)
        };
      });

      console.log(`Dados processados em ${Date.now() - startTime}ms para empresa ${empresaId} (vendedores filtrados)`);

      // Atualiza o cache
      const cacheData = {
        despesasData: processedDespesasData,
        chartData: processedChartData,
        tableData: processedTableData,
        indicadorData: processedIndicadorData
      };

      despesasCache.set(cacheKey, {
        data: cacheData,
        timestamp: Date.now()
      });

      // Atualiza estados
      setDespesasData(processedDespesasData);
      setChartData(processedChartData);
      setTableData(processedTableData);
      setIndicadorData(processedIndicadorData);

    } catch (error: any) {
      console.error('Erro ao buscar dados de despesas:', error);
      
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setError('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
      } else {
        setError(`Erro ao carregar dados de despesas: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    despesasData,
    chartData,
    tableData,
    indicadorData,
    loading,
    error
  };
};