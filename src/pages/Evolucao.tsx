import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useFilter } from '../context/FilterContext';
import GlobalFilter from '../components/common/GlobalFilter';
import { supabase } from '../lib/supabase';
import CategoriasDespesas from '../components/evolucao/CategoriasDespesas';
import VendasMes from '../components/evolucao/VendasMes';

interface Categoria {
  id: string;
  nome: string;
  valor_atual: number;
  valor_anterior: number;
  variacao: number;
}

interface Venda {
  id: string;
  cliente: {
    razao_social: string;
  };
  vendedor: {
    nome: string;
  };
  sdr?: {
    nome: string;
  };
  valor: number;
}

// Cache para armazenar os resultados POR EMPRESA
const evolucaoCache = new Map<string, { data: { categorias: Categoria[]; vendas: Venda[] }; timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos

const Evolucao: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedEmpresa, selectedMonth, selectedYear } = useFilter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [empresaInfo, setEmpresaInfo] = useState<{ razao_social: string } | null>(null);

  useEffect(() => {
    if (!selectedEmpresa) {
      setCategorias([]);
      setVendas([]);
      setEmpresaInfo(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Cria uma chave única para o cache COM EMPRESA
        const cacheKey = `${selectedEmpresa}-${selectedMonth}-${selectedYear}`;
        
        // Verifica o cache
        const cached = evolucaoCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setCategorias(cached.data.categorias);
          setVendas(cached.data.vendas);
          setLoading(false);
          return;
        }

        console.log('Iniciando busca de dados Evolução para empresa:', selectedEmpresa);
        const startTime = Date.now();

        // Calcula o mês anterior
        let mesAnterior = selectedMonth === 0 ? 11 : selectedMonth - 1;
        let anoAnterior = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

        // Calcula as datas para o filtro de vendas
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0);

        // Busca informações da empresa para verificar se é Mentorfy
        const empresaInfoPromise = supabase
          .from('empresas')
          .select('razao_social')
          .eq('id', selectedEmpresa)
          .single();

        // Executa todas as consultas em paralelo COM FILTRO DE EMPRESA
        const [
          empresaInfoResult,
          lancamentosAtuaisResult,
          lancamentosAnterioresResult,
          vendasMesResult
        ] = await Promise.all([
          empresaInfoPromise,
          // Lançamentos do mês atual FILTRADOS POR EMPRESA
          supabase
            .from('lancamentos')
            .select(`
              valor,
              tipo,
              categoria:categorias(id, nome)
            `)
            .eq('mes', selectedMonth + 1)
            .eq('ano', selectedYear)
            .eq('empresa_id', selectedEmpresa) // FILTRO CRÍTICO POR EMPRESA
            .eq('tipo', 'Despesa')
            .not('categoria_id', 'is', null),

          // Lançamentos do mês anterior FILTRADOS POR EMPRESA
          supabase
            .from('lancamentos')
            .select(`
              valor,
              tipo,
              categoria:categorias(id, nome)
            `)
            .eq('mes', mesAnterior + 1)
            .eq('ano', anoAnterior)
            .eq('empresa_id', selectedEmpresa) // FILTRO CRÍTICO POR EMPRESA
            .eq('tipo', 'Despesa')
            .not('categoria_id', 'is', null),

          // Vendas do mês FILTRADAS POR EMPRESA
          supabase
            .from('registro_de_vendas')
            .select(`
              id,
              valor,
              cliente:cliente_id(razao_social),
              vendedor:vendedor_id(nome),
              sdr:sdr_id(nome)
            `)
            .eq('empresa_id', selectedEmpresa) // FILTRO CRÍTICO POR EMPRESA
            .gte('data_venda', startDate.toISOString().split('T')[0])
            .lte('data_venda', endDate.toISOString().split('T')[0])
        ]);

        // Verifica erros
        if (empresaInfoResult.error) {
          throw new Error(`Erro ao buscar informações da empresa: ${empresaInfoResult.error.message}`);
        }
        if (lancamentosAtuaisResult.error) {
          throw new Error(`Erro ao buscar lançamentos atuais: ${lancamentosAtuaisResult.error.message}`);
        }
        if (lancamentosAnterioresResult.error) {
          throw new Error(`Erro ao buscar lançamentos anteriores: ${lancamentosAnterioresResult.error.message}`);
        }
        if (vendasMesResult.error) {
          throw new Error(`Erro ao buscar vendas: ${vendasMesResult.error.message}`);
        }

        console.log(`Dados carregados em ${Date.now() - startTime}ms para empresa ${selectedEmpresa}`);

        // Armazena informações da empresa
        setEmpresaInfo(empresaInfoResult.data);

        // Processa os dados das categorias de forma otimizada
        const categoriasMap = new Map<string, Categoria>();
        
        // Processa lançamentos atuais
        (lancamentosAtuaisResult.data || []).forEach(lanc => {
          if (!lanc.categoria) return;
          const categoriaId = lanc.categoria.id;
          if (!categoriasMap.has(categoriaId)) {
            categoriasMap.set(categoriaId, {
              id: categoriaId,
              nome: lanc.categoria.nome,
              valor_atual: 0,
              valor_anterior: 0,
              variacao: 0
            });
          }
          categoriasMap.get(categoriaId)!.valor_atual += lanc.valor;
        });

        // Processa lançamentos anteriores
        (lancamentosAnterioresResult.data || []).forEach(lanc => {
          if (!lanc.categoria) return;
          const categoriaId = lanc.categoria.id;
          if (!categoriasMap.has(categoriaId)) {
            categoriasMap.set(categoriaId, {
              id: categoriaId,
              nome: lanc.categoria.nome,
              valor_atual: 0,
              valor_anterior: 0,
              variacao: 0
            });
          }
          categoriasMap.get(categoriaId)!.valor_anterior += lanc.valor;
        });

        // Calcula a variação e ordena por valor atual (maior para menor)
        const categoriasProcessadas = Array.from(categoriasMap.values())
          .map(cat => ({
            ...cat,
            variacao: cat.valor_anterior === 0 
              ? (cat.valor_atual > 0 ? 100 : 0)
              : ((cat.valor_atual - cat.valor_anterior) / Math.abs(cat.valor_anterior)) * 100
          }))
          .sort((a, b) => b.valor_atual - a.valor_atual);

        // Ordena vendas por valor (maior para menor)
        const vendasOrdenadas = (vendasMesResult.data || []).sort((a, b) => b.valor - a.valor);

        console.log(`Dados processados em ${Date.now() - startTime}ms para empresa ${selectedEmpresa}`);

        // Atualiza o cache COM EMPRESA
        evolucaoCache.set(cacheKey, {
          data: {
            categorias: categoriasProcessadas,
            vendas: vendasOrdenadas
          },
          timestamp: Date.now()
        });

        setCategorias(categoriasProcessadas);
        setVendas(vendasOrdenadas);
      } catch (error: any) {
        console.error('Erro ao buscar dados:', error);
        
        // Verifica se é um erro de conectividade/CORS
        if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
          setError('Erro de conectividade. Verifique se o Supabase está configurado corretamente para aceitar requisições do localhost:5173');
        } else {
          setError(`Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmpresa, selectedMonth, selectedYear]);

  // Verifica se é a empresa Mentorfy
  const isMentorfy = empresaInfo?.razao_social?.toLowerCase().includes('mentorfy');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-10 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Evolução Mensal
            </h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Acompanhe a evolução mensal dos seus indicadores
              {selectedEmpresa && empresaInfo && (
                <span className="ml-2 text-indigo-500 font-medium">
                  - {empresaInfo.razao_social}
                </span>
              )}
            </p>
          </div>

          <GlobalFilter />
        </div>
      </div>

      {error && (
        <div className="px-6 mb-4">
          <div className={`p-4 rounded-lg border ${
            isDark 
              ? 'bg-red-900/20 border-red-800 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="font-medium">Erro de Conectividade</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 opacity-75">
              Configure o Supabase para aceitar requisições de http://localhost:5173
            </p>
          </div>
        </div>
      )}

      <div className="px-6 flex-1 min-h-0">
        <div className="grid grid-cols-2 gap-4 h-full">
          <CategoriasDespesas
            categorias={categorias}
            loading={loading}
          />
          <VendasMes
            vendas={vendas}
            loading={loading}
            showSDR={isMentorfy} // Passa se deve mostrar coluna SDR
          />
        </div>
      </div>
    </div>
  );
};

export default Evolucao;