#!/bin/bash

# Script para fazer deploy da aplicação após mudanças no código
# Uso: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "Fazendo deploy da aplicação MedInventory para o ambiente: $ENVIRONMENT"

# Verificar se a infraestrutura existe
cd "$TERRAFORM_DIR"
if [ ! -f "terraform.tfstate" ]; then
    echo "Infraestrutura não encontrada. Execute ./create.sh primeiro."
    exit 1
fi

# Obter informações da infraestrutura
echo "Obtendo informações da infraestrutura..."
ACR_LOGIN_SERVER=$(terraform output -raw container_registry_login_server)
ACR_USERNAME=$(terraform output -raw container_registry_admin_username)
ACR_PASSWORD=$(terraform output -raw container_registry_admin_password)
DATABASE_URL=$(terraform output -raw database_url)

# Navegar para o diretório raiz do projeto
cd "$PROJECT_ROOT"

echo "Instalando dependências..."
npm install

echo "Construindo aplicação..."
npm run build

echo "Executando testes..."
npm test

echo "Construindo imagem Docker..."
docker build -t "medinventory:$ENVIRONMENT" .

echo "Marcando imagem para o ACR..."
docker tag "medinventory:$ENVIRONMENT" "$ACR_LOGIN_SERVER/medinventory:latest"

echo "Fazendo login no ACR..."
echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" -u "$ACR_USERNAME" --password-stdin

echo "Enviando imagem para o ACR..."
docker push "$ACR_LOGIN_SERVER/medinventory:latest"

echo "Executando migrações do banco de dados..."
# URL encode special characters in password: ? -> %3F, [ -> %5B
# Replace sslmode=required with sslaccept=strict (Prisma specific)
ENCODED_DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/?/%3F/g' | sed 's/\[/%5B/g' | sed 's/sslmode=required/sslaccept=strict/g')
export DATABASE_URL="$ENCODED_DATABASE_URL"
npx prisma migrate deploy

echo "Reiniciando App Service..."
az webapp restart --name "medinventory-app-$ENVIRONMENT" --resource-group "medinventory-rg"

# Aguardar alguns segundos para a aplicação inicializar
echo "Aguardando aplicação inicializar..."
sleep 45

# Verificar se a aplicação está funcionando
APP_SERVICE_URL=$(cd "$TERRAFORM_DIR" && terraform output -raw app_service_url)
echo "Verificando status da aplicação..."

# Tentar algumas vezes antes de falhar
for i in {1..5}; do
    if curl -f -s "$APP_SERVICE_URL" > /dev/null 2>&1; then
        echo "Aplicação está funcionando!"
        echo "URL: $APP_SERVICE_URL"
        echo "Swagger/OpenAPI: $APP_SERVICE_URL/api"
        break
    else
        if [ $i -eq 5 ]; then
            echo "Aplicação pode estar inicializando ainda. Verifique os logs:"
            echo "   az webapp log tail --name medinventory-app-$ENVIRONMENT --resource-group medinventory-rg"
        else
            echo "Tentativa $i/5 - aguardando mais 30 segundos..."
            sleep 30
        fi
    fi
done

echo ""
echo "Deploy concluído com sucesso!"