import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface ChartData {
  name: string;
  valor: number;
  [key: string]: any;
}

interface DashboardChartProps {
  type: string;
  data: ChartData[];
  colors?: string[];
  series?: { dataKey: string; name: string }[];
}

const DashboardChart: React.FC<DashboardChartProps> = ({
  type,
  data,
  colors = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B'],
  series = []
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const chartProps = {
    data: data.map(item => ({
      ...item,
      name: `${meses[new Date(item.name.split('/')[1], parseInt(item.name.split('/')[0]) - 1).getMonth()]}/${item.name.split('/')[1]}`
    }))
  };

  const axisStyle = {
    fontSize: 12,
    fontWeight: 500
  };

  const xAxisStyle = {
    ...axisStyle,
    fill: '#3B82F6',
  };

  const yAxisStyle = {
    ...axisStyle,
    fill: isDark ? '#9CA3AF' : '#6B7280',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className={`p-3 rounded-lg shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {entry.name}: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(entry.value)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    const commonProps = {
      ...chartProps,
      margin: { top: 10, right: 20, left: 10, bottom: 20 }
    };

    const legendProps = {
      align: 'right' as const,
      verticalAlign: 'top' as const,
      iconSize: 8,
      wrapperStyle: { paddingBottom: '10px' }
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
            <XAxis 
              dataKey="name" 
              {...xAxisStyle}
              height={30}
              tick={{ fontSize: 13, fontWeight: 600, fill: '#3B82F6' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              {...yAxisStyle}
              width={60}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 1
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend {...legendProps} />
            {series.map((s, index) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
            <XAxis 
              dataKey="name" 
              {...xAxisStyle}
              height={30}
              tick={{ fontSize: 13, fontWeight: 600, fill: '#3B82F6' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              {...yAxisStyle}
              width={60}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 1
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend {...legendProps} />
            {series.map((s, index) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
            <XAxis 
              dataKey="name" 
              {...xAxisStyle}
              height={30}
              tick={{ fontSize: 13, fontWeight: 600, fill: '#3B82F6' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              {...yAxisStyle}
              width={60}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 1
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend {...legendProps} />
            {series.map((s, index) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default DashboardChart;