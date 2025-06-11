import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface DateFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Gera array de anos (5 anos anteriores até o ano atual)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

  const selectClasses = `w-full h-full absolute inset-0 opacity-0 cursor-pointer z-10`;
  const containerClasses = `relative min-w-[120px] h-[36px] rounded-lg transition-all duration-200
    ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`;
  const contentClasses = `absolute inset-0 flex items-center px-3 pointer-events-none
    ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <div className="flex items-center gap-3">
      <div className={containerClasses.replace('min-w-[120px]', 'min-w-[140px]')}>
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className={selectClasses}
        >
          {months.map((month, index) => (
            <option key={index} value={index}>
              {month}
            </option>
          ))}
        </select>
        <div className={contentClasses}>
          <span className="flex-1 text-sm font-medium truncate">{months[selectedMonth]}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
        </div>
      </div>

      <div className={containerClasses.replace('min-w-[120px]', 'min-w-[100px]')}>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className={selectClasses}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <div className={contentClasses}>
          <span className="flex-1 text-sm font-medium">{selectedYear}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
        </div>
      </div>
    </div>
  );
};

export default DateFilter;