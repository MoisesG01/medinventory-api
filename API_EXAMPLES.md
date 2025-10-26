# MedInventory API - Exemplos de Uso

## 📚 Documentação Swagger

Acesse a documentação interativa da API em: `http://localhost:3000/api`

## 🔐 Autenticação

### 1. Registrar novo usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario123",
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

**Resposta:**

```json
{
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Fazer login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario123",
    "password": "senha123"
  }'
```

**Resposta:**

```json
{
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 👤 Usuários

### 3. Obter perfil do usuário autenticado

```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI"
```

**Resposta:**

```json
{
  "id": 1,
  "username": "usuario123",
  "email": "usuario@exemplo.com"
}
```

### 4. Verificar token JWT

```bash
curl -X GET http://localhost:3000/auth/verify \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI"
```

**Resposta:**

```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "usuario123"
  }
}
```

### 5. Rota protegida de exemplo

```bash
curl -X GET http://localhost:3000/users/protected \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI"
```

**Resposta:**

```json
{
  "message": "Esta é uma rota protegida!",
  "user": {
    "id": 1,
    "username": "usuario123"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Como executar

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Configurar banco de dados:**

   - Configure a variável `DATABASE_URL` no arquivo `.env`
   - Execute as migrações: `npx prisma migrate dev`

3. **Executar em desenvolvimento:**

   ```bash
   npm run start:dev
   ```

4. **Acessar documentação:**
   - API: `http://localhost:3000`
   - Swagger: `http://localhost:3000/api`

## ✅ Validações Implementadas

A API agora possui validações automáticas com `class-validator`:

### **Validações de Username:**

- Deve ser uma string
- Obrigatório
- Mínimo 3 caracteres
- Máximo 50 caracteres

### **Validações de Email:**

- Deve ter formato de email válido
- Obrigatório

### **Validações de Password:**

- Deve ser uma string
- Obrigatório
- Mínimo 6 caracteres
- Máximo 100 caracteres

### **Exemplo de Erro de Validação:**

```json
{
  "statusCode": 400,
  "message": [
    "Username deve ter pelo menos 3 caracteres",
    "Email deve ter um formato válido",
    "Password deve ter pelo menos 6 caracteres"
  ],
  "error": "Bad Request"
}
```

## 📝 Notas

- Todas as rotas protegidas requerem o header `Authorization: Bearer <token>`
- O token JWT é retornado no login e registro
- A senha nunca é retornada nas respostas da API
- Validações automáticas em todos os DTOs
- Use a documentação Swagger para testar a API interativamente
