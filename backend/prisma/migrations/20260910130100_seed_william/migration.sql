-- Cria o login do William (Projetos e Desenhos). Senha temporária: mirainox123
INSERT INTO "Usuario" ("id", "nome", "email", "senha", "cargo", "setor", "role", "updatedAt")
VALUES (
  'usr_william_projetos',
  'William',
  'william@mirainox.com.br',
  '$2a$10$qi2NLCL4MzLvLVl0WbQiDOvFLUdp19hzGueYlGY/VajRBoqhU.JTq',
  'Responsável por Projetos e Desenhos',
  'PROJETOS',
  'PROJETISTA',
  now()
)
ON CONFLICT ("email") DO NOTHING;
