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
  valor: number;
}

const Evolucao: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedEmpresa, selectedMonth, selectedYear } = useFilter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);

  useEffect(() => {
    if (!selectedEmpresa) {
      setCategorias([]);
      setVendas([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Calcula o mês anterior
        let mesAnterior = selectedMonth === 0 ? 11 : selectedMonth - 1;
        let anoAnterior = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

        // Busca lançamentos do mês atual
        const { data: lancamentosAtuais } = await supabase
          .from('lancamentos')
          .select(`
            valor,
            tipo,
            categoria:categorias(id, nome)
          `)
          .eq('mes', selectedMonth + 1)
          .eq('ano', selectedYear)
          .eq('tipo', 'Despesa') // Filtra apenas despesas
          .not('categoria_id', 'is', null);

        // Busca lançamentos do mês anterior
        const { data: lancamentosAnteriores } = await supabase
          .from('lancamentos')
          .select(`
            valor,
            tipo,
            categoria:categorias(id, nome)
          `)
          .eq('mes', mesAnterior + 1)
          .eq('ano', anoAnterior)
          .eq('tipo', 'Despesa') // Filtra apenas despesas
          .not('categoria_id', 'is', null);

        // Processa os dados das categorias
        const categoriasMap = new Map<string, Categoria>();
        
        lancamentosAtuais?.forEach(lanc => {
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

        lancamentosAnteriores?.forEach(lanc => {
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

        // Calcula as datas para o filtro de vendas
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0);

        // Busca vendas do mês usando data_venda
        const { data: vendasMes } = await supabase
          .from('registro_de_vendas')
          .select(`
            id,
            valor,
            cliente:cliente_id(razao_social),
            vendedor:vendedor_id(nome)
          `)
          .gte('data_venda', startDate.toISOString().split('T')[0])
          .lte('data_venda', endDate.toISOString().split('T')[0]);

        // Ordena vendas por valor (maior para menor)
        const vendasOrdenadas = (vendasMes || []).sort((a, b) => b.valor - a.valor);

        setCategorias(categoriasProcessadas);
        setVendas(vendasOrdenadas);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmpresa, selectedMonth, selectedYear]);

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
            </p>
          </div>

          <GlobalFilter />
        </div>
      </div>

      <div className="px-6 flex-1 min-h-0">
        <div className="grid grid-cols-2 gap-4 h-full">
          <CategoriasDespesas
            categorias={categorias}
            loading={loading}
          />
          <VendasMes
            vendas={vendas}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Evolucao;