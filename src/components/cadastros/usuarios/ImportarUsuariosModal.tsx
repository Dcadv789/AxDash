import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../../lib/supabase';

interface ImportarUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    nome?: string;
  };
  selected?: boolean;
}

const ImportarUsuariosModal: React.FC<ImportarUsuariosModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  empresaId,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAuthUsers();
    }
  }, [isOpen]);

  const fetchAuthUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Primeiro, busca os auth_ids já importados
      const { data: existingUsers } = await supabase
        .from('usuarios')
        .select('auth_id');

      const existingAuthIds = new Set(existingUsers?.map(user => user.auth_id) || []);

      // Busca todos os usuários do Auth através do Edge Function
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-auth-users`, {
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar usuários');
      }

      const { users, error } = await response.json();
      
      if (error) throw new Error(error);

      // Filtra apenas os usuários que ainda não foram importados
      const availableUsers = users.filter(user => !existingAuthIds.has(user.id));
      setAuthUsers(availableUsers.map(user => ({ ...user, selected: false })));
    } catch (error: any) {
      setError('Erro ao carregar usuários do Auth: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const selectedUsers = authUsers.filter(user => user.selected);
    if (selectedUsers.length === 0) {
      setError('Selecione pelo menos um usuário para importar');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const usersToImport = selectedUsers.map(user => ({
        auth_id: user.id,
        email: user.email,
        nome: user.user_metadata?.nome || user.email?.split('@')[0] || '',
        empresa_id: empresaId,
        role: 'cliente',
        ativo: true,
      }));

      const { error } = await supabase
        .from('usuarios')
        .insert(usersToImport);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error: any) {
      setError('Erro ao importar usuários: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-lg ${isDark ? 'bg-[#151515]' : 'bg-white'} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Importar Usuários do Auth
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <X className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-4">
          <p className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <AlertCircle className="h-4 w-4" />
            Selecione os usuários que deseja importar para o sistema
          </p>
        </div>

        <div className={`border rounded-lg overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <table className="w-full">
            <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
              <tr>
                <th className="w-16 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={authUsers.length > 0 && authUsers.every(user => user.selected)}
                    onChange={(e) => {
                      setAuthUsers(users =>
                        users.map(user => ({ ...user, selected: e.target.checked }))
                      );
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Email
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Data de Criação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className={`px-4 py-3 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Carregando usuários...
                  </td>
                </tr>
              ) : authUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`px-4 py-3 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Nenhum usuário disponível para importação
                  </td>
                </tr>
              ) : (
                authUsers.map((user) => (
                  <tr key={user.id} className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={user.selected}
                        onChange={(e) => {
                          setAuthUsers(users =>
                            users.map(u =>
                              u.id === user.id ? { ...u, selected: e.target.checked } : u
                            )
                          );
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.email}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      {new Date(user.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={importing}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={importing || authUsers.length === 0 || !authUsers.some(user => user.selected)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {importing ? 'Importando...' : 'Importar Selecionados'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportarUsuariosModal;