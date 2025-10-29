# API de Equipamentos - Documentação

## Visão Geral

Este documento descreve os endpoints REST para gerenciamento de equipamentos hospitalares na API MedInventory.

## Autenticação

Todos os endpoints de equipamentos requerem autenticação JWT. Inclua o token no header:

```
Authorization: Bearer <seu-token-jwt>
```

## Endpoints

### 1. Criar Equipamento

**POST** `/equipamentos`

Cria um novo equipamento no sistema.

#### Request Body (CreateEquipamentoDto)

```json
{
  "nome": "Monitor Multiparamétrico",
  "tipo": "Monitor de Sinais Vitais",
  "fabricante": "Philips",
  "modelo": "MX450",
  "numeroSerie": "SN1234567890",
  "codigoPatrimonial": "PAT-2024-001",
  "setorAtual": "UTI",
  "statusOperacional": "EM_USO",
  "dataAquisicao": "2024-01-15",
  "valorAquisicao": 15000.0,
  "dataFimGarantia": "2026-01-15",
  "vidaUtilEstimativa": 10,
  "registroAnvisa": "80100470106",
  "classeRisco": "Classe II",
  "dataUltimaManutencao": "2024-06-01",
  "dataProximaManutencao": "2024-12-01",
  "responsavelTecnico": "Dr. João Silva",
  "criticidade": "Alta",
  "observacoes": "Equipamento em bom estado, calibrado em junho/2024",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Campos Obrigatórios

- `nome` (string, 2-200 caracteres)
- `tipo` (string, 2-100 caracteres)
- `fabricante` (string, 2-100 caracteres)
- `modelo` (string, 1-100 caracteres)
- `statusOperacional` (enum: `DISPONIVEL`, `EM_USO`, `EM_MANUTENCAO`, `INATIVO`, `SUCATEADO`)

#### Campos Opcionais

Todos os demais campos são opcionais.

#### Response (201 Created)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "Monitor Multiparamétrico",
  "tipo": "Monitor de Sinais Vitais",
  "fabricante": "Philips",
  "modelo": "MX450",
  "numeroSerie": "SN1234567890",
  "codigoPatrimonial": "PAT-2024-001",
  "setorAtual": "UTI",
  "statusOperacional": "EM_USO",
  "dataAquisicao": "2024-01-15T00:00:00.000Z",
  "valorAquisicao": 15000.0,
  "dataFimGarantia": "2026-01-15T00:00:00.000Z",
  "vidaUtilEstimativa": 10,
  "registroAnvisa": "80100470106",
  "classeRisco": "Classe II",
  "dataUltimaManutencao": "2024-06-01T00:00:00.000Z",
  "dataProximaManutencao": "2024-12-01T00:00:00.000Z",
  "responsavelTecnico": "Dr. João Silva",
  "criticidade": "Alta",
  "observacoes": "Equipamento em bom estado, calibrado em junho/2024",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Listar Equipamentos (com Filtros e Paginação)

**GET** `/equipamentos`

Lista todos os equipamentos com filtros opcionais e paginação.

#### Query Parameters

- `nome` (string, opcional): Filtrar por nome do equipamento
- `tipo` (string, opcional): Filtrar por tipo do equipamento
- `setorAtual` (string, opcional): Filtrar por setor atual
- `statusOperacional` (enum, opcional): Filtrar por status (`DISPONIVEL`, `EM_USO`, `EM_MANUTENCAO`, `INATIVO`, `SUCATEADO`)
- `page` (number, opcional): Número da página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 10)

#### Exemplo de Request

```
GET /equipamentos?nome=Monitor&statusOperacional=EM_USO&page=1&limit=10
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "nome": "Monitor Multiparamétrico",
      "tipo": "Monitor de Sinais Vitais",
      "fabricante": "Philips",
      "modelo": "MX450",
      "statusOperacional": "EM_USO",
      "setorAtual": "UTI",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 3. Buscar Equipamento por ID

**GET** `/equipamentos/:id`

Busca um equipamento específico pelo UUID.

#### Exemplo de Request

```
GET /equipamentos/123e4567-e89b-12d3-a456-426614174000
```

