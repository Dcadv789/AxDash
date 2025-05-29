import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import EmpresaFilter from '../components/common/EmpresaFilter';
import DateFilter from '../components/common/DateFilter';
import { supabase } from '../lib/supabase';

interface Visualizacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  ordem: number;
  ativo: boolean;
  nome_exibicao: string;
  tipo_visualizacao: string;
}

const Home: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Inicializa com o mês anterior e ano atual
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1);
  const [selectedYear, setSelectedYear] = useState(
    hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear()
  );

  useEffect(() => {
    fetchVisualizacoes();
  }, [selectedEmpresa, selectedMonth, selectedYear]);

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

  const renderVisualizacao = (visualizacao: Visualizacao) => {
    return (
      <div
        key={visualizacao.id}
        className={`rounded-xl p-6 ${isDark ? 'bg-[#151515]' : 'bg-white'}`}
      >
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {visualizacao.nome_exibicao}
        </h3>
        {visualizacao.tipo_visualizacao === 'grafico' ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Área do gráfico: {visualizacao.descricao}
            </p>
          </div>
        ) : (
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {visualizacao.descricao}
          </p>
        )}
      </div>
    );
  };

  // Organiza as visualizações por tipo e ordem
  const cardsVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'card');
  const graficoVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'grafico');
  const widgetsVisualizacoes = visualizacoes.filter(v => v.tipo_visualizacao === 'widget');

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

      <div className={`mx-6 ${isDark ? 'bg-[#151515]' : 'bg-white'} py-4 px-6 rounded-xl mb-6`}>
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-4">
            <EmpresaFilter
              value={selectedEmpresa}
              onChange={setSelectedEmpresa}
              className="flex-1"
            />
            <DateFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Carregando visualizações...
          </p>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {/* Cards em grid */}
          {cardsVisualizacoes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cardsVisualizacoes
                .sort((a, b) => a.ordem - b.ordem)
                .map(renderVisualizacao)}
            </div>
          )}

          {/* Gráficos */}
          {graficoVisualizacoes.length > 0 && (
            <div className="space-y-6">
              {graficoVisualizacoes
                .sort((a, b) => a.ordem - b.ordem)
                .map(renderVisualizacao)}
            </div>
          )}

          {/* Widgets em dois grids */}
          {widgetsVisualizacoes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grid 1 - Widgets de ordem 6 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {widgetsVisualizacoes
                  .filter(w => w.ordem === 6)
                  .map(renderVisualizacao)}
              </div>
              
              {/* Grid 2 - Widgets de ordem 7 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {widgetsVisualizacoes
                  .filter(w => w.ordem === 7)
                  .map(renderVisualizacao)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;