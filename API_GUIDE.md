# 📚 **MedInventory API - Guia Completo**

## 🚀 **Visão Geral**

A **MedInventory API** é uma API RESTful desenvolvida com **NestJS** para gerenciamento de inventário médico. Ela oferece autenticação JWT, CRUD completo de usuários e documentação Swagger integrada.

## 🔐 **Autenticação**

A API usa **JWT (JSON Web Tokens)** para autenticação. Após fazer login, você receberá um token que deve ser incluído no header `Authorization: Bearer <token>` para acessar rotas protegidas.

## 📋 **Estrutura das Rotas**

### **🔑 Rotas de Autenticação (`/auth`)**

- **Propósito**: Login, registro e autenticação
- **Características**:
  - Não requer autenticação para login/registro
  - Retorna tokens JWT
  - Validação de credenciais

### **👥 Rotas de Usuários (`/users`)**

- **Propósito**: CRUD completo de usuários
- **Características**:
  - Requer autenticação JWT
  - Operações administrativas
  - Gerenciamento de perfis

## 🌐 **Endpoints Disponíveis**

### **🔑 Autenticação (`/auth`)**

#### **1. Registro de Usuário**

```http
POST /auth/register
Content-Type: application/json

{
  "nome": "João Silva",
  "username": "joao123",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "tipo": "UsuarioComum"
}
```

**Resposta:**

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "João Silva",
    "username": "joao123",
    "email": "joao@exemplo.com",
    "tipo": "UsuarioComum",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **2. Login**

```http
POST /auth/login
Content-Type: application/json

{
  "username": "joao123",
  "password": "senha123"
}
```

**Resposta:**

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "João Silva",
    "username": "joao123",
    "email": "joao@exemplo.com",
    "tipo": "UsuarioComum",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **3. Perfil do Usuário Autenticado**

```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "João Silva",
  "username": "joao123",
  "email": "joao@exemplo.com",
  "tipo": "UsuarioComum",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### **4. Verificar Token**

```http
GET /auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**

```json
{
  "valid": true,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "joao123"
  }
}
```

### **👥 Usuários (`/users`)**

#### **1. Criar Usuário**

```http
POST /users
Content-Type: application/json

{
  "nome": "Maria Santos",
  "username": "maria456",
  "email": "maria@exemplo.com",
  "password": "senha456",
  "tipo": "Gestor"
}
```

#### **2. Listar Todos os Usuários**

```http
GET /users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "João Silva",
    "username": "joao123",
    "email": "joao@exemplo.com",
    "tipo": "UsuarioComum",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "nome": "Maria Santos",
    "username": "maria456",
    "email": "maria@exemplo.com",
    "tipo": "Gestor",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### **3. Buscar Usuário por ID (UUID)**

```http
GET /users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **4. Atualizar Usuário**

```http
PUT /users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nome": "João Silva Santos",
  "tipo": "Tecnico"
}
```

#### **5. Remover Usuário**

```http
DELETE /users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**

```json
{
  "message": "Usuário removido com sucesso"
}
```

#### **6. Perfil do Usuário Autenticado (Compatibilidade)**

```http
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **7. Rota Protegida de Exemplo**

```http
GET /users/protected
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**

```json
{
  "message": "Esta é uma rota protegida!",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "joao123"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 **Tipos de Usuário**

A API suporta os seguintes tipos de usuário:

- **`Administrador`**: Acesso total ao sistema
- **`Gestor`**: Pode gerenciar inventário e usuários
- **`Tecnico`**: Pode gerenciar inventário
- **`UsuarioComum`**: Acesso básico (padrão)

## ✅ **Validações**

### **Campos Obrigatórios:**

- **`nome`**: 2-100 caracteres
- **`username`**: 3-50 caracteres, único
- **`email`**: Formato válido de email, único
- **`password`**: 6-100 caracteres

### **Exemplos de Validação:**

#### **✅ Dados Válidos:**

```json
{
  "nome": "João Silva",
  "username": "joao123",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "tipo": "UsuarioComum"
}
```

#### **❌ Dados Inválidos:**

```json
{
  "nome": "J", // Muito curto
  "username": "ab", // Muito curto
  "email": "email-invalido", // Formato inválido
  "password": "123" // Muito curto
}
```

**Resposta de Erro:**

```json
{
  "statusCode": 400,
  "message": [
    "Nome deve ter pelo menos 2 caracteres",
    "Username deve ter pelo menos 3 caracteres",
    "Email deve ter um formato válido",
    "Password deve ter pelo menos 6 caracteres"
  ],
  "error": "Bad Request"
}
```

## 🆔 **IDs UUID**

A API agora usa **UUIDs** para identificação de usuários:

- **Formato**: `123e4567-e89b-12d3-a456-426614174000`
- **Vantagens**:
  - Maior segurança
  - Únicos globalmente
  - Não sequenciais
  - Mais difíceis de adivinhar

## 📊 **Códigos de Status HTTP**

- **`200`**: Sucesso
- **`201`**: Criado com sucesso
- **`400`**: Dados inválidos
- **`401`**: Não autorizado (token inválido)
- **`404`**: Usuário não encontrado
- **`409`**: Conflito (username/email já existe)
- **`500`**: Erro interno do servidor

## 🔧 **Como Usar**

### **1. Instalação e Execução**

```bash
# Instalar dependências
npm install

# Executar migrações do banco
npx prisma migrate dev

# Iniciar servidor
npm run start:dev
```

### **2. Acessar Documentação Swagger**

```
http://localhost:3000/api
```

### **3. Fluxo de Autenticação**

1. **Registrar** usuário via `POST /auth/register`
2. **Fazer login** via `POST /auth/login`
3. **Usar token** nas rotas protegidas
4. **Gerenciar usuários** via `/users`

## 🚨 **Tratamento de Erros**

A API retorna erros padronizados:

```json
{
  "statusCode": 400,
  "message": "Mensagem de erro específica",
  "error": "Bad Request"
}
```

## 📝 **Notas Importantes**

- **Tokens JWT** expiram em 1 hora
- **Senhas** são hasheadas com bcrypt
- **IDs** são UUIDs únicos
- **Timestamps** são automáticos (`createdAt`, `updatedAt`)
- **Validação** é automática em todos os endpoints
- **Swagger** está disponível em `/api`

## 🔄 **Diferenças entre `/auth` e `/users`**

| Aspecto          | `/auth`                 | `/users`                          |
| ---------------- | ----------------------- | --------------------------------- |
| **Propósito**    | Autenticação            | CRUD de usuários                  |
| **Autenticação** | Não requerida           | Requerida                         |
| **Operações**    | Login, registro, perfil | Criar, listar, atualizar, remover |
| **Uso**          | Login/logout            | Administração                     |
| **Retorno**      | Token JWT               | Dados do usuário                  |

**Resumo**: Use `/auth` para fazer login e obter tokens. Use `/users` para gerenciar usuários após autenticação.

## 🎯 **Resumo das Melhorias**

### **✅ Implementado:**

1. **UUIDs** para IDs de usuário (maior segurança)
2. **Campo `nome`** obrigatório
3. **Tipos de usuário** (Administrador, Gestor, Tecnico, UsuarioComum)
4. **Validação completa** com class-validator
5. **Documentação Swagger** detalhada
6. **Rotas organizadas** (`/auth` para autenticação, `/users` para CRUD)

### **🔧 Estrutura Atual:**

- **`/auth`**: Login, registro, verificação de token
- **`/users`**: CRUD completo de usuários
- **Ambas funcionam** em paralelo
- **Compatibilidade** mantida com rotas existentes

### **🚀 Próximos Passos Sugeridos:**

1. Implementar sistema de inventário
2. Adicionar logs de auditoria
3. Implementar rate limiting
4. Adicionar testes de integração
5. Implementar cache Redis
