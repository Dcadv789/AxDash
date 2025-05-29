import React from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

interface UsuariosHeaderProps {
  onNewUser: () => void;
  onImportUsers: () => void;
}

const UsuariosHeader: React.FC<UsuariosHeaderProps> = ({ onNewUser, onImportUsers }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Usuários do Sistema
        </h2>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Gerencie os usuários que têm acesso ao sistema
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onImportUsers}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Importar do Auth
        </button>
        <button
          onClick={onNewUser}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Novo Usuário
        </button>
      </div>
    </div>
  );
};

export default UsuariosHeader;