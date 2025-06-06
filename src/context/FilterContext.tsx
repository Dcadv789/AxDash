import React, { createContext, useContext, useState, useEffect } from 'react';

interface FilterContextType {
  selectedEmpresa: string;
  setSelectedEmpresa: (empresa: string) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializa com o mês anterior
  const hoje = new Date();
  const mesAnterior = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
  const anoMesAnterior = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();

  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(mesAnterior);
  const [selectedYear, setSelectedYear] = useState(anoMesAnterior);

  return (
    <FilterContext.Provider value={{
      selectedEmpresa,
      setSelectedEmpresa,
      selectedMonth,
      setSelectedMonth,
      selectedYear,
      setSelectedYear,
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};