#### Response (200 OK)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "Monitor Multiparamétrico",
  "tipo": "Monitor de Sinais Vitais",
  "fabricante": "Philips",
  "modelo": "MX450",
  "numeroSerie": "SN1234567890",
  "codigoPatrimonial": "PAT-2024-001",
  "setorAtual": "UTI",
  "statusOperacional": "EM_USO",
  "dataAquisicao": "2024-01-15T00:00:00.000Z",
  "valorAquisicao": 15000.0,
  "dataFimGarantia": "2026-01-15T00:00:00.000Z",
  "vidaUtilEstimativa": 10,
  "registroAnvisa": "80100470106",
  "classeRisco": "Classe II",
  "dataUltimaManutencao": "2024-06-01T00:00:00.000Z",
  "dataProximaManutencao": "2024-12-01T00:00:00.000Z",
  "responsavelTecnico": "Dr. João Silva",
  "criticidade": "Alta",
  "observacoes": "Equipamento em bom estado, calibrado em junho/2024",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Response (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Equipamento não encontrado",
  "error": "Not Found"
}
```

---

### 4. Atualizar Equipamento (Completo)

**PUT** `/equipamentos/:id`

Atualiza todos os campos de um equipamento.

#### Request Body (UpdateEquipamentoDto)

```json
{
  "nome": "Monitor Multiparamétrico Atualizado",
  "tipo": "Monitor de Sinais Vitais",
  "fabricante": "Philips",
  "modelo": "MX550",
  "numeroSerie": "SN1234567890",
  "codigoPatrimonial": "PAT-2024-001",
  "setorAtual": "Emergência",
  "statusOperacional": "EM_MANUTENCAO",
  "dataAquisicao": "2024-01-15",
  "valorAquisicao": 18000.0,
  "dataFimGarantia": "2026-01-15",
  "vidaUtilEstimativa": 12,
  "registroAnvisa": "80100470106",
  "classeRisco": "Classe II",
  "dataUltimaManutencao": "2024-08-01",
  "dataProximaManutencao": "2025-02-01",
  "responsavelTecnico": "Dr. Maria Silva",
  "criticidade": "Média",
  "observacoes": "Equipamento atualizado para nova versão do modelo",
  "userId": "987e6543-e21b-43d2-b456-426614174111"
}
```

**Nota:** Todos os campos são opcionais no `UpdateEquipamentoDto` (usa `PartialType`). Você pode enviar apenas os campos que deseja atualizar.

#### Response (200 OK)

Retorna o equipamento atualizado no mesmo formato do GET.

---

### 5. Atualizar Status Operacional

**PATCH** `/equipamentos/:id/status`

Atualiza apenas o status operacional do equipamento.

#### Request Body (UpdateStatusDto)

```json
{
  "statusOperacional": "EM_MANUTENCAO"
}
```

#### Valores Válidos para StatusOperacional

- `DISPONIVEL`
- `EM_USO`
- `EM_MANUTENCAO`
- `INATIVO`
- `SUCATEADO`

#### Response (200 OK)

Retorna o equipamento atualizado com o novo status.

---

### 6. Excluir Equipamento

**DELETE** `/equipamentos/:id`

Exclui um equipamento do sistema.

#### Exemplo de Request

```
DELETE /equipamentos/123e4567-e89b-12d3-a456-426614174000
```

#### Response (200 OK)

```json
{
  "message": "Equipamento removido com sucesso"
}
```

#### Response (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Equipamento não encontrado",
  "error": "Not Found"
}
```

---

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Dados inválidos ou usuário responsável não encontrado
- `401 Unauthorized`: Token JWT inválido ou expirado
- `404 Not Found`: Equipamento não encontrado

## Validações

### Campos de Texto

- `nome`: 2-200 caracteres
- `tipo`: 2-100 caracteres
- `fabricante`: 2-100 caracteres
- `modelo`: 1-100 caracteres
- `numeroSerie`: máximo 100 caracteres
- `codigoPatrimonial`: máximo 50 caracteres
- `setorAtual`: máximo 100 caracteres
- `registroAnvisa`: máximo 50 caracteres
- `classeRisco`: máximo 50 caracteres
- `responsavelTecnico`: máximo 200 caracteres
- `criticidade`: máximo 50 caracteres
- `observacoes`: máximo 1000 caracteres

### Campos Numéricos

- `valorAquisicao`: deve ser positivo
- `vidaUtilEstimativa`: deve ser um inteiro positivo

### Campos de Data

Todas as datas devem estar no formato ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ).

### UUIDs

- `id`: UUID válido (v4)
- `userId`: UUID válido (v4) ou `null`

---

## Exemplos de Uso com cURL

### Criar Equipamento

```bash
curl -X POST http://localhost:3000/equipamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token>" \
  -d '{
    "nome": "Monitor Multiparamétrico",
    "tipo": "Monitor de Sinais Vitais",
    "fabricante": "Philips",
    "modelo": "MX450",
    "statusOperacional": "EM_USO"
  }'
```

### Listar Equipamentos com Filtros

```bash
curl -X GET "http://localhost:3000/equipamentos?nome=Monitor&statusOperacional=EM_USO&page=1&limit=10" \
  -H "Authorization: Bearer <seu-token>"
```

### Atualizar Status

```bash
curl -X PATCH http://localhost:3000/equipamentos/123e4567-e89b-12d3-a456-426614174000/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token>" \
  -d '{
    "statusOperacional": "EM_MANUTENCAO"
  }'
```

---

## Documentação Swagger

Após iniciar o servidor, acesse a documentação interativa do Swagger em:

```
http://localhost:3000/api
```

Procure pela seção **equipamentos** para ver todos os endpoints com exemplos interativos.

---

## Modelo de Dados (Prisma Schema)

```prisma
enum StatusOperacional {
  DISPONIVEL
  EM_USO
  EM_MANUTENCAO
  INATIVO
  SUCATEADO
}

model Equipamento {
  id                    String            @id @default(uuid())
  nome                  String
  tipo                  String
  fabricante            String
  modelo                String
  numeroSerie           String?
  codigoPatrimonial     String?
  setorAtual            String?
  statusOperacional     StatusOperacional
  dataAquisicao         DateTime?
  valorAquisicao        Float?
  dataFimGarantia       DateTime?
  vidaUtilEstimativa    Int?
  registroAnvisa        String?
  classeRisco           String?
  dataUltimaManutencao  DateTime?
  dataProximaManutencao DateTime?
  responsavelTecnico    String?
  criticidade           String?
  observacoes           String?
  userId                String?
  user                  User?             @relation(fields: [userId], references: [id])
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
}
```
