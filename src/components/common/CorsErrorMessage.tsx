import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface CorsErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

const CorsErrorMessage: React.FC<CorsErrorMessageProps> = ({ error, onRetry }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isCorsError = error.includes('CORS_ERROR') || error.includes('conectividade');

  if (!isCorsError) {
    return (
      <div className={`p-4 rounded-lg border ${
        isDark 
          ? 'bg-red-900/20 border-red-800 text-red-300' 
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Erro</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border ${
      isDark 
        ? 'bg-orange-900/20 border-orange-800' 
        : 'bg-orange-50 border-orange-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${
          isDark ? 'bg-orange-800/50' : 'bg-orange-100'
        }`}>
          <AlertTriangle className={`h-6 w-6 ${
            isDark ? 'text-orange-400' : 'text-orange-600'
          }`} />
        </div>
        
        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-2 ${
            isDark ? 'text-orange-300' : 'text-orange-800'
          }`}>
            Problema de Conectividade Detectado
          </h3>
          
          <p className={`text-sm mb-4 ${
            isDark ? 'text-orange-200' : 'text-orange-700'
          }`}>
            O aplicativo não consegue se comunicar com o servidor Supabase. 
            Isso geralmente acontece quando o CORS não está configurado corretamente.
          </p>

          <div className={`p-4 rounded-lg mb-4 ${
            isDark ? 'bg-gray-800/50' : 'bg-white/50'
          }`}>
            <h4 className={`font-medium mb-3 ${
              isDark ? 'text-orange-300' : 'text-orange-800'
            }`}>
              Para resolver este problema:
            </h4>
            
            <ol className={`space-y-2 text-sm ${
              isDark ? 'text-orange-200' : 'text-orange-700'
            }`}>
              <li className="flex items-start gap-2">
                <span className="font-medium text-orange-500 mt-0.5">1.</span>
                <span>
                  Acesse o painel do Supabase em{' '}
                  <a 
                    href="https://supabase.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 underline hover:no-underline ${
                      isDark ? 'text-orange-300' : 'text-orange-600'
                    }`}
                  >
                    supabase.com/dashboard
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-orange-500 mt-0.5">2.</span>
                <span>Selecione seu projeto e vá para <strong>Configurações do Projeto</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-orange-500 mt-0.5">3.</span>
                <span>Clique em <strong>API</strong> no menu lateral</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-orange-500 mt-0.5">4.</span>
                <span>
                  Na seção <strong>"CORS origins"</strong>, adicione:{' '}
                  <code className={`px-2 py-1 rounded text-xs font-mono ${
                    isDark ? 'bg-gray-700 text-orange-300' : 'bg-gray-100 text-orange-800'
                  }`}>
                    http://localhost:5173
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-orange-500 mt-0.5">5.</span>
                <span>Salve as alterações e recarregue esta página</span>
              </li>
            </ol>
          </div>

          <div className="flex items-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-orange-700 hover:bg-orange-600 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Recarregar Página
            </button>
          </div>

          {error.includes('Detalhes:') && (
            <details className="mt-4">
              <summary className={`cursor-pointer text-sm ${
                isDark ? 'text-orange-400' : 'text-orange-600'
              }`}>
                Detalhes técnicos
              </summary>
              <pre className={`mt-2 p-3 rounded text-xs overflow-auto ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {error.split('Detalhes: ')[1] || error}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorsErrorMessage;