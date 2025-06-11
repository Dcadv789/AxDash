import React, { useState, useEffect } from 'react';
import { Building, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
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

// Cache global para armazenar as empresas com duração maior
const empresasCache = new Map<string, { data: Empresa[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

const EmpresaFilter: React.FC<EmpresaFilterProps> = ({ value, onChange, className = '' }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const isDark = theme === 'dark';
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true);

        // Se o usuário for cliente, força o valor da empresa dele
        if (user?.role === 'cliente' && user?.empresa_id) {
          // Verifica o cache primeiro
          const cacheKey = `cliente-${user.empresa_id}`;
          const cachedData = empresasCache.get(cacheKey);
          
          if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            setEmpresas(cachedData.data);
            if (!value) {
              onChange(cachedData.data[0].id);
            }
            setLoading(false);
            return;
          }

          const { data } = await supabase
            .from('empresas')
            .select('id, razao_social')
            .eq('id', user.empresa_id)
            .single();

          if (data) {
            const empresaData = [data];
            setEmpresas(empresaData);
            empresasCache.set(cacheKey, { data: empresaData, timestamp: Date.now() });
            if (!value) {
              onChange(data.id);
            }
          }
          setLoading(false);
          return;
        }

        // Para outros tipos de usuário, verifica o cache global
        const cacheKey = 'todas-empresas';
        const cachedData = empresasCache.get(cacheKey);
        
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
          setEmpresas(cachedData.data);
          setLoading(false);
          return;
        }

        // Se não estiver em cache, busca do servidor
        const { data } = await supabase
          .from('empresas')
          .select('id, razao_social')
          .eq('ativo', true) // Adiciona filtro para empresas ativas
          .order('razao_social')
          .limit(100); // Limita para performance

        if (data) {
          setEmpresas(data);
          empresasCache.set(cacheKey, { data, timestamp: Date.now() });
        }
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, [user, value, onChange]);

  // Se for cliente, não mostra o filtro
  if (user?.role === 'cliente') {
    return null;
  }

  return (
    <div className={`relative min-w-[180px] max-w-[280px] w-auto ${className}`}>
      <div className={`flex items-center gap-3 px-3 py-2 h-[36px] rounded-lg transition-all duration-200
        ${isDark 
          ? 'bg-gray-800 hover:bg-gray-700' 
          : 'bg-gray-100 hover:bg-gray-200'}`}>
        <Building className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        {loading ? (
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Carregando...
          </span>
        ) : (
          <>
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full bg-transparent border-none focus:ring-0 text-sm font-medium appearance-none cursor-pointer pr-6
                ${isDark ? 'text-gray-200' : 'text-gray-700'}
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
            <ChevronDown className={`h-4 w-4 absolute right-3 pointer-events-none flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </>
        )}
      </div>
    </div>
  );
};

export default EmpresaFilter;