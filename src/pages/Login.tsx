import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      setError('Credenciais inválidas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setError('Erro ao conectar com Google. Por favor, tente novamente.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F0F0F] p-4">
      <div className="w-full max-w-4xl bg-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl flex">
        {/* Lado Esquerdo - Imagem Abstrata */}
        <div className="hidden md:block w-1/2 relative p-8">
          <div className="absolute inset-0">
            <img
              src="https://images.pexels.com/photos/3832028/pexels-photo-3832028.jpeg"
              alt="Abstract Background"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-end">
            <h2 className="text-3xl font-bold text-white mb-3">
              Transforme suas ideias em realidade
            </h2>
            <p className="text-gray-200 text-sm">
              Gerencie seus projetos de forma eficiente e moderna
            </p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="w-full md:w-1/2 p-8 pt-12">
          <div className="max-w-sm mx-auto">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6">
                <Layers className="w-10 h-10 text-indigo-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h1>
              <p className="text-gray-400 text-sm">
                Entre com suas credenciais para acessar sua conta
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-900 text-gray-400">
                  Ou continue com
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 bg-gray-800/50 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 border border-gray-700"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-4 h-4"
              />
              Google
            </button>

            <p className="mt-6 text-center text-sm text-gray-400">
              Não tem uma conta?{' '}
              <button className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                Cadastre-se
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;