import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useFilter } from '../../context/FilterContext';
import EmpresaFilter from './EmpresaFilter';
import DateFilter from './DateFilter';

const GlobalFilter: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    selectedEmpresa,
    setSelectedEmpresa,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear
  } = useFilter();

  return (
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
  );
};

export default GlobalFilter;