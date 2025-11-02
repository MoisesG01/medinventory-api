# MedInventory - Infraestrutura Azure com Terraform

Este diretório contém a configuração do Terraform para provisionar a infraestrutura do MedInventory na Azure.

## 📋 Pré-requisitos

1. **Azure CLI** - [Instalar Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Terraform** - [Instalar Terraform](https://www.terraform.io/downloads.html)
3. **Docker** - [Instalar Docker](https://docs.docker.com/get-docker/)
4. **Node.js 18+** - [Instalar Node.js](https://nodejs.org/)

## Início Rápido

### 1. Login no Azure
```bash
az login
```

### 2. Criar Infraestrutura
```bash
cd infrastructure/terraform
./create.sh dev
```

### 3. Fazer Deploy da Aplicação
```bash
./deploy.sh dev
```

## 📁 Estrutura dos Arquivos

```
infrastructure/terraform/
├── main.tf              # Configuração principal e providers
├── variables.tf         # Variáveis de entrada
├── outputs.tf          # Saídas da infraestrutura
├── database.tf         # Configuração do MySQL
├── container.tf        # Azure Container Registry
├── app-service.tf      # App Service com Managed Identity
├── iam.tf              # Atribuições de função (AcrPull)
├── create.sh           # Script para criar infraestrutura
├── start.sh            # Script para iniciar aplicação
├── deploy.sh           # Script para deploy
├── destroy.sh          # Script para destruir infraestrutura
└── .gitignore          # Arquivos ignorados pelo git
```

## 🛠️ Scripts Disponíveis

### `./create.sh [environment]`
Cria toda a infraestrutura necessária:
- Resource Group
- MySQL Flexible Server
- Azure Container Registry (ACR)
- App Service e Service Plan
- Storage Account

### `./deploy.sh [environment]`
Faz deploy da aplicação:
- Instala dependências
- Executa testes
- Constrói imagem Docker
- Envia para ACR
- Executa migrações do banco
- Reinicia App Service

### `./start.sh [environment]`
Inicia/atualiza aplicação (sem testes):
- Constrói imagem Docker
- Envia para ACR
- Reinicia App Service

### `./destroy.sh [environment]`
**⚠️ CUIDADO:** Destrói toda a infraestrutura e dados!

## 🗄️ Banco de Dados

### Configuração
- **Tipo:** Azure Database for MySQL Flexible Server
- **SKU:** B_Standard_B1ms (1 vCore, 2GB RAM)
- **Storage:** 20GB
- **Charset:** utf8mb3
- **Collation:** utf8mb3_unicode_ci
- **Timezone:** -03:00 (Brazil)
- **Região:** Mexico Central

### Conexão
A URL de conexão é automaticamente configurada no App Service via variáveis de ambiente.

Para obter a URL manualmente:
```bash
terraform output -raw database_url
```

### Migrações
As migrações do Prisma são executadas automaticamente durante o deploy:
```bash
npx prisma migrate deploy
```

## 🐳 Container Registry

### Configuração
- **Nome:** `medinventoryacrdev` (basic tier)
- **Admin habilitado:** Sim (para scripts de deploy)
- **Localização:** Mexico Central
- **Autenticação do App Service:** Managed Identity (AcrPull)

### Comandos úteis
```bash
# Obter credenciais do ACR (para deploy manual)
terraform output -raw container_registry_admin_username
terraform output -raw container_registry_admin_password

# Login manual no ACR
az acr login --name medinventoryacrdev

# Verificar permissões da Managed Identity
az role assignment list --scope $(terraform output -raw container_registry_id) --output table
```

## 🌐 App Service

### Configuração
- **OS:** Linux
- **SKU:** B1 (Basic)
- **Container:** Imagem do ACR
- **Port:** 8080
- **Identidade:** System-assigned Managed Identity
- **Autenticação ACR:** Managed Identity (sem senhas)

### URLs importantes
- **Aplicação:** `https://medinventory-app-dev.azurewebsites.net`
- **Health Check:** `https://medinventory-app-dev.azurewebsites.net/health`
- **Swagger/OpenAPI:** `https://medinventory-app-dev.azurewebsites.net/api`

### Monitoramento
```bash
# Ver logs em tempo real
az webapp log tail --name medinventory-app-dev --resource-group medinventory-rg

# Download de logs
az webapp log download --name medinventory-app-dev --resource-group medinventory-rg
```

## 🔧 Variáveis de Ambiente

As seguintes variáveis são configuradas automaticamente no App Service:

- `DATABASE_URL` - URL de conexão com MySQL (com senha URL-encoded e `sslaccept=strict`)
- `JWT_SECRET` - Chave secreta para JWT (gerada automaticamente)
- `JWT_EXPIRES_IN` - Tempo de expiração do JWT (24h)
- `NODE_ENV` - Ambiente (dev/staging/prod)
- `PORT` - Porta da aplicação (8080)
- `DOCKER_REGISTRY_SERVER_URL` - URL do ACR (autenticação via Managed Identity)
- `WEBSITES_ENABLE_APP_SERVICE_STORAGE` - Desabilitado (false)
- `WEBSITES_CONTAINER_START_TIME_LIMIT` - 1800 segundos (30 minutos)

## 📊 Outputs da Infraestrutura

```bash
# Ver todas as saídas
terraform output

# Saídas específicas
terraform output app_service_url
terraform output mysql_server_fqdn
terraform output container_registry_login_server
```

## 🔒 Segurança

### Firewall do MySQL
- **Azure Services:** Permitido (0.0.0.0)
- **Desenvolvimento:** Acesso liberado (apenas em ambiente dev)
- **Produção:** Restrito apenas ao App Service
- **SSL:** Obrigatório (`sslaccept=strict` no Prisma)

### Container Registry
- **Admin:** Habilitado apenas para scripts de deploy
- **App Service:** Usa **Managed Identity** para autenticação (sem senhas)
- **Permissões:** Função `AcrPull` atribuída via `iam.tf`

### Managed Identity
O App Service possui uma **System-assigned Managed Identity** que:
- Elimina a necessidade de gerenciar credenciais manualmente
- Possui permissão `AcrPull` no Azure Container Registry
- Permite autenticação segura e automática entre serviços Azure

### Variáveis Sensíveis
Todas as senhas e chaves são:
- Geradas automaticamente pelo Terraform
- Marcadas como `sensitive` (não aparecem em logs)
- Armazenadas no estado do Terraform (use backend remoto em produção)

## 🚨 Troubleshooting

### Problema: App Service não inicia
```bash
# Verificar logs
az webapp log tail --name medinventory-app-dev --resource-group medinventory-rg

# Verificar configurações
az webapp config appsettings list --name medinventory-app-dev --resource-group medinventory-rg
```

### Problema: Erro de conexão com banco
```bash
# Verificar status do MySQL
az mysql flexible-server show --name medinventory-mysql-dev --resource-group medinventory-rg

# Testar conectividade
az mysql flexible-server connect --name medinventory-mysql-dev --admin-user adminuser
```

### Problema: Imagem não encontrada no ACR
```bash
# Listar imagens
az acr repository list --name medinventoryacrdev

# Ver tags de uma imagem
az acr repository show-tags --name medinventoryacrdev --repository medinventory
```

### Problema: ImagePullFailure
Se o App Service não conseguir baixar a imagem do ACR:

```bash
# Verificar se a Managed Identity está habilitada
az webapp identity show --name medinventory-app-dev --resource-group medinventory-rg

# Verificar permissões da Managed Identity
az role assignment list --assignee <principal-id> --scope /subscriptions/<subscription-id>/resourceGroups/medinventory-rg

# Recriar a atribuição de função (se necessário)
cd infrastructure/terraform
terraform apply -auto-approve
```

**Causa comum:** A Managed Identity foi habilitada mas a atribuição de função `AcrPull` não foi criada. O Terraform agora cria isso automaticamente via `iam.tf`.

## 💰 Custos Estimados (Mexico Central)

### Ambiente de Desenvolvimento (24/7)
- **MySQL B1ms:** ~R$ 120/mês
- **App Service B1:** ~R$ 60/mês
- **ACR Basic:** ~R$ 15/mês
- **Storage Account:** ~R$ 5/mês
- **Managed Identity:** Grátis ✅
- **Total:** ~R$ 200/mês

**Nota:** A região Mexico Central foi escolhida devido a limitações da assinatura Azure for Students na região Brazil South.

### Otimizações para Produção
- Use Reserved Instances para App Service (-30%)
- Configure auto-scaling para reduzir custos
- Use storage mais eficiente para logs

## 📚 Próximos Passos

1. **CI/CD:** Configurar Azure DevOps ou GitHub Actions
2. **Monitoramento:** Application Insights
3. **Backup:** Automated backups para MySQL
4. **CDN:** Azure CDN para assets estáticos
5. **SSL:** Certificado personalizado
6. **Domínio:** Configurar domínio personalizado
7. **Backend Remoto:** Migrar estado do Terraform para Azure Storage
8. **Ambientes Múltiplos:** Criar workspaces para staging e produção

## 🎯 Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure (Mexico Central)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Resource Group: medinventory-rg                     │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  App Service (B1)                           │    │  │
│  │  │  - System-assigned Managed Identity         │    │  │
│  │  │  - Autenticação ACR via MI                  │    │  │
│  │  │  - Health check: /health                    │    │  │
│  │  └─────────────────┬───────────────────────────┘    │  │
│  │                    │                                 │  │
│  │                    │ AcrPull                         │  │
│  │                    ↓                                 │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  Azure Container Registry (Basic)           │    │  │
│  │  │  - medinventory:latest                      │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  MySQL Flexible Server (B1ms)               │    │  │
│  │  │  - SSL obrigatório                          │    │  │
│  │  │  - Firewall: Azure Services + Dev IP        │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🔑 Principais Benefícios da Arquitetura Atual

1. **Segurança Aprimorada:** Managed Identity elimina credenciais hard-coded
2. **Gerenciamento Simplificado:** Menos segredos para gerenciar
3. **Auditoria:** Todas as permissões são rastreáveis via IAM
4. **Conformidade:** Segue as melhores práticas do Azure
5. **Custo Zero:** Managed Identity não tem custo adicional