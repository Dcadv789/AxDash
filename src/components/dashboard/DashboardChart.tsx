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

  const defaultProps = {
    width: '100%',
    height: 400,
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
  };

  const chartProps = {
    data,
    ...defaultProps,
  };

  const axisStyle = {
    fontSize: 13,
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
      margin: { top: 5, right: 30, left: 20, bottom: 20 }
    };

    const legendProps = {
      align: 'right' as const,
      verticalAlign: 'top' as const,
      iconSize: 10,
      wrapperStyle: { paddingBottom: '20px' }
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
            <XAxis 
              dataKey="name" 
              {...axisStyle}
              height={60}
              tick={{ angle: 0 }}
              interval={0}
            />
            <YAxis {...axisStyle} />
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
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
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
              {...axisStyle}
              height={60}
              tick={{ angle: 0 }}
              interval={0}
            />
            <YAxis {...axisStyle} />
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
              {...axisStyle}
              height={60}
              tick={{ angle: 0 }}
              interval={0}
            />
            <YAxis {...axisStyle} />
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
    <ResponsiveContainer width="100%" height={400}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default DashboardChart;