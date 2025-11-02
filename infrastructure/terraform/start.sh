#!/bin/bash

# Script para iniciar/atualizar a aplicação MedInventory
# Uso: ./start.sh [environment]

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "Iniciando aplicação MedInventory para o ambiente: $ENVIRONMENT"

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
APP_SERVICE_URL=$(terraform output -raw app_service_url)
DATABASE_URL=$(terraform output -raw database_url)

# Navegar para o diretório raiz do projeto
cd "$PROJECT_ROOT"

echo "Construindo imagem Docker..."
docker build -t "medinventory:latest" .

echo "Marcando imagem para o ACR..."
docker tag "medinventory:latest" "$ACR_LOGIN_SERVER/medinventory:latest"

echo "Fazendo login no ACR..."
echo "$ACR_PASSWORD" | docker login "$ACR_LOGIN_SERVER" -u "$ACR_USERNAME" --password-stdin

echo "Enviando imagem para o ACR..."
docker push "$ACR_LOGIN_SERVER/medinventory:latest"

echo "Reiniciando App Service..."
az webapp restart --name "medinventory-app-$ENVIRONMENT" --resource-group "medinventory-rg"

# Aguardar alguns segundos para a aplicação inicializar
echo "Aguardando aplicação inicializar..."
sleep 30

echo "Verificando status da aplicação..."
if curl -f -s "$APP_SERVICE_URL/health" > /dev/null 2>&1; then
    echo "Aplicação está funcionando!"
    echo "URL: $APP_SERVICE_URL"
else
    echo "Aplicação pode estar inicializando ainda. Verifique os logs:"
    echo "   az webapp log tail --name medinventory-app-$ENVIRONMENT --resource-group medinventory-rg"
fi

echo ""
echo "Informações úteis:"
echo "- URL da aplicação: $APP_SERVICE_URL"
echo "- Swagger/OpenAPI: $APP_SERVICE_URL/api"
echo "- Logs da aplicação: az webapp log tail --name medinventory-app-$ENVIRONMENT --resource-group medinventory-rg"
echo ""
echo "Deploy concluído!"