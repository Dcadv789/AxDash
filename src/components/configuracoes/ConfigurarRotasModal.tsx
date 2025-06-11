import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Rota {
  id: string;
  path: string;
  label: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  rotas_permitidas: string[];
}

interface ConfigurarRotasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuario: Usuario;
}

const ROTAS_DISPONIVEIS: Rota[] = [
  { id: 'home', path: '/', label: 'Home' },
  { id: 'vendas', path: '/vendas', label: 'Vendas' },
  { id: 'analise', path: '/analise', label: 'Análise' },
  { id: 'analise-vendas', path: '/analise-vendas', label: 'Análise de Vendas' },
  { id: 'metas', path: '/metas', label: 'Metas' },
  { id: 'despesas-vendas', path: '/despesas-vendas', label: 'Desp. de Vendas' },
  { id: 'graficos', path: '/graficos', label: 'Gráficos' },
  { id: 'evolucao', path: '/evolucao', label: 'Evolução Mensal' },
  { id: 'dre', path: '/dre', label: 'DRE' },
  { id: 'cadastros', path: '/cadastros', label: 'Cadastros' },
  { id: 'configuracoes', path: '/configuracoes', label: 'Configurações' }
];

const ConfigurarRotasModal: React.FC<ConfigurarRotasModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usuario
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotasSelecionadas, setRotasSelecionadas] = useState<Set<string>>(
    new Set(usuario.rotas_permitidas || [])
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          rotas_permitidas: Array.from(rotasSelecionadas)
        })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar rotas');
    } finally {
      setLoading(false);
    }
  };

  const toggleRota = (rotaId: string) => {
    setRotasSelecionadas(prev => {
      const next = new Set(prev);
      if (next.has(rotaId)) {
        next.delete(rotaId);
      } else {
        next.add(rotaId);
      }
      return next;
    });
  };

  const toggleTodasRotas = () => {
    if (rotasSelecionadas.size === ROTAS_DISPONIVEIS.length) {
      setRotasSelecionadas(new Set());
    } else {
      setRotasSelecionadas(new Set(ROTAS_DISPONIVEIS.map(rota => rota.id)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-lg ${isDark ? 'bg-[#151515]' : 'bg-white'} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Configurar Rotas - {usuario.nome}
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <button
              type="button"
              onClick={toggleTodasRotas}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center
                ${rotasSelecionadas.size === ROTAS_DISPONIVEIS.length
                  ? 'bg-indigo-600 border-indigo-600'
                  : rotasSelecionadas.size > 0
                    ? 'bg-indigo-600/50 border-indigo-600'
                    : isDark
                      ? 'border-gray-600'
                      : 'border-gray-300'
                }`}>
                {rotasSelecionadas.size === ROTAS_DISPONIVEIS.length && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <span>Selecionar todas as rotas</span>
            </button>
          </div>

          <div className={`border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {ROTAS_DISPONIVEIS.map((rota) => (
              <button
                key={rota.id}
                type="button"
                onClick={() => toggleRota(rota.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors
                  ${isDark
                    ? 'hover:bg-gray-800 border-gray-700'
                    : 'hover:bg-gray-50 border-gray-200'
                  } ${rota.id !== ROTAS_DISPONIVEIS[0].id ? 'border-t' : ''}`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center
                  ${rotasSelecionadas.has(rota.id)
                    ? 'bg-indigo-600 border-indigo-600'
                    : isDark
                      ? 'border-gray-600'
                      : 'border-gray-300'
                  }`}>
                  {rotasSelecionadas.has(rota.id) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  {rota.label}
                </span>
              </button>
            ))}
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
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurarRotasModal;