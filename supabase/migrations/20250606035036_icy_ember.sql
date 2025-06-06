/*
  # Adiciona coluna cliente_id na tabela config_visualizacoes_componentes

  1. Alterações
    - Adiciona coluna cliente_id como chave estrangeira referenciando a tabela clientes
    - Adiciona índice para melhorar performance de consultas

  2. Relacionamentos
    - Cria relacionamento com a tabela clientes
*/

-- Adiciona a coluna cliente_id
ALTER TABLE config_visualizacoes_componentes
ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id);

-- Adiciona índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_config_visualizacoes_componentes_cliente_id
ON config_visualizacoes_componentes(cliente_id);