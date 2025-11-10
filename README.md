<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="96" alt="NestJS logo" />
  <h1>MedInventory API</h1>
  <p>API para gerenciamento de inventário hospitalar, com foco em segurança, rastreabilidade e qualidade contínua.</p>
</div>

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)
![CI](https://img.shields.io/github/actions/workflow/status/MoisesG01/medinventory-api/sonarcloud.yml?label=SonarCloud&logo=github)
![Coverage](https://img.shields.io/badge/Coverage-90%25-brightgreen)

</div>

---

## 📋 Sumário

1. [Visão Geral](#-visão-geral)
2. [Principais Funcionalidades](#-principais-funcionalidades)
3. [Arquitetura & Tecnologias](#-arquitetura--tecnologias)
4. [Pré-requisitos](#-pré-requisitos)
5. [Setup do Ambiente](#-setup-do-ambiente)
6. [Executando a Aplicação](#-executando-a-aplicação)
7. [Testes & Qualidade](#-testes--qualidade)
8. [Banco de Dados & Prisma](#-banco-de-dados--prisma)
9. [Documentação da API](#-documentação-da-api)
10. [Segurança](#-segurança)
11. [CI/CD & Observabilidade](#-cicd--observabilidade)
12. [Estrutura do Projeto](#-estrutura-do-projeto)
13. [Contribuição](#-contribuição)

---

## 🏥 Visão Geral

O **MedInventory API** é o núcleo backend do sistema de inventário hospitalar. Ele provê autenticação, gestão completa de usuários e equipamentos, além de relatórios e integrações necessárias para manter o ambiente médico seguro, auditável e em conformidade com boas práticas.

---

## 🚀 Principais Funcionalidades

- **Autenticação e Autorização**: fluxo de cadastro, login e guarda de rotas com JWT.
- **Gestão de Usuários**: CRUD completo com perfis (`Administrador`, `Gestor`, `Técnico`, `UsuarioComum`) e campos auditáveis (`createdAt`, `updatedAt`).
- **Gestão de Equipamentos**: CRUD + filtros por nome, tipo, setor e status operacional (incluindo `DISPONIVEL`), paginação e relacionamento opcional com responsável técnico (`User`).
- **Validação Robusta**: DTOs com `class-validator` e mensagens amigáveis.
- **Documentação em Swagger**: endpoints descritos, com exemplos e suporte a JWT.
- **Cobertura de Testes**: suíte Jest garantindo >90% de cobertura.

---

## 🧱 Arquitetura & Tecnologias

| Camada                | Destaques                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Back-end (API)**    | NestJS + TypeScript, arquitetura modular (controller → service → Prisma), `ValidationPipe` global, DTOs de entrada/saída, Guards, Interceptors. |
| **Banco de Dados**    | MySQL 8, acesso via Prisma ORM, migrations versionadas, enums sincronizados com TypeScript, UUIDs como chave primária.                          |
| **Infraestrutura**    | Variáveis `.env` centralizadas, CORS configurado, pronto para Docker/Cloud.                                                                     |
| **Qualidade & CI/CD** | GitHub Actions, testes, cobertura (`test:cov`), análise estática com SonarCloud, monitoramento de duplicação e cobertura em “new code”.         |

---

## ✅ Pré-requisitos

- **Node.js** ≥ 20.0
- **Yarn** ≥ 1.22 (ou npm, se preferir)
- **MySQL** ≥ 8.0 (local ou remoto)
- **Prisma CLI** (instalada via `yarn`)
- **Docker** (opcional, para rodar MySQL localmente)

---

## 🧑‍💻 Setup do Ambiente

```bash
# 1. Clone o repositório
git clone https://github.com/MoisesG01/medinventory-api.git
cd medinventory-api

# 2. Instale as dependências
yarn install

# 3. Copie a configuração base
cp .env.example .env

# 4. Ajuste as variáveis no arquivo .env
DATABASE_URL="mysql://user:password@localhost:3306/medinventory"
JWT_SECRET="seu-segredo-aqui"
SONAR_TOKEN="opcional"
```

---

## 🏃 Executando a Aplicação

```bash
# Desenvolvimento (hot-reload)
yarn start:dev

# Ambiente de produção
yarn start:prod
```

O servidor inicializa em `http://localhost:3000` (padrão) e a documentação Swagger fica disponível em `http://localhost:3000/api`.

---

## ✅ Testes & Qualidade

```bash
# Testes unitários
yarn test

# Cobertura de testes (gera coverage/lcov.info)
yarn test:cov
```

- **Cobertura atual:** ~90% de statements.
- **Integração contínua:** GitHub Actions bloqueia merges sem testes passando.
- **SonarCloud:** analisa code smells, duplicação e cobertura em código novo.

---

## 🗄️ Banco de Dados & Prisma

```bash
# Gerar cliente Prisma
yarn prisma generate

# Criar/rodar migrations com histórico
yarn prisma migrate dev --name init_schema

# Visualizar dados em modo gráfico
yarn prisma studio
```

O schema completo está em `prisma/schema.prisma`, com enums (`UserType`, `StatusOperacional`) e relacionamentos configurados.

---

## 📚 Documentação da API

- **Swagger UI:** `http://localhost:3000/api`
- **Autenticação:** clique em “Authorize” e informe `Bearer <token JWT>`.
- **Documentação auxiliar:** `EQUIPAMENTOS_API.md` detalha os fluxos do módulo de equipamentos.

---

## 🔐 Segurança

- Autenticação JWT com `AuthGuard('jwt')`.
- Senhas com hash (`bcryptjs`) e sal automático.
- CORS restrito a origens conhecidas (`main.ts`).
- `ValidationPipe` com `whitelist` + `forbidNonWhitelisted` evita atributos maliciosos.

---

## ⚙️ CI/CD & Observabilidade

- **GitHub Actions:** workflows para build, testes e SonarCloud (`.github/workflows/sonarcloud.yml`).
- **SonarCloud:** métricas de qualidade; PRs recebem análise sem bloquear merges.
- **Relatórios de Teste:** `coverage/lcov.info` e `test-report.xml` prontos para Codecov/Sonar.
- **Conventional Commits:** facilitam histórico, changelog e releases automatizados.

---

## 🗂️ Estrutura do Projeto

```
📦 medinventory-api
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── auth/
│   ├── common/
│   ├── equipamentos/
│   ├── prisma/
│   ├── user/
│   ├── app.module.ts
│   └── main.ts
├── test/ (se houver e2e)
├── EQUIPAMENTOS_API.md
├── README.md
└── sonar-project.properties
```

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Garanta que os testes passam (`yarn test:cov`)
4. Abra um Pull Request seguindo o padrão de commits convencionais

---

> Dúvidas ou sugestões? Abra uma issue no repositório ou entre em contato via Pull Request.
