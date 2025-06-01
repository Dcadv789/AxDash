import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import DateFilter from '../components/common/DateFilter';
import DashboardCard from '../components/dashboard/DashboardCard';
import DashboardChart from '../components/dashboard/DashboardChart';
import { DollarSign, Users, Target, TrendingUp, Building, Loader2 } from 'lucide-react';

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

const AnaliseVendas: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [vendedores, setVendedores] = useState<Pessoa[]>([]);
  const [sdrs, setSDRs] = useState<Pessoa[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [selectedSDR, setSelectedSDR] = useState('');
  
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());
  
  const [vendasData, setVendasData] = useState({
    totalVendas: 0,
    mediaVendas: 0,
    taxaConversao: 0,
    metaAtingida: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchPessoas();
  }, []);

  useEffect(() => {
    fetchVendasData();
  }, [selectedVendedor, selectedSDR, selectedMonth, selectedYear]);

  const fetchPessoas = async () => {
    try {
      // Busca pessoas que são vendedores
      const { data: vendedoresData } = await supabase
        .from('pessoas')
        .select('id, nome')
        .or('cargo.eq.Vendedor,cargo.eq.Ambos')
        .order('nome');

      // Busca pessoas que são SDRs
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

  const fetchVendasData = async () => {
    setLoading(true);
    try {
      // Construir a query base
      let query = supabase
        .from('registro_de_vendas')
        .select(`
          *,
          vendedor:vendedor_id(id, nome),
          sdr:sdr_id(id, nome),
          servico:servico_id(nome),
          cliente:cliente_id(razao_social)
        `)
        .gte('data_venda', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`)
        .lt('data_venda', `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`);

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

        // Processamento dos dados para o gráfico
        const vendasPorDia = vendas.reduce((acc: any, venda) => {
          const dia = new Date(venda.data_venda).getDate();
          if (!acc[dia]) {
            acc[dia] = { vendas: 0, meta: 1000 }; // Meta diária fixa para exemplo
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
          taxaConversao: (vendas.length / 100) * 100, // Exemplo simplificado
          metaAtingida: (totalVendas / 100000) * 100, // Meta fixa para exemplo
        });
      }
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    } finally {
      setLoading(false);
    }
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
          <select
            value={selectedVendedor}
            onChange={(e) => setSelectedVendedor(e.target.value)}
            className={`px-3 py-2 rounded-lg ${
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
            className={`px-3 py-2 rounded-lg ${
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
                title="Taxa de Conversão"
                icon={Target}
                currentValue={vendasData.taxaConversao}
                variation={-2}
              />
              <DashboardCard
                title="Meta Atingida"
                icon={Users}
                currentValue={vendasData.metaAtingida}
                variation={15}
              />
            </div>

            <div className="flex-1 h-[400px]">
              <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Desempenho de Vendas
                </h3>
                <div className="h-[calc(100%-2.5rem)]">
                  <DashboardChart
                    type="line"
                    data={chartData}
                    series={[
                      { dataKey: 'vendas', name: 'Vendas' },
                      { dataKey: 'meta', name: 'Meta' }
                    ]}
                  />
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