import React from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

interface UsuariosFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'ativos' | 'inativos' | 'todos';
  onStatusChange: (status: 'ativos' | 'inativos' | 'todos') => void;
}

const UsuariosFilter: React.FC<UsuariosFilterProps> = ({ 
  searchTerm, 
  onSearchChange,
  statusFilter,
  onStatusChange
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const buttonClass = (status: typeof statusFilter) => `
    px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200
    ${statusFilter === status
      ? isDark
        ? 'bg-indigo-600 text-white'
        : 'bg-indigo-500 text-white'
      : isDark
        ? 'text-gray-300 hover:bg-gray-700'
        : 'text-gray-600 hover:bg-gray-100'
    }
  `;

  return (
    <div className={`rounded-lg mb-6 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
      <div className="flex items-center gap-4 p-4">
        <div className="flex-1">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Search className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full bg-transparent border-none focus:ring-0 ${isDark ? 'text-white placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'}`}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusChange('ativos')}
            className={buttonClass('ativos')}
          >
            Ativos
          </button>
          <button
            onClick={() => onStatusChange('inativos')}
            className={buttonClass('inativos')}
          >
            Inativos
          </button>
          <button
            onClick={() => onStatusChange('todos')}
            className={buttonClass('todos')}
          >
            Todos
          </button>
        </div>
      </div>
    </div>
  );
}

export default UsuariosFilter;