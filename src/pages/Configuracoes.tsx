import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { Settings, Loader2 } from 'lucide-react';
import ConfigurarRotasModal from '../components/configuracoes/ConfigurarRotasModal';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  rotas_permitidas: string[];
}

const Configuracoes: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const isDark = theme === 'dark';
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, role, rotas_permitidas')
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verifica se o usuário atual tem permissão para acessar esta página
  if (user?.role !== 'master') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Settings className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Acesso Restrito
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Você não tem permissão para acessar esta página
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-10 mb-6">
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Configurações
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Configure as permissões de acesso dos usuários
        </p>
      </div>

      <div className="px-6 flex-1 overflow-auto">
        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-[#151515]' : 'bg-white'}`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className="px-6 py-3 text-left">
                  <span className={`text-xs font-medium tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Nome
                  </span>
                </th>
                <th className="px-6 py-3 text-left">
                  <span className={`text-xs font-medium tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Email
                  </span>
                </th>
                <th className="px-6 py-3 text-left">
                  <span className={`text-xs font-medium tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tipo
                  </span>
                </th>
                <th className="px-6 py-3 text-right">
                  <span className={`text-xs font-medium tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ações
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                  <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {usuario.nome}
                  </td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {usuario.email}
                  </td>
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {usuario.role}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(usuario);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      Configurar Rotas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <ConfigurarRotasModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          usuario={selectedUser}
          onSuccess={fetchUsuarios}
        />
      )}
    </div>
  );
};

export default Configuracoes;