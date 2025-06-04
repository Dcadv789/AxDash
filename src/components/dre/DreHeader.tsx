import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import EmpresaFilter from '../common/EmpresaFilter';
import DateFilter from '../common/DateFilter';

interface DreHeaderProps {
  selectedEmpresa: string;
  onEmpresaChange: (value: string) => void;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  showVariation: boolean;
  onToggleVariation: (show: boolean) => void;
  showFullPeriod: boolean;
  onTogglePeriod: (show: boolean) => void;
}

const DreHeader: React.FC<DreHeaderProps> = ({
  selectedEmpresa,
  onEmpresaChange,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  showVariation,
  onToggleVariation,
  showFullPeriod,
  onTogglePeriod
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="px-6 flex items-center justify-between mb-3">
      <div>
        <h1 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          DRE
        </h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Demonstração do Resultado do Exercício
        </p>
      </div>

      <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleVariation(false)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${!showVariation
                ? isDark
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500 text-white'
                : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Sem variação %
          </button>
          <button
            onClick={() => onToggleVariation(true)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${showVariation
                ? isDark
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500 text-white'
                : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Com variação %
          </button>
        </div>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTogglePeriod(false)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${!showFullPeriod
                ? isDark
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500 text-white'
                : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            6 meses
          </button>
          <button
            onClick={() => onTogglePeriod(true)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${showFullPeriod
                ? isDark
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500 text-white'
                : isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            13 meses
          </button>
        </div>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
        <EmpresaFilter
          value={selectedEmpresa}
          onChange={onEmpresaChange}
        />
        <DateFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
        />
      </div>
    </div>
  );
};

export default DreHeader;