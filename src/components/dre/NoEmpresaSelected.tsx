import React from 'react';
import { Building } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const NoEmpresaSelected: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} flex flex-col items-center justify-center gap-3`}>
      <Building className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      <div className="text-center">
        <h3 className={`text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Selecione uma empresa
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Escolha uma empresa para visualizar o DRE
        </p>
      </div>
    </div>
  );
};

export default NoEmpresaSelected;