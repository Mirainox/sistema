# Como Rodar o Sistema Mirainox

## Pré-requisitos
- Node.js 18+
- Docker Desktop (para o banco de dados PostgreSQL)
- Git

---

## 1. Iniciar o banco de dados

```bash
docker-compose up -d
```

## 2. Instalar e configurar o Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

## 3. Rodar o Backend

```bash
npm run dev
```

Servidor rodará em: http://localhost:3001

---

## 4. Instalar e rodar o Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Sistema acessível em: http://localhost:3000

---

## Acesso ao Sistema

| Usuário | Email | Senha |
|---------|-------|-------|
| Claudiomir (Diretor) | claudiomir@mirainox.com.br | mirainox123 |
| Mayara (Gestora Admin) | mayara@mirainox.com.br | mirainox123 |
| Wellington (Gerente Op.) | wellington@mirainox.com.br | mirainox123 |
| Administrador | admin@mirainox.com.br | mirainox123 |
| Todos os outros | [nome]@mirainox.com.br | mirainox123 |

---

## Módulos Implementados

- ✅ Dashboard com visão geral
- ✅ Pedidos (criação com checklist obrigatório do vendedor)
- ✅ Ordens de Serviço (O.S.)
- ✅ Distribuição de O.S. para setores
- ✅ Compras (solicitação, ciência, pedido, acompanhamento)
- ✅ Estoque (matéria-prima, peças prontas, consumíveis, EPIs)
- ✅ RH / Controle de EPIs
- ✅ Produção (painel com envio de fotos)
- ✅ Checklists (organização de sexta, tornos, etc.)
- ✅ Manutenção e atendimento técnico
- ✅ Expedição e sugestão de rotas
- ✅ Financeiro (confirmação de pagamentos)
- ✅ Fiscal (notas fiscais previstas)
- ✅ Gerenciamento de usuários
- ✅ Notificações automáticas (cron jobs)
- ✅ Upload de fotos vinculadas à O.S.
- ✅ Controle de acesso por cargo/perfil

---

## Notificações Automáticas (Cron Jobs)

| Horário | Ação |
|---------|------|
| Diariamente 8h | Compras pendentes de efetivação |
| Seg e Qua 17h | Fotos de produção pendentes |
| Sexta 16h | Organização do setor |
| Seg, Qua, Sex 8h | Acompanhamento de prazo de compras |
