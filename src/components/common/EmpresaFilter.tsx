import React, { useEffect, useState } from 'react';
import { Building, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Empresa {
  id: string;
  razao_social: string;
}

interface EmpresaFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const EmpresaFilter: React.FC<EmpresaFilterProps> = ({ value, onChange, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('id, razao_social')
          .order('razao_social');

        if (error) throw error;
        setEmpresas(data || []);
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEmpresas();
  }, []);

  return (
    <div className={`relative min-w-[240px] max-w-[320px] w-auto ${className}`}>
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
        ${isDark 
          ? 'bg-gray-800 hover:bg-gray-700' 
          : 'bg-gray-100 hover:bg-gray-200'}`}>
        <Building className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className={`w-full bg-transparent border-none focus:ring-0 text-sm font-medium appearance-none cursor-pointer pl-1 pr-8
            ${isDark ? 'text-gray-200' : 'text-gray-700'}
            ${loading ? 'opacity-50' : ''}
            [&>option]:px-4 [&>option]:py-2
            [&>option]:bg-white [&>option]:dark:bg-gray-800
            [&>option]:dark:text-gray-200
            [&>option:hover]:bg-indigo-500 [&>option:hover]:text-white
            [&>option]:truncate`}
        >
          <option value="">Todas as empresas</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id} title={empresa.razao_social}>
              {empresa.razao_social}
            </option>
          ))}
        </select>
        <ChevronDown className={`h-4 w-4 absolute right-4 pointer-events-none flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
    </div>
  );
};

export default EmpresaFilter;