import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useFilter } from '../../context/FilterContext';
import GlobalFilter from '../common/GlobalFilter';

interface DreHeaderProps {
  showVariation: boolean;
  onToggleVariation: (show: boolean) => void;
  showFullPeriod: boolean;
  onTogglePeriod: (show: boolean) => void;
}

const DreHeader: React.FC<DreHeaderProps> = ({
  showVariation,
  onToggleVariation,
  showFullPeriod,
  onTogglePeriod
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-4 ${isDark ? 'bg-[#151515]' : 'bg-white'} rounded-xl`}>
      <div className="flex items-center gap-2 px-4 py-2">
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
      <div className="flex items-center gap-2 px-4 py-2">
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
      <GlobalFilter />
    </div>
  );
};

export default DreHeader;