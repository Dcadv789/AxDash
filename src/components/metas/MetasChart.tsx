import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, ChevronDown } from 'lucide-react';
import DashboardChart from '../dashboard/DashboardChart';

interface ChartDataItem {
  name: string;
  [vendedor: string]: number | string;
}

interface MetasChartProps {
  data: ChartDataItem[];
  vendedores: string[];
}

const MetasChart: React.FC<MetasChartProps> = ({ data, vendedores }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedVendedores, setSelectedVendedores] = useState<Set<string>>(new Set(vendedores));
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleVendedor = (vendedor: string) => {
    const newSelected = new Set(selectedVendedores);
    if (newSelected.has(vendedor)) {
      newSelected.delete(vendedor);
    } else {
      newSelected.add(vendedor);
    }
    setSelectedVendedores(newSelected);
  };

  const toggleAllVendedores = () => {
    if (selectedVendedores.size === vendedores.length) {
      setSelectedVendedores(new Set());
    } else {
      setSelectedVendedores(new Set(vendedores));
    }
  };

  // Filtra os dados para mostrar apenas vendedores selecionados
  const filteredData = data.map(item => {
    const newItem: any = { name: item.name };
    Array.from(selectedVendedores).forEach(vendedor => {
      if (item[vendedor] !== undefined) {
        newItem[vendedor] = item[vendedor];
      }
    });
    return newItem;
  });

  const series = Array.from(selectedVendedores).map(vendedor => ({
    dataKey: vendedor,
    name: vendedor
  }));

  if (!data || data.length === 0) {
    return (
      <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'} flex flex-col`}>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Evolução de Metas vs Vendas - Últimos 13 Meses
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhum dado disponível para exibir
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Evolução de Metas vs Vendas - Últimos 13 Meses
        </h3>
        
        {vendedores.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                ${isDark 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <span className="text-sm">
                {selectedVendedores.size} vendedor{selectedVendedores.size !== 1 ? 'es' : ''} selecionado{selectedVendedores.size !== 1 ? 's' : ''}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className={`absolute right-0 top-full mt-1 w-64 rounded-lg shadow-lg z-10
                ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={toggleAllVendedores}
                    className={`flex items-center gap-2 w-full text-left text-sm
                      ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center
                      ${selectedVendedores.size === vendedores.length
                        ? 'bg-indigo-600 border-indigo-600'
                        : selectedVendedores.size > 0
                          ? 'bg-indigo-600/50 border-indigo-600'
                          : isDark
                            ? 'border-gray-600'
                            : 'border-gray-300'
                      }`}>
                      {selectedVendedores.size === vendedores.length && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span>Selecionar todos</span>
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {vendedores.map(vendedor => (
                    <button
                      key={vendedor}
                      onClick={() => toggleVendedor(vendedor)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors
                        ${isDark
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center
                        ${selectedVendedores.has(vendedor)
                          ? 'bg-indigo-600 border-indigo-600'
                          : isDark
                            ? 'border-gray-600'
                            : 'border-gray-300'
                        }`}>
                        {selectedVendedores.has(vendedor) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{vendedor}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="h-[calc(100%-4rem)]">
        <DashboardChart
          type="line"
          data={filteredData}
          series={series}
          colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6']}
        />
      </div>
    </div>
  );
};

export default MetasChart;