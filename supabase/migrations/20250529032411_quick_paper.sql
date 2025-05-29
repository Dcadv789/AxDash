-- Garante que auth_id não pode ser nulo
ALTER TABLE usuarios
ALTER COLUMN auth_id SET NOT NULL;

-- Adiciona um índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON usuarios(auth_id);

-- Garante que cada auth_id é único
ALTER TABLE usuarios
ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);

-- Garante que o usuário só pode ser criado se existir um auth.user correspondente
ALTER TABLE usuarios
ADD CONSTRAINT check_auth_user_exists
CHECK (auth_id IS NOT NULL);