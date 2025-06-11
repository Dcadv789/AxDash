import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFilter } from '../context/FilterContext';
import { supabase } from '../lib/supabase';
import GlobalFilter from '../components/common/GlobalFilter';
import VendedorFilter from '../components/despesas-vendas/VendedorFilter';
import DespesasCards from '../components/despesas-vendas/DespesasCards';
import DespesasChart from '../components/despesas-vendas/DespesasChart';
import DespesasTable from '../components/despesas-vendas/DespesasTable';
import IndicadorEficiencia from '../components/despesas-vendas/IndicadorEficiencia';
import { useDespesasVendas } from '../hooks/useDespesasVendas';
import { Building, Loader2 } from 'lucide-react';

interface Vendedor {
  id: string;
  nome: string;
}

// Cache para vendedores por empresa
const vendedoresEmpresaCache = new Map<string, { vendedores: Vendedor[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const DespesasVendas: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedEmpresa, selectedMonth, selectedYear } = useFilter();
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    despesasData, 
    chartData, 
    tableData, 
    indicadorData, 
    loading 
  } = useDespesasVendas(selectedEmpresa, selectedMonth, selectedYear, selectedVendedor);

  // Busca vendedores da empresa selecionada
  useEffect(() => {
    const fetchVendedores = async () => {
      if (!selectedEmpresa) {
        setVendedores([]);
        setSelectedVendedor('');
        setLoadingVendedores(false);
        setError(null);
        return;
      }

      try {
        setLoadingVendedores(true);
        setError(null);

        // Verifica o cache por empresa
        const cacheKey = `vendedores-${selectedEmpresa}`;
        const cached = vendedoresEmpresaCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setVendedores(cached.vendedores);
          setLoadingVendedores(false);
          return;
        }

        console.log('Buscando vendedores da empresa:', selectedEmpresa);
        const startTime = Date.now();

        // Busca vendedores ativos da empresa específica
        const { data: vendedoresData, error: vendedoresError } = await supabase
          .from('pessoas')
          .select('id, nome')
          .eq('empresa_id', selectedEmpresa)
          .eq('Ativo', true)
          .or('cargo.eq.Vendedor,cargo.eq.Ambos')
          .order('nome');

        if (vendedoresError) {
          if (vendedoresError.message?.includes('Failed to fetch') || vendedoresError.name === 'TypeError') {
            throw new Error('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
          }
          throw vendedoresError;
        }

        console.log(`Vendedores carregados em ${Date.now() - startTime}ms`);

        const vendedoresList = vendedoresData || [];

        // Atualiza o cache por empresa
        vendedoresEmpresaCache.set(cacheKey, {
          vendedores: vendedoresList,
          timestamp: Date.now()
        });

        setVendedores(vendedoresList);

        // Limpa seleção quando muda a empresa
        setSelectedVendedor('');
      } catch (error: any) {
        console.error('Erro ao buscar vendedores:', error);
        
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
  }, [selectedEmpresa]);

  const renderNoEmpresaSelected = () => (
    <div className={`rounded-xl p-8 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
      <Building className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Selecione uma empresa
      </h2>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Para visualizar as despesas de vendas, selecione uma empresa no filtro acima
      </p>
    </div>
  );

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

  const renderLoadingChart = () => (
    <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className={`h-6 w-48 rounded mb-4 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    </div>
  );

  const renderLoadingList = () => (
    <div className={`rounded-xl p-6 h-full ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className={`h-6 w-48 rounded mb-6 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-12 rounded animate-pulse ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-10 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Despesas de Vendas
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Acompanhe e analise as despesas dos vendedores ativos
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
          ) : (
            <VendedorFilter
              vendedores={vendedores}
              selectedVendedor={selectedVendedor}
              onVendedorChange={setSelectedVendedor}
              loading={loadingVendedores}
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
          renderNoEmpresaSelected()
        ) : (
          <>
            {/* Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <React.Fragment key={i}>
                    {renderLoadingCard()}
                  </React.Fragment>
                ))
              ) : (
                <DespesasCards data={despesasData} />
              )}
            </div>

            {/* Chart Section - Altura otimizada */}
            <div className="flex-1 h-[400px]">
              {loading ? (
                renderLoadingChart()
              ) : (
                <DespesasChart data={chartData} />
              )}
            </div>

            {/* Table and Indicator Section - Altura fixa e equilibrada */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                {loading ? (
                  renderLoadingList()
                ) : (
                  <DespesasTable data={tableData} />
                )}
              </div>
              <div className="lg:col-span-1">
                {loading ? (
                  renderLoadingList()
                ) : (
                  <IndicadorEficiencia data={indicadorData} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DespesasVendas;