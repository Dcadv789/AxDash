import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFilter } from '../context/FilterContext';
import GlobalFilter from '../components/common/GlobalFilter';
import VendedorMetasFilter from '../components/metas/VendedorMetasFilter';
import MetasCards from '../components/metas/MetasCards';
import MetasChart from '../components/metas/MetasChart';
import MetasTable from '../components/metas/MetasTable';
import { useMetas } from '../hooks/useMetas';
import { Building, Loader2 } from 'lucide-react';

const Metas: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedEmpresa, selectedMonth, selectedYear } = useFilter();
  const [selectedVendedor, setSelectedVendedor] = useState('');

  const { 
    metasData, 
    chartData, 
    tableData, 
    vendedores,
    loading,
    loadingVendedores,
    error
  } = useMetas(selectedEmpresa, selectedMonth, selectedYear, selectedVendedor);

  // Extrai nomes únicos dos vendedores para o gráfico
  const vendedoresNomes = Array.from(
    new Set(
      chartData.flatMap(data => 
        Object.keys(data).filter(key => key !== 'name')
      )
    )
  );

  const renderNoEmpresaSelected = () => (
    <div className={`rounded-xl p-8 ${isDark ? 'bg-[#151515]' : 'bg-white'} text-center`}>
      <Building className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Selecione uma empresa
      </h2>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Para visualizar as metas de vendas, selecione uma empresa no filtro acima
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

  const renderLoadingTable = () => (
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
            Metas de Vendas
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Acompanhe o desempenho das metas versus vendas realizadas
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
          ) : loadingVendedores ? (
            <div className="flex items-center gap-2">
              <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Carregando filtros...
              </span>
            </div>
          ) : (
            <VendedorMetasFilter
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
                <MetasCards data={metasData} />
              )}
            </div>

            {/* Chart Section */}
            <div className="flex-1 h-[400px]">
              {loading ? (
                renderLoadingChart()
              ) : (
                <MetasChart 
                  data={chartData} 
                  vendedores={vendedoresNomes}
                />
              )}
            </div>

            {/* Table Section */}
            <div className="h-[350px]">
              {loading ? (
                renderLoadingTable()
              ) : (
                <MetasTable data={tableData} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Metas;