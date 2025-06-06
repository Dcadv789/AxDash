/*
  # Adiciona coluna de rotas permitidas

  1. Alterações
    - Adiciona coluna `rotas_permitidas` na tabela `usuarios` para armazenar as rotas que o usuário pode acessar
    - A coluna é um array de strings que armazena os IDs das rotas permitidas
    - Por padrão, todos os usuários têm acesso à rota 'home'
*/

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS rotas_permitidas text[] DEFAULT ARRAY['home'];