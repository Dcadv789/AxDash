import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFilter } from '../context/FilterContext';
import { supabase } from '../lib/supabase';
import GlobalFilter from '../components/common/GlobalFilter';
import VendasFilter from '../components/analise-vendas/VendasFilter';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardChart from '../components/dashboard/DashboardChart';
import { DollarSign, Users, Target, TrendingUp, Building, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Pessoa {
  id: string;
  nome: string;
  cargo: string;
}

interface VendaData {
  id: string;
  valor: number;
  data_venda: string;
  registro_venda: string;
  origem: string;
  vendedor: Pessoa;
  sdr: Pessoa;
  servico: {
    nome: string;
  };
  cliente: {
    razao_social: string;
  };
}

interface VendedorVendas {
  name: string;
  value: number;
}

// Cache para armazenar os resultados
const analiseVendasCache = new Map<string, { data: any; timestamp: number }>();
const pessoasEmpresaCache = new Map<string, { vendedores: Pessoa[]; sdrs: Pessoa[]; timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

const AnaliseVendas: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedEmpresa, selectedMonth, selectedYear } = useFilter();
  const [loading, setLoading] = useState(false);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendedores, setVendedores] = useState<Pessoa[]>([]);
  const [sdrs, setSDRs] = useState<Pessoa[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [selectedSDR, setSelectedSDR] = useState('');
  
  const [vendasData, setVendasData] = useState({
    totalVendas: 0,
    totalVendasAnterior: 0,
    mediaVendas: 0,
    mediaVendasAnterior: 0,
    quantidadeVendas: 0,
    quantidadeVendasAnterior: 0,
    maiorVenda: 0,
    maiorVendaAnterior: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [vendasPorVendedor, setVendasPorVendedor] = useState<any[]>([]);
  const [treemapData, setTreemapData] = useState<VendedorVendas[]>([]);
  const [treemapOrigemData, setTreemapOrigemData] = useState<VendedorVendas[]>([]);

  const COLORS = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6',
    '#F97316', '#06B6D4', '#84CC16', '#A855F7'
  ];

  // Função para tratar erros de conectividade
  const handleConnectionError = (error: any, context: string) => {
    console.error(`${context}:`, error);
    
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      setError(`Erro de conectividade em ${context}. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173`);
    } else {
      setError(`${context}: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Busca vendedores e SDRs da empresa selecionada
  useEffect(() => {
    const fetchPessoasEmpresa = async () => {
      if (!selectedEmpresa) {
        setVendedores([]);
        setSDRs([]);
        setSelectedVendedor('');
        setSelectedSDR('');
        setLoadingPessoas(false);
        return;
      }

      try {
        setLoadingPessoas(true);
        setError(null);

        // Verifica o cache por empresa
        const cacheKey = `pessoas-empresa-${selectedEmpresa}`;
        const cached = pessoasEmpresaCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setVendedores(cached.vendedores);
          setSDRs(cached.sdrs);
          setLoadingPessoas(false);
          return;
        }

        console.log('Iniciando busca de pessoas da empresa:', selectedEmpresa);
        const startTime = Date.now();

        // Busca vendedores e SDRs da empresa específica em paralelo
        const [vendedoresResult, sdrsResult] = await Promise.all([
          supabase
            .from('pessoas')
            .select('id, nome, cargo')
            .eq('empresa_id', selectedEmpresa)
            .or('cargo.eq.Vendedor,cargo.eq.Ambos')
            .order('nome'),
          supabase
            .from('pessoas')
            .select('id, nome, cargo')
            .eq('empresa_id', selectedEmpresa)
            .or('cargo.eq.SDR,cargo.eq.Ambos')
            .order('nome')
        ]);

        if (vendedoresResult.error) {
          handleConnectionError(vendedoresResult.error, 'Erro ao buscar vendedores da empresa');
          return;
        }

        if (sdrsResult.error) {
          handleConnectionError(sdrsResult.error, 'Erro ao buscar SDRs da empresa');
          return;
        }

        console.log(`Pessoas da empresa carregadas em ${Date.now() - startTime}ms`);

        const vendedoresData = vendedoresResult.data || [];
        const sdrsData = sdrsResult.data || [];

        // Atualiza o cache por empresa
        pessoasEmpresaCache.set(cacheKey, {
          vendedores: vendedoresData,
          sdrs: sdrsData,
          timestamp: Date.now()
        });

        setVendedores(vendedoresData);
        setSDRs(sdrsData);

        // Limpa seleções quando muda a empresa
        setSelectedVendedor('');
        setSelectedSDR('');
      } catch (error: any) {
        handleConnectionError(error, 'Erro ao buscar pessoas da empresa');
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoasEmpresa();
  }, [selectedEmpresa]);

  useEffect(() => {
    if (!selectedEmpresa) {
      // Reset data when no company is selected
      setVendasData({
        totalVendas: 0,
        totalVendasAnterior: 0,
        mediaVendas: 0,
        mediaVendasAnterior: 0,
        quantidadeVendas: 0,
        quantidadeVendasAnterior: 0,
        maiorVenda: 0,
        maiorVendaAnterior: 0,
      });
      setChartData([]);
      setVendasPorVendedor([]);
      setTreemapData([]);
      setTreemapOrigemData([]);
      setError(null);
      return;
    }

    fetchAllVendasData();
  }, [selectedVendedor, selectedSDR, selectedMonth, selectedYear, selectedEmpresa]);

  const fetchAllVendasData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cria uma chave única para o cache incluindo a empresa
      const cacheKey = `${selectedEmpresa}-${selectedMonth}-${selectedYear}-${selectedVendedor}-${selectedSDR}`;
      
      // Verifica o cache
      const cached = analiseVendasCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setVendasData(cached.data.vendasData);
        setChartData(cached.data.chartData);
        setVendasPorVendedor(cached.data.vendasPorVendedor);
        setTreemapData(cached.data.treemapData);
        setTreemapOrigemData(cached.data.treemapOrigemData);
        setLoading(false);
        return;
      }

      console.log('Iniciando busca completa de dados de vendas para empresa:', selectedEmpresa);
      const startTime = Date.now();

      // Calcula datas
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const endDate = selectedMonth === 11 
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`;

      const mesAnterior = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const anoAnterior = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const startDateAnterior = `${anoAnterior}-${String(mesAnterior + 1).padStart(2, '0')}-01`;
      const endDateAnterior = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;

      // Prepara queries base COM FILTRO DE EMPRESA OBRIGATÓRIO
      const createQuery = (startDate: string, endDate: string, includeDetails = false) => {
        let query = supabase
          .from('registro_de_vendas')
          .select(includeDetails ? `
            *,
            vendedor:vendedor_id(id, nome),
            sdr:sdr_id(id, nome),
            servico:servico_id(nome),
            cliente:cliente_id(razao_social)
          ` : 'id, valor, data_venda, vendedor_id, origem')
          .eq('empresa_id', selectedEmpresa) // FILTRO OBRIGATÓRIO POR EMPRESA
          .gte('data_venda', startDate)
          .lt('data_venda', endDate);

        // Aplica filtros se selecionados
        if (selectedVendedor) {
          const vendedorIds = selectedVendedor.split(',');
          query = query.in('vendedor_id', vendedorIds);
        }

        if (selectedSDR) {
          const sdrIds = selectedSDR.split(',');
          query = query.in('sdr_id', sdrIds);
        }

        return query;
      };

      // Prepara queries para vendas por vendedor (últimos 13 meses) COM FILTRO DE EMPRESA
      const vendasPorVendedorQueries = [];
      for (let i = 0; i < 13; i++) {
        let mes = selectedMonth - i;
        let ano = selectedYear;
        while (mes < 0) {
          mes += 12;
          ano--;
        }

        const startDateMes = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
        const endDateMes = mes === 11 
          ? `${ano + 1}-01-01`
          : `${ano}-${String(mes + 2).padStart(2, '0')}-01`;

        vendasPorVendedorQueries.push({
          mes,
          ano,
          query: createQuery(startDateMes, endDateMes).select('valor, vendedor:vendedor_id(id, nome)')
        });
      }

      // Executa todas as consultas em paralelo
      const [
        vendasAtuaisResult,
        vendasAnterioresResult,
        treemapResult,
        treemapOrigemResult,
        ...vendasPorVendedorResults
      ] = await Promise.all([
        // Vendas do mês atual (com detalhes)
        createQuery(startDate, endDate, true),
        // Vendas do mês anterior (simples)
        createQuery(startDateAnterior, endDateAnterior),
        // Dados para treemap por vendedor
        createQuery(startDate, endDate).select('valor, vendedor:vendedor_id(id, nome)'),
        // Dados para treemap por origem
        createQuery(startDate, endDate).select('valor, origem'),
        // Vendas por vendedor (últimos 13 meses)
        ...vendasPorVendedorQueries.map(({ query }) => query)
      ]);

      // Verifica erros
      if (vendasAtuaisResult.error) {
        handleConnectionError(vendasAtuaisResult.error, 'Erro ao buscar vendas atuais');
        return;
      }
      if (vendasAnterioresResult.error) {
        handleConnectionError(vendasAnterioresResult.error, 'Erro ao buscar vendas anteriores');
        return;
      }

      console.log(`Dados carregados em ${Date.now() - startTime}ms para empresa ${selectedEmpresa}`);

      // Processa dados principais
      const vendas = vendasAtuaisResult.data || [];
      const vendasAnteriores = vendasAnterioresResult.data || [];

      const totalVendas = vendas.reduce((acc, venda) => acc + venda.valor, 0);
      const totalVendasAnterior = vendasAnteriores.reduce((acc, venda) => acc + venda.valor, 0);
      
      const mediaVendas = totalVendas / (vendas.length || 1);
      const mediaVendasAnterior = totalVendasAnterior / (vendasAnteriores.length || 1);

      const maiorVenda = Math.max(...vendas.map(v => v.valor), 0);
      const maiorVendaAnterior = Math.max(...vendasAnteriores.map(v => v.valor), 0);

      const processedVendasData = {
        totalVendas,
        totalVendasAnterior,
        mediaVendas,
        mediaVendasAnterior,
        quantidadeVendas: vendas.length,
        quantidadeVendasAnterior: vendasAnteriores.length,
        maiorVenda,
        maiorVendaAnterior
      };

      // Processa dados do gráfico (vendas por dia)
      const vendasPorDia = vendas.reduce((acc: any, venda) => {
        const dia = new Date(venda.data_venda).getDate();
        if (!acc[dia]) {
          acc[dia] = { vendas: 0, meta: 1000 };
        }
        acc[dia].vendas += venda.valor;
        return acc;
      }, {});

      const processedChartData = Object.entries(vendasPorDia).map(([dia, dados]: [string, any]) => ({
        name: `Dia ${dia}`,
        vendas: dados.vendas,
        meta: dados.meta
      }));

      // Processa vendas por vendedor (últimos 13 meses)
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const processedVendasPorVendedor = vendasPorVendedorQueries.map(({ mes, ano }, index) => {
        const result = vendasPorVendedorResults[index];
        const vendas = result.data || [];
        
        const vendasPorVendedor = {};
        vendas.forEach(venda => {
          const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
          vendasPorVendedor[vendedorNome] = (vendasPorVendedor[vendedorNome] || 0) + venda.valor;
        });

        return {
          name: `${meses[mes]}/${String(ano).slice(-2)}`,
          ...vendasPorVendedor
        };
      }).reverse();

      // Processa treemap por vendedor
      const treemapVendas = treemapResult.data || [];
      const vendasPorVendedorMap = {};
      treemapVendas.forEach(venda => {
        const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
        vendasPorVendedorMap[vendedorNome] = (vendasPorVendedorMap[vendedorNome] || 0) + venda.valor;
      });

      const processedTreemapData = Object.entries(vendasPorVendedorMap).map(([name, value]) => ({
        name,
        value
      }));

      // Processa treemap por origem
      const treemapOrigemVendas = treemapOrigemResult.data || [];
      const vendasPorOrigemMap = {};
      treemapOrigemVendas.forEach(venda => {
        const origem = venda.origem || 'Não especificada';
        vendasPorOrigemMap[origem] = (vendasPorOrigemMap[origem] || 0) + venda.valor;
      });

      const processedTreemapOrigemData = Object.entries(vendasPorOrigemMap).map(([name, value]) => ({
        name,
        value
      }));

      console.log(`Dados processados em ${Date.now() - startTime}ms para empresa ${selectedEmpresa}`);

      // Atualiza o cache
      const cacheData = {
        vendasData: processedVendasData,
        chartData: processedChartData,
        vendasPorVendedor: processedVendasPorVendedor,
        treemapData: processedTreemapData,
        treemapOrigemData: processedTreemapOrigemData
      };

      analiseVendasCache.set(cacheKey, {
        data: cacheData,
        timestamp: Date.now()
      });

      // Atualiza estados
      setVendasData(processedVendasData);
      setChartData(processedChartData);
      setVendasPorVendedor(processedVendasPorVendedor);
      setTreemapData(processedTreemapData);
      setTreemapOrigemData(processedTreemapOrigemData);

    } catch (error: any) {
      handleConnectionError(error, 'Erro ao buscar dados de vendas');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className={`p-3 rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {payload[0].name}
        </p>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(payload[0].value)}
        </p>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {`${((payload[0].value / payload[0].payload.totalValue) * 100).toFixed(1)}%`}
        </p>
      </div>
    );
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);

    return (
      <text
        x={x}
        y={y}
        fill={isDark ? "white" : "black"}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs"
      >
        {`${name} (${(percent * 100).toFixed(1)}% - ${formattedValue})`}
      </text>
    );
  };

  const renderLoadingCard = () => (
    <div className={`rounded-xl p-5 relative overflow-hidden transition-all duration-200 h-[140px] animate-pulse
      ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500/50 to-indigo-600/50" />
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
          <Loader2 className={`h-5 w-5 animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
        <div className={`h-4 w-24 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      </div>
      <div className="space-y-2">
        <div className={`h-8 w-36 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className={`h-4 w-24 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-10 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Análise de Vendas
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Acompanhe o desempenho detalhado das suas vendas
          </p>
        </div>

        <div className={`flex items-center gap-4 ${isDark ? 'bg-[#151515]' : 'bg-white'} py-2 px-4 rounded-xl`}>
          {!selectedEmpresa ? (
            <div className="flex items-center gap-2">
              <Building className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Selecione uma empresa primeiro
              </span>
            </div>
          ) : loadingPessoas ? (
            <div className="flex items-center gap-2">
              <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Carregando filtros...
              </span>
            </div>
          ) : (
            <VendasFilter
              vendedores={vendedores}
              sdrs={sdrs}
              selectedVendedor={selectedVendedor}
              selectedSDR={selectedSDR}
              onVendedorChange={setSelectedVendedor}
              onSDRChange={setSelectedSDR}
            />
          )}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
          <GlobalFilter />
        </div>
      </div>

      {error && (
        <div className="px-6 mb-4">
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? 'bg-red-900/20 border-red-800 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="font-medium">Erro de Conectividade</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 opacity-75">
              Configure o Supabase para aceitar requisições de http://localhost:5173
            </p>
          </div>
        </div>
      )}

      <div className="px-6 flex-1 flex flex-col gap-4 min-h-0 overflow-auto pb-6">
        {!selectedEmpresa ? (
          <div className={`rounded-xl p-8 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
            <Building className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Selecione uma empresa
            </h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Para visualizar os dados de vendas, selecione uma empresa no filtro acima
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <React.Fragment key={i}>
                    {renderLoadingCard()}
                  </React.Fragment>
                ))
              ) : (
                <>
                  <DashboardCard
                    title="Total de Vendas"
                    icon={DollarSign}
                    currentValue={vendasData.totalVendas}
                    previousValue={vendasData.totalVendasAnterior}
                  />
                  <DashboardCard
                    title="Média por Venda"
                    icon={TrendingUp}
                    currentValue={vendasData.mediaVendas}
                    previousValue={vendasData.mediaVendasAnterior}
                  />
                  <DashboardCard
                    title="Quantidade de Vendas"
                    icon={Users}
                    currentValue={vendasData.quantidadeVendas}
                    previousValue={vendasData.quantidadeVendasAnterior}
                    isNumber
                  />
                  <DashboardCard
                    title="Maior Venda"
                    icon={Target}
                    currentValue={vendasData.maiorVenda}
                    previousValue={vendasData.maiorVendaAnterior}
                  />
                </>
              )}
            </div>

            <div className="h-[400px]">
              <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Vendas por Vendedor - Últimos 13 Meses
                </h3>
                {loading ? (
                  <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
                    <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                ) : (
                  <div className="h-[calc(100%-2.5rem)]">
                    <DashboardChart
                      type="line"
                      data={vendasPorVendedor}
                      series={
                        Array.from(
                          new Set(
                            vendasPorVendedor.flatMap(data => 
                              Object.keys(data).filter(key => key !== 'mes' && key !== 'name')
                            )
                          )
                        ).map(vendedor => ({
                          dataKey: vendedor,
                          name: vendedor
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[400px]">
              <div className={`h-full rounded-xl p-4 relative ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Distribuição de Vendas por Vendedor
                </h3>
                <div className="absolute top-4 right-4 text-sm">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Total: {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(treemapData.reduce((acc, item) => acc + item.value, 0))}
                  </span>
                </div>
                {loading ? (
                  <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
                    <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                ) : (
                  <div className="h-[calc(100%-2.5rem)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={treemapData.map(item => ({
                            ...item,
                            totalValue: treemapData.reduce((acc, i) => acc + i.value, 0)
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          labelLine={false}
                          label={renderCustomizedLabel}
                        >
                          {treemapData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={CustomTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className={`h-full rounded-xl p-4 relative ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Distribuição de Vendas por Origem
                </h3>
                <div className="absolute top-4 right-4 text-sm">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Total: {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(treemapOrigemData.reduce((acc, item) => acc + item.value, 0))}
                  </span>
                </div>
                {loading ? (
                  <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
                    <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                ) : (
                  <div className="h-[calc(100%-2.5rem)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={treemapOrigemData.map(item => ({
                            ...item,
                            totalValue: treemapOrigemData.reduce((acc, i) => acc + i.value, 0)
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          labelLine={false}
                          label={renderCustomizedLabel}
                        >
                          {treemapOrigemData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={CustomTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnaliseVendas;