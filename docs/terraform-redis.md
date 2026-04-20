# Azure Cache for Redis (Terraform)

O recurso `azurerm_redis_cache` está definido em [`infrastructure/terraform/redis.tf`](../infrastructure/terraform/redis.tf).

## O que é provisionado

- **Azure Cache for Redis** com nome `medinventoryredis{environment}` (sem hífens, para cumprir o naming da Azure).
- SKU configurável por variáveis (`redis_sku_name`, `redis_family`, `redis_capacity`); predefinição **Basic C0** (menor custo, adequado a dev).
- TLS mínimo 1.2, porta não SSL desativada, acesso público à rede ativado (ajustável para produção com Private Link, se necessário).

## Variáveis de ambiente / App Service

O Linux Web App recebe automaticamente (via `app-service.tf`):

| Variável   | Descrição                          |
|-----------|-------------------------------------|
| `REDIS_HOST` | Hostname do Redis                |
| `REDIS_PORT` | Porta SSL (normalmente `6380`)   |
| `REDIS_TLS`  | `"true"`                         |
| `REDIS_URL`  | URL `rediss://` com credenciais  |

Outputs Terraform: `redis_hostname`, `redis_port`, `redis_primary_access_key` (sensível), `redis_connection_string` (sensível).

## Ciclo de vida

### Create (criar / atualizar infra)

Na pasta `infrastructure/terraform`:

```bash
terraform init
terraform plan
terraform apply
```

O Redis passa pelo estado de provisionamento na Azure e fica **disponível para ligações** quando o recurso reporta sucesso. Não existe um passo separado de “start” como numa VM: o serviço é gerido pela plataforma e fica ativo após o provisionamento.

### “Start”

Não há comando Terraform específico de arranque. Se o cache tiver sido **parado manualmente** no portal (opção disponível em alguns SKUs/cenários), o arranque faz-se no **portal Azure** ou pela **API/CLI** da Azure para esse recurso — não faz parte do fluxo normal deste repositório.

### Destroy (remover)

Remover **apenas** o Redis (exemplo):

```bash
cd infrastructure/terraform
terraform destroy -target=azurerm_redis_cache.main
```

Remover **toda** a infraestrutura gerida por este estado:

```bash
terraform destroy
```

**Atenção:** `terraform destroy` elimina os recursos geridos (Redis, App Service, bases de dados, etc., conforme o que estiver no estado). Confirme o plano antes de aplicar.

## Personalização

Edite as variáveis no topo de [`redis.tf`](../infrastructure/terraform/redis.tf) ou use `-var` / ficheiro `.tfvars` para outro SKU (ex.: `Standard` para SLA/replicação).

Documentação do recurso: [azurerm_redis_cache](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/redis_cache).
