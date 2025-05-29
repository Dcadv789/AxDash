import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import UsuariosHeader from './UsuariosHeader';
import UsuariosFilter from './UsuariosFilter';
import UsuariosTable from './UsuariosTable';
import NovoUsuarioModal from './NovoUsuarioModal';
import ImportarUsuariosModal from './ImportarUsuariosModal';
import EditarUsuarioModal from './EditarUsuarioModal';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  empresa_id: string;
  ativo: boolean;
  role: string;
  empresa?: {
    razao_social: string;
  };
}

interface UsuariosTabProps {
  empresaId: string;
}

const UsuariosTab: React.FC<UsuariosTabProps> = ({ empresaId }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'inativos' | 'todos'>('ativos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, [empresaId, statusFilter]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('usuarios')
        .select(`
          *,
          empresa:empresas(razao_social)
        `);
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      if (statusFilter !== 'todos') {
        query = query.eq('ativo', statusFilter === 'ativos');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleToggleUserStatus = async (user: Usuario) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !user.ativo })
        .eq('id', user.id);

      if (error) throw error;
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="px-6">
        <UsuariosHeader 
          onNewUser={() => setIsModalOpen(true)}
          onImportUsers={() => setIsImportModalOpen(true)}
        />
      </div>
      <UsuariosFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />
      <UsuariosTable
        usuarios={filteredUsuarios}
        loading={loading}
        onEdit={handleEditUser}
        onToggleStatus={handleToggleUserStatus}
        onDelete={handleDeleteUser}
      />
      <NovoUsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsuarios}
        empresaId={empresaId}
      />
      <ImportarUsuariosModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchUsuarios}
        empresaId={empresaId}
      />
      {selectedUser && (
        <EditarUsuarioModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={fetchUsuarios}
          usuario={selectedUser}
        />
      )}
    </>
  );
};

export default UsuariosTab;