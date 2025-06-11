import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import DashboardChart from '../dashboard/DashboardChart';

interface ChartDataItem {
  name: string;
  [vendedor: string]: number | string;
}

interface DespesasChartProps {
  data: ChartDataItem[];
}

const DespesasChart: React.FC<DespesasChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'} flex flex-col`}>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Evolução das Despesas por Vendedor
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhum dado disponível para exibir
          </p>
        </div>
      </div>
    );
  }

  // Extrai as séries (vendedores) dos dados, garantindo que existam dados válidos
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'name' && typeof item[key] === 'number') {
        allKeys.add(key);
      }
    });
  });

  const series = Array.from(allKeys).map(vendedor => ({
    dataKey: vendedor,
    name: vendedor
  }));

  // Se não há séries válidas, mostra mensagem
  if (series.length === 0) {
    return (
      <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'} flex flex-col`}>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Evolução das Despesas por Vendedor
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhum vendedor ativo com despesas encontrado para este período
          </p>
        </div>
      </div>
    );
  }

  // Processa os dados para garantir que todos os valores sejam números
  const processedData = data.map(item => {
    const processedItem: any = { name: item.name };
    
    series.forEach(({ dataKey }) => {
      const value = item[dataKey];
      processedItem[dataKey] = typeof value === 'number' ? value : 0;
    });
    
    return processedItem;
  });

  return (
    <div className={`h-full rounded-xl p-4 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Evolução das Despesas por Vendedor - Últimos 13 Meses
      </h3>
      <div className="h-[calc(100%-2.5rem)]">
        <DashboardChart
          type="area"
          data={processedData}
          series={series}
          colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6']}
        />
      </div>
    </div>
  );
};

export default DespesasChart;