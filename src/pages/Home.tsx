import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import TabBar from '../components/common/TabBar';
import EmpresaFilter from '../components/common/EmpresaFilter';
import { supabase } from '../lib/supabase';

interface Visualizacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  ordem: number;
  ativo: boolean;
}

const Home: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisualizacoes();
  }, []);

  const fetchVisualizacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('config_visualizacoes')
        .select('*')
        .eq('pagina', 'home')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setVisualizacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar visualizações:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <div className="px-6 mb-6">
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Visualize e acompanhe os principais indicadores do seu negócio
        </p>
      </div>

      <div className={`px-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} py-4 rounded-xl mb-6`}>
        <div className="flex items-center justify-end">
          <EmpresaFilter
            value={selectedEmpresa}
            onChange={setSelectedEmpresa}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Carregando visualizações...
          </p>
        </div>
      ) : (
        <div className="px-6">
          {/* Grid de 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {visualizacoes
              .filter(v => v.tipo === 'card')
              .map(visualizacao => (
                <div
                  key={visualizacao.id}
                  className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}
                >
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {visualizacao.titulo}
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {visualizacao.descricao}
                  </p>
                </div>
              ))}
          </div>

          {/* Card grande para gráfico */}
          {visualizacoes
            .filter(v => v.tipo === 'grafico')
            .map(visualizacao => (
              <div
                key={visualizacao.id}
                className={`rounded-xl p-6 mb-6 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}
              >
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {visualizacao.titulo}
                </h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {visualizacao.descricao}
                </p>
                <div className="h-[400px] flex items-center justify-center">
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Área do gráfico
                  </p>
                </div>
              </div>
            ))}

          {/* 2 cards largos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visualizacoes
              .filter(v => v.tipo === 'card-largo')
              .map(visualizacao => (
                <div
                  key={visualizacao.id}
                  className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}
                >
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {visualizacao.titulo}
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {visualizacao.descricao}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;