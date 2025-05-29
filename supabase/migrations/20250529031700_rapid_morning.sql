-- Adiciona foreign key constraint para auth.users
ALTER TABLE usuarios
ADD CONSTRAINT fk_auth_users
FOREIGN KEY (auth_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Modifica a constraint de empresa_id para permitir null apenas para usuários master
ALTER TABLE usuarios
DROP CONSTRAINT IF EXISTS check_empresa_id_cliente;

ALTER TABLE usuarios
ADD CONSTRAINT check_empresa_id_role
CHECK (
  (role = 'master' AND empresa_id IS NULL) OR
  (role != 'master' AND empresa_id IS NOT NULL)
);