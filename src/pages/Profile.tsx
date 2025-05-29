import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import EditProfileModal from '../components/profile/EditProfileModal';

const Profile: React.FC = () => {
  const { theme } = useTheme();
  const { user, refreshUser } = useUser();
  const isDark = theme === 'dark';
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user) {
      setUserData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        cargo: user.cargo || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const getRoleLabel = (role: string) => {
    const roles = {
      master: 'Master',
      consultor: 'Consultor',
      cliente: 'Cliente'
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <div className="h-full">
      <div className="px-6 mb-6">
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Perfil do Usuário
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Gerencie suas informações pessoais e preferências de conta
        </p>
      </div>

      <div className={`rounded-xl p-6 mb-8 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-6">
          {userData.avatar_url ? (
            <img
              src={userData.avatar_url}
              alt={userData.nome}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              <User className="h-12 w-12" />
            </div>
          )}
          <div>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {userData.nome || 'Carregando...'}
            </h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {getRoleLabel(user?.role || '')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Informações Pessoais
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {userData.email || 'Carregando...'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {userData.telefone || 'Não informado'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Building className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {userData.cargo || 'Não informado'}
              </span>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Configurações
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Editar Perfil
            </button>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Alterar Senha
            </button>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={refreshUser}
        userData={userData}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default Profile;