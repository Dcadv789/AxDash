import { supabase } from '../lib/supabase';

interface ComponenteConfig {
  id: string;
  categoria_id?: string;
  indicador_id?: string;
  cliente_id?: string;
  tabela_origem?: string;
  todos?: boolean;
}

export const buscarIdsDisponiveis = async (componente: ComponenteConfig): Promise<string[]> => {
  // Se todos não for explicitamente true, retorna apenas os IDs específicos
  if (componente.todos !== true) {
    return [componente.categoria_id, componente.indicador_id, componente.cliente_id].filter(Boolean) as string[];
  }

  try {
    // Normalize table names to ensure plural form
    const tabelaOrigem = componente.tabela_origem === 'indicador' ? 'indicadores' : componente.tabela_origem;

    const { data, error } = await supabase
      .from(tabelaOrigem)
      .select('id')
      .eq('ativo', true);

    if (error) throw error;
    return data.map(item => item.id);
  } catch (error) {
    console.error(`Erro ao buscar IDs de ${componente.tabela_origem}:`, error);
    return [];
  }
};