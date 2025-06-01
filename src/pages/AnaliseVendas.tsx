import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import DateFilter from '../components/common/DateFilter';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardChart from '../components/dashboard/DashboardChart';
import { DollarSign, Users, Target, TrendingUp, Building, Loader2 } from 'lucide-react';
import { Treemap, ResponsiveContainer } from 'recharts';
import EmpresaFilter from '../components/common/EmpresaFilter';

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

const AnaliseVendas: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [vendedores, setVendedores] = useState<Pessoa[]>([]);
  const [sdrs, setSDRs] = useState<Pessoa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [selectedSDR, setSelectedSDR] = useState('');
  
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());
  
  const [vendasData, setVendasData] = useState({
    totalVendas: 0,
    mediaVendas: 0,
    quantidadeVendas: 0,
    metaAtingida: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [vendasPorVendedor, setVendasPorVendedor] = useState<any[]>([]);
  const [treemapData, setTreemapData] = useState<VendedorVendas[]>([]);
  const [treemapOrigemData, setTreemapOrigemData] = useState<VendedorVendas[]>([]);

  // Array de cores para o treemap
  const COLORS = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6',
    '#F97316', '#06B6D4', '#84CC16', '#A855F7'
  ];

  useEffect(() => {
    fetchPessoas();
  }, []);

  useEffect(() => {
    fetchVendasData();
    fetchVendasPorVendedor();
    fetchTreemapData();
    fetchTreemapOrigemData();
  }, [selectedVendedor, selectedSDR, selectedMonth, selectedYear]);

  const fetchPessoas = async () => {
    try {
      const { data: vendedoresData } = await supabase
        .from('pessoas')
        .select('id, nome')
        .or('cargo.eq.Vendedor,cargo.eq.Ambos')
        .order('nome');

      const { data: sdrsData } = await supabase
        .from('pessoas')
        .select('id, nome')
        .or('cargo.eq.SDR,cargo.eq.Ambos')
        .order('nome');

      if (vendedoresData) setVendedores(vendedoresData);
      if (sdrsData) setSDRs(sdrsData);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
    }
  };

  const fetchVendasPorVendedor = async () => {
    try {
      const ultimosMeses = [];
      for (let i = 0; i < 13; i++) {
        let mes = selectedMonth - i;
        let ano = selectedYear;
        while (mes < 0) {
          mes += 12;
          ano--;
        }
        ultimosMeses.push({ mes, ano });
      }

      const vendasPorMes = await Promise.all(
        ultimosMeses.map(async ({ mes, ano }) => {
          const startDate = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
          const endDate = mes === 11 
            ? `${ano + 1}-01-01`
            : `${ano}-${String(mes + 2).padStart(2, '0')}-01`;

          const { data: vendas } = await supabase
            .from('registro_de_vendas')
            .select(`
              valor,
              data_venda,
              vendedor:vendedor_id(id, nome)
            `)
            .gte('data_venda', startDate)
            .lt('data_venda', endDate);

          const vendasPorVendedor = {};
          vendas?.forEach(venda => {
            const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
            vendasPorVendedor[vendedorNome] = (vendasPorVendedor[vendedorNome] || 0) + venda.valor;
          });

          return {
            mes: `${String(mes + 1).padStart(2, '0')}/${ano}`,
            ...vendasPorVendedor
          };
        })
      );

      setVendasPorVendedor(vendasPorMes.reverse());
    } catch (error) {
      console.error('Erro ao buscar vendas por vendedor:', error);
    }
  };

  const fetchTreemapData = async () => {
    try {
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const endDate = selectedMonth === 11 
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`;

      const { data: vendas } = await supabase
        .from('registro_de_vendas')
        .select(`
          valor,
          vendedor:vendedor_id(id, nome)
        `)
        .gte('data_venda', startDate)
        .lt('data_venda', endDate);

      const vendasPorVendedor = {};
      vendas?.forEach(venda => {
        const vendedorNome = venda.vendedor?.nome || 'Sem vendedor';
        vendasPorVendedor[vendedorNome] = (vendasPorVendedor[vendedorNome] || 0) + venda.valor;
      });

      const treemapData = Object.entries(vendasPorVendedor).map(([name, value]) => ({
        name,
        value
      }));

      setTreemapData(treemapData);
    } catch (error) {
      console.error('Erro ao buscar dados do treemap:', error);
    }
  };

  const fetchTreemapOrigemData = async () => {
    try {
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const endDate = selectedMonth === 11 
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`;

      const { data: vendas } = await supabase
        .from('registro_de_vendas')
        .select('valor, origem')
        .gte('data_venda', startDate)
        .lt('data_venda', endDate);

      const vendasPorOrigem = {};
      vendas?.forEach(venda => {
        const origem = venda.origem || 'Não especificada';
        vendasPorOrigem[origem] = (vendasPorOrigem[origem] || 0) + venda.valor;
      });

      const treemapData = Object.entries(vendasPorOrigem).map(([name, value]) => ({
        name,
        value
      }));

      setTreemapOrigemData(treemapData);
    } catch (error) {
      console.error('Erro ao buscar dados do treemap por origem:', error);
    }
  };

  const fetchVendasData = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const endDate = selectedMonth === 11 
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`;

      let query = supabase
        .from('registro_de_vendas')
        .select(`
          *,
          vendedor:vendedor_id(id, nome),
          sdr:sdr_id(id, nome),
          servico:servico_id(nome),
          cliente:cliente_id(razao_social)
        `)
        .gte('data_venda', startDate)
        .lt('data_venda', endDate);

      if (selectedVendedor) {
        query = query.eq('vendedor_id', selectedVendedor);
      }
      if (selectedSDR) {
        query = query.eq('sdr_id', selectedSDR);
      }

      const { data: vendas } = await query;

      if (vendas) {
        const totalVendas = vendas.reduce((acc, venda) => acc + venda.valor, 0);
        const mediaVendas = totalVendas / (vendas.length || 1);

        const vendasPorDia = vendas.reduce((acc: any, venda) => {
          const dia = new Date(venda.data_venda).getDate();
          if (!acc[dia]) {
            acc[dia] = { vendas: 0, meta: 1000 };
          }
          acc[dia].vendas += venda.valor;
          return acc;
        }, {});

        const chartDataProcessed = Object.entries(vendasPorDia).map(([dia, dados]: [string, any]) => ({
          name: `Dia ${dia}`,
          vendas: dados.vendas,
          meta: dados.meta
        }));

        setChartData(chartDataProcessed);
        setVendasData({
          totalVendas,
          mediaVendas,
          quantidadeVendas: vendas.length,
          metaAtingida: (totalVendas / 100000) * 100,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTreemapContent = ({ root, depth, x, y, width, height, name, value, index }: any) => {
    const percentage = ((value / root.value) * 100).toFixed(1);
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={COLORS[index % COLORS.length]}
          opacity={0.8}
        />
        {width > 50 && height > 50 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill={isDark ? '#fff' : '#000'}
            fontSize={14}
          >
            <tspan x={x + width / 2} dy="-0.5em">{name}</tspan>
            <tspan x={x + width / 2} dy="1.5em">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(value)}
            </tspan>
            <tspan x={x + width / 2} dy="1.2em">
              ({percentage}%)
            </tspan>
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Análise de Vendas
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Acompanhe o desempenho detalhado das suas vendas
          </p>
        </div>

        <div className={`flex items-center gap-4 py-2 px-4 rounded-xl ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
          <EmpresaFilter
            value={selectedEmpresa}
            onChange={setSelectedEmpresa}
            className="min-w-[200px]"
          />

          <select
            value={selectedVendedor}
            onChange={(e) => setSelectedVendedor(e.target.value)}
            className={`min-w-[180px] px-3 py-2 rounded-lg appearance-none pr-8 ${
              isDark
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-gray-50 text-gray-900 border-gray-300'
            }`}
          >
            <option value="">Todos os Vendedores</option>
            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </select>

          <select
            value={selectedSDR}
            onChange={(e) => setSelectedSDR(e.target.value)}
            className={`min-w-[180px] px-3 py-2 rounded-lg appearance-none pr-8 ${
              isDark
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-gray-50 text-gray-900 border-gray-300'
            }`}
          >
            <option value="">Todos os SDRs</option>
            {sdrs.map((sdr) => (
              <option key={sdr.id} value={sdr.id}>
                {sdr.nome}
              </option>
            ))}
          </select>

          <DateFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>
      </div>

      <div className="px-6 flex-1 flex flex-col gap-4 min-h-0 overflow-auto pb-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={i}
                className={`rounded-xl p-5 relative overflow-hidden transition-all duration-200 h-[140px] animate-pulse
                  ${isDark ? 'bg-[#151515]' : 'bg-white'}`}
              >
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
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DashboardCard
                title="Total de Vendas"
                icon={DollarSign}
                currentValue={vendasData.totalVendas}
                variation={10}
              />
              <DashboardCard
                title="Média por Venda"
                icon={TrendingUp}
                currentValue={vendasData.mediaVendas}
                variation={5}
              />
              <DashboardCard
                title="Quantidade de Vendas"
                icon={Users}
                currentValue={vendasData.quantidadeVendas}
                variation={15}
              />
              <DashboardCard
                title="Meta Atingida"
                icon={Target}
                currentValue={vendasData.metaAtingida}
                variation={15}
              />
            </div>

            <div className="h-[400px]">
              <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Vendas por Vendedor - Últimos 13 Meses
                </h3>
                <div className="h-[calc(100%-2.5rem)]">
                  <DashboardChart
                    type="line"
                    data={vendasPorVendedor}
                    series={
                      Array.from(
                        new Set(
                          vendasPorVendedor.flatMap(data => 
                            Object.keys(data).filter(key => key !== 'mes')
                          )
                        )
                      ).map(vendedor => ({
                        dataKey: vendedor,
                        name: vendedor
                      }))
                    }
                  />
                </div>
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
                <div className="h-[calc(100%-2.5rem)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={treemapData}
                      dataKey="value"
                      content={<CustomTreemapContent />}
                    />
                  </ResponsiveContainer>
                </div>
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
                <div className="h-[calc(100%-2.5rem)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={treemapOrigemData}
                      dataKey="value"
                      content={<CustomTreemapContent />}
                    />
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnaliseVendas;