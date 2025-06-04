import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import EmpresaFilter from '../components/common/EmpresaFilter';
import DateFilter from '../components/common/DateFilter';
import { Building, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Despesa {
  categoria: string;
  valorAtual: number;
  valorAnterior: number;
  variacao: number;
}

interface Venda {
  id: string;
  valor: number;
  cliente: {
    razao_social: string;
  };
  vendedor: {
    nome: string;
  };
}

const Evolucao: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [loading, setLoading] = useState(true);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());

  useEffect(() => {
    if (!selectedEmpresa) {
      setDespesas([]);
      setVendas([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Calcula o mês anterior
        const mesAnterior = selectedMonth === 0 ? 12 : selectedMonth;
        const anoAnterior = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

        // Busca as despesas do mês atual
        const { data: despesasAtuais } = await supabase
          .from('lancamentos')
          .select(`
            valor,
            categoria:categorias(nome)
          `)
          .eq('tipo', 'Despesa')
          .eq('mes', selectedMonth + 1)
          .eq('ano', selectedYear)
          .not('categoria', 'is', null);

        // Busca as despesas do mês anterior
        const { data: despesasAnteriores } = await supabase
          .from('lancamentos')
          .select(`
            valor,
            categoria:categorias(nome)
          `)
          .eq('tipo', 'Despesa')
          .eq('mes', mesAnterior)
          .eq('ano', anoAnterior)
          .not('categoria', 'is', null);

        // Processa as despesas
        const despesasMap = new Map<string, Despesa>();

        // Processa despesas atuais
        despesasAtuais?.forEach(item => {
          if (!item.categoria?.nome) return;
          const categoria = item.categoria.nome;
          if (!despesasMap.has(categoria)) {
            despesasMap.set(categoria, {
              categoria,
              valorAtual: 0,
              valorAnterior: 0,
              variacao: 0
            });
          }
          const despesa = despesasMap.get(categoria)!;
          despesa.valorAtual += item.valor;
        });

        // Processa despesas anteriores
        despesasAnteriores?.forEach(item => {
          if (!item.categoria?.nome) return;
          const categoria = item.categoria.nome;
          if (!despesasMap.has(categoria)) {
            despesasMap.set(categoria, {
              categoria,
              valorAtual: 0,
              valorAnterior: 0,
              variacao: 0
            });
          }
          const despesa = despesasMap.get(categoria)!;
          despesa.valorAnterior += item.valor;
        });

        // Calcula variações
        const despesasFormatadas = Array.from(despesasMap.values()).map(despesa => ({
          ...despesa,
          variacao: despesa.valorAnterior === 0
            ? despesa.valorAtual > 0 ? 100 : 0
            : ((despesa.valorAtual - despesa.valorAnterior) / despesa.valorAnterior) * 100
        })).sort((a, b) => b.valorAtual - a.valorAtual);

        setDespesas(despesasFormatadas);

        // Busca as vendas do mês ordenadas por valor
        const { data: vendasData } = await supabase
          .from('registro_de_vendas')
          .select(`
            id,
            valor,
            cliente:cliente_id(razao_social),
            vendedor:vendedor_id(nome)
          `)
          .gte('data_venda', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`)
          .lt('data_venda', selectedMonth === 11 
            ? `${selectedYear + 1}-01-01`
            : `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`)
          .order('valor', { ascending: false });

        setVendas(vendasData || []);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmpresa, selectedMonth, selectedYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const renderNoEmpresaSelected = () => (
    <div className={`rounded-xl p-8 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
      <Building className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Selecione uma empresa
      </h2>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Para visualizar a evolução mensal, selecione uma empresa no filtro acima
      </p>
    </div>
  );

  const renderLoading = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {[1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} h-full`}
        >
          <div className={`h-6 w-48 rounded mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
          <div className="space-y-4">
            {Array(5).fill(0).map((_, j) => (
              <div
                key={j}
                className={`h-12 rounded animate-pulse ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Evolução Mensal
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Acompanhe a evolução mensal dos seus indicadores
          </p>
        </div>

        <div className={`flex items-center gap-4 py-2 px-4 rounded-xl ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
          <EmpresaFilter
            value={selectedEmpresa}
            onChange={setSelectedEmpresa}
          />
          <DateFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>
      </div>

      <div className="flex-1 px-6 min-h-0">
        {!selectedEmpresa ? (
          renderNoEmpresaSelected()
        ) : loading ? (
          renderLoading()
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Coluna de Despesas */}
            <div className={`rounded-xl flex flex-col ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Categorias de Despesas
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto custom-scrollbar">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider w-16`}>
                          #
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Categoria
                        </th>
                        <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Mês Anterior
                        </th>
                        <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Mês Atual
                        </th>
                        <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Variação
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {despesas.map((despesa, index) => (
                        <tr key={index} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {index + 1}
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {despesa.categoria}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-medium text-red-500`}>
                            {formatCurrency(despesa.valorAnterior)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-medium text-red-500`}>
                            {formatCurrency(despesa.valorAtual)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-medium flex items-center justify-end gap-1
                            ${despesa.variacao > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {despesa.variacao > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {formatPercentage(despesa.variacao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Coluna de Vendas */}
            <div className={`rounded-xl flex flex-col ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Vendas do Mês
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto custom-scrollbar">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider w-16`}>
                          #
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Cliente
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Vendedor
                        </th>
                        <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {vendas.map((venda, index) => (
                        <tr key={venda.id} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {index + 1}
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {venda.cliente?.razao_social || '-'}
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {venda.vendedor?.nome || '-'}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-medium text-green-500`}>
                            {formatCurrency(venda.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Evolucao;