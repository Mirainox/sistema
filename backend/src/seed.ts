import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from './config/database'

async function seed() {
  console.log('🌱 Iniciando seed...')

  const usuarios = [
    { nome: 'Claudiomir Vieira', email: 'claudiomir@mirainox.com.br', cargo: 'Diretor-Presidente', setor: 'DIRETORIA' as const, role: 'DIRETOR' as const },
    { nome: 'Mayara Martins Minarini', email: 'mayara@mirainox.com.br', cargo: 'Gestora Administrativa', setor: 'ADMINISTRATIVO' as const, role: 'GESTOR_ADMIN' as const },
    { nome: 'Sérgio Minarini', email: 'sergio@mirainox.com.br', cargo: 'Gestor de Produção', setor: 'ADMINISTRATIVO' as const, role: 'GESTOR_PRODUCAO' as const },
    { nome: 'Wellington Moura', email: 'wellington@mirainox.com.br', cargo: 'Gerente Geral Operacional', setor: 'ADMINISTRATIVO' as const, role: 'GERENTE_OPERACIONAL' as const },
    { nome: 'Luciana Maria', email: 'luciana@mirainox.com.br', cargo: 'RH', setor: 'RH' as const, role: 'RH' as const },
    { nome: 'Talita', email: 'talita@mirainox.com.br', cargo: 'Recepção e Despacho', setor: 'ADMINISTRATIVO' as const, role: 'EXPEDICAO' as const },
    { nome: 'Neide', email: 'neide@mirainox.com.br', cargo: 'Fiscal', setor: 'FISCAL' as const, role: 'FISCAL' as const },
    { nome: 'Sara', email: 'sara@mirainox.com.br', cargo: 'Fiscal', setor: 'FISCAL' as const, role: 'FISCAL' as const },
    { nome: 'Camila', email: 'camila@mirainox.com.br', cargo: 'Financeiro', setor: 'FINANCEIRO' as const, role: 'FINANCEIRO' as const },
    { nome: 'Carol', email: 'carol@mirainox.com.br', cargo: 'Compras', setor: 'COMPRAS' as const, role: 'COMPRADOR' as const },
    { nome: 'Davi', email: 'davi@mirainox.com.br', cargo: 'Compras', setor: 'COMPRAS' as const, role: 'COMPRADOR' as const },
    { nome: 'Helismar Parnier', email: 'helismar@mirainox.com.br', cargo: 'Vendedor', setor: 'VENDAS' as const, role: 'VENDEDOR' as const },
    { nome: 'Sulamita', email: 'sulamita@mirainox.com.br', cargo: 'Vendedora', setor: 'VENDAS' as const, role: 'VENDEDOR' as const },
    { nome: 'Ana Luísa Alcântara', email: 'analuisa@mirainox.com.br', cargo: 'Vendedora', setor: 'VENDAS' as const, role: 'VENDEDOR' as const },
    { nome: 'Gilberto Adriano', email: 'gilberto@mirainox.com.br', cargo: 'Vendedor', setor: 'VENDAS' as const, role: 'VENDEDOR' as const },
    { nome: 'Israel', email: 'israel@mirainox.com.br', cargo: 'Produção Inox', setor: 'PRODUCAO_INOX' as const, role: 'PRODUCAO' as const },
    { nome: 'Gabriel', email: 'gabriel@mirainox.com.br', cargo: 'Caldeiraria', setor: 'CALDEIRARIA' as const, role: 'PRODUCAO' as const },
    { nome: 'Hernani Mariano', email: 'hernani@mirainox.com.br', cargo: 'Usinagem', setor: 'USINAGEM' as const, role: 'PRODUCAO' as const },
    { nome: 'Moisés', email: 'moises@mirainox.com.br', cargo: 'Elétrica', setor: 'ELETRICA' as const, role: 'PRODUCAO' as const },
    { nome: 'Ricardo', email: 'ricardo@mirainox.com.br', cargo: 'Montagem Automatizada', setor: 'MONTAGEM_AUTOMATIZADA' as const, role: 'PRODUCAO' as const },
    { nome: 'Carlos', email: 'carlos@mirainox.com.br', cargo: 'Gerente Almoxarifado', setor: 'ALMOXARIFADO_GERAL' as const, role: 'ALMOXARIFE' as const },
    { nome: 'Matheus Fagundes', email: 'matheus@mirainox.com.br', cargo: 'Almoxarifado - Peças Prontas', setor: 'ALMOXARIFADO_GERAL' as const, role: 'ALMOXARIFE' as const },
    { nome: 'João Vitor', email: 'joaovitor@mirainox.com.br', cargo: 'Almoxarifado Consumíveis', setor: 'ALMOXARIFADO_CONSUMIVEIS' as const, role: 'ALMOXARIFE' as const },
    { nome: 'Felipe', email: 'felipe@mirainox.com.br', cargo: 'Loja de Peças', setor: 'LOJA_PECAS' as const, role: 'LOJA_PECAS' as const },
    { nome: 'Caio', email: 'caio@mirainox.com.br', cargo: 'TI / Marketing', setor: 'TI' as const, role: 'MARKETING' as const },
    { nome: 'Francisco Neto', email: 'francisco@mirainox.com.br', cargo: 'Arte Gráfica / Marketing', setor: 'MARKETING' as const, role: 'MARKETING' as const },
    { nome: 'Admin', email: 'admin@mirainox.com.br', cargo: 'Administrador do Sistema', setor: 'TI' as const, role: 'ADMIN' as const },
  ]

  const senhaPadrao = await bcrypt.hash('mirainox123', 10)

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, senha: senhaPadrao },
    })
    console.log(`✅ ${u.nome}`)
  }

  console.log('\n🎉 Seed concluído!')
  console.log('📧 Email padrão: [nome]@mirainox.com.br')
  console.log('🔑 Senha padrão: mirainox123')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
