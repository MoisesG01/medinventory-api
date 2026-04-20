# GitHub Actions - Terraform Workflows

Este diretório contém workflows do GitHub Actions para gerenciar a infraestrutura Azure do MedInventory de forma manual.

## Workflows Disponíveis

### 1. Terraform Create Infrastructure
**Arquivo:** `terraform-create.yml`

Cria toda a infraestrutura na Azure:
- Resource Group
- Azure MySQL Flexible Server
- Azure Container Registry (ACR)
- App Service e Service Plan
- Storage Account
- Managed Identity e permissões

**Como usar:**
1. Vá para **Actions** → **Terraform Create Infrastructure**
2. Clique em **Run workflow**
3. Selecione o ambiente (dev/staging/prod)
4. Digite `CREATE` para confirmar
5. Clique em **Run workflow**

**Duração estimada:** 5-10 minutos

---

### 2. Terraform Start Application
**Arquivo:** `terraform-start.yml`

Faz o deploy da aplicação para a infraestrutura existente:
- Build da aplicação Node.js
- Construção da imagem Docker
- Push para o Azure Container Registry
- Restart do App Service
- Health check automático

**Como usar:**
1. Vá para **Actions** → **Terraform Start Application**
2. Clique em **Run workflow**
3. Selecione o ambiente (dev/staging/prod)
4. Clique em **Run workflow**

**Duração estimada:** 3-5 minutos

---

### 3. Terraform Destroy Infrastructure
**Arquivo:** `terraform-destroy.yml`

**ATENÇÃO:** Destrói permanentemente toda a infraestrutura e dados!

**Como usar:**
1. Vá para **Actions** → **Terraform Destroy Infrastructure**
2. Clique em **Run workflow**
3. Selecione o ambiente (dev/staging/prod)
4. Digite `DESTROY` no campo de confirmação
5. Digite o nome do ambiente novamente (ex: `dev`)
6. Clique em **Run workflow**

**Duração estimada:** 3-5 minutos

---

## Configuração Inicial (Obrigatória)

### 1. Criar Service Principal no Azure

Execute no terminal:

```bash
az ad sp create-for-rbac \
  --name "medinventory-github-actions" \
  --role contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID> \
  --sdk-auth
```

**Importante:** Substitua `<YOUR_SUBSCRIPTION_ID>` pelo ID da sua subscription Azure.

Para obter o ID da subscription:
```bash
az account show --query id -o tsv
```

O comando retornará um JSON similar a:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**Copie todo este JSON!**

### 2. Adicionar Secret no GitHub

1. Vá para o repositório no GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Nome: `AZURE_CREDENTIALS`
5. Value: Cole o JSON completo que você copiou acima
6. Clique em **Add secret**

### 3. Verificar Permissões

Certifique-se de que você tem permissões para:
- Criar recursos na Azure
- Executar workflows no GitHub Actions
- Fazer push de branches

---

## Fluxo de Trabalho Recomendado

### Primeira vez (Setup completo):
1. **Terraform Create Infrastructure** → Cria toda a infraestrutura
2. Aguarde a conclusão (~10 min)
3. **Terraform Start Application** → Faz o deploy da app
4. Acesse a aplicação na URL mostrada no workflow

### Deploy de atualizações:
1. Faça commit das suas alterações
2. Execute **Terraform Start Application**
3. Aguarde health check (~3-5 min)

### Destruir ambiente (cuidado!):
1. Faça backup de dados importantes
2. Execute **Terraform Destroy Infrastructure**
3. Confirme duas vezes
4. Toda a infraestrutura será removida

---

## Outputs dos Workflows

Cada workflow gera um resumo detalhado que inclui:

### Create Infrastructure:
- URLs dos serviços criados
- Credenciais do banco (sensíveis)
- Próximos passos recomendados

### Start Application:
- URL da aplicação
- Link para Swagger/API
- Status do health check

### Destroy Infrastructure:
- Recursos destruídos
- Timestamp da destruição
- Avisos importantes

---

## Monitoramento e Debug

### Ver logs do workflow:
1. Vá para **Actions**
2. Clique no workflow executado
3. Expanda os steps para ver detalhes

### Ver logs da aplicação no Azure:
```bash
az webapp log tail --name medinventory-app-dev --resource-group medinventory-rg
```

### Verificar recursos criados:
```bash
# Listar recursos do resource group
az resource list --resource-group medinventory-rg --output table

# Ver detalhes do App Service
az webapp show --name medinventory-app-dev --resource-group medinventory-rg

# Ver imagens no ACR
az acr repository list --name medinventoryacrdev --output table
```

---

## Troubleshooting

### Erro: "AZURE_CREDENTIALS not found"
- Verifique se o secret foi criado corretamente no GitHub
- Confirme que o nome é exatamente `AZURE_CREDENTIALS`
- Verifique se você tem permissões de admin no repositório

### Erro: "Terraform state locked"
- Aguarde o workflow anterior terminar
- Se persistir, pode ser necessário desbloquear manualmente:
```bash
cd infrastructure/terraform
terraform force-unlock <LOCK_ID>
```

### Erro: "Authentication failed"
- Verifique se o Service Principal ainda existe e tem permissões
- Recrie o Service Principal e atualize o secret
- Confirme que a subscription está ativa

### Erro: "Resource already exists"
- Execute **Terraform Destroy** antes de criar novamente
- Ou use **Terraform Start** para atualizar a aplicação existente

---

## Segurança

### Boas práticas:
- Nunca commit credenciais no código
- Use secrets do GitHub para dados sensíveis
- Limite acesso aos workflows (proteja branches)
- Revise permissões do Service Principal regularmente
- Use ambientes diferentes (dev/staging/prod)
- Configure branch protection rules

### Secrets necessários:
- `AZURE_CREDENTIALS` (obrigatório) - Credenciais do Azure Service Principal

### Secrets opcionais (futuro):
- `ACR_USERNAME` - Usuário do Container Registry
- `ACR_PASSWORD` - Senha do Container Registry
- `DB_PASSWORD` - Senha customizada do banco

---

## Recursos Adicionais

- [Terraform Documentation](https://www.terraform.io/docs)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Azure App Service](https://docs.microsoft.com/azure/app-service/)

---

## Suporte

Se encontrar problemas:
1. Verifique os logs do workflow no GitHub Actions
2. Consulte a documentação do Terraform em `infrastructure/terraform/README.md`
3. Verifique os logs do Azure App Service
4. Abra uma issue no repositório
