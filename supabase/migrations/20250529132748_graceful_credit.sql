-- Adiciona nova coluna para relacionamento com auth.users
ALTER TABLE usuarios
ADD COLUMN auth_id_new uuid;

-- Adiciona foreign key constraint para auth.users
ALTER TABLE usuarios
ADD CONSTRAINT fk_auth_users_new
FOREIGN KEY (auth_id_new)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Adiciona um índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id_new ON usuarios(auth_id_new);

-- Adiciona constraint para garantir unicidade
ALTER TABLE usuarios
ADD CONSTRAINT unique_auth_id_new UNIQUE (auth_id_new);