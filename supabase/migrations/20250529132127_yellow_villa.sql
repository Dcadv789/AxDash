-- Primeiro, remover as policies que dependem da coluna auth_id
DROP POLICY IF EXISTS "Usuários podem ver configurações" ON config_visualizacoes;

-- Agora podemos alterar a coluna auth_id para UUID
ALTER TABLE usuarios
ALTER COLUMN auth_id TYPE uuid USING auth_id::uuid;

-- Adiciona a foreign key constraint para auth.users
ALTER TABLE usuarios
ADD CONSTRAINT fk_auth_users
FOREIGN KEY (auth_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Garante que auth_id é único e não nulo
ALTER TABLE usuarios
ALTER COLUMN auth_id SET NOT NULL;

ALTER TABLE usuarios
ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);

-- Adiciona um índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON usuarios(auth_id);

-- Recria a policy com a coluna já alterada
CREATE POLICY "Usuários podem ver configurações"
ON config_visualizacoes
FOR SELECT
USING (auth_id = auth.uid());