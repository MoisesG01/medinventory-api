#!/bin/bash

# Script para destruir a infraestrutura do MedInventory
# Uso: ./destroy.sh [environment]

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR"

echo "Destruindo infraestrutura do MedInventory para o ambiente: $ENVIRONMENT"

# Verificar se o Terraform está instalado
if ! command -v terraform &> /dev/null; then
    echo "Terraform nao esta instalado."
    exit 1
fi

# Verificar se a infraestrutura existe
cd "$TERRAFORM_DIR"
if [ ! -f "terraform.tfstate" ]; then
    echo "Infraestrutura nao encontrada. Nada para destruir."
    exit 0
fi

# Verificar se está logado no Azure
if ! az account show &> /dev/null; then
    echo "Fazendo login no Azure..."
    az login
fi

echo "ATENCAO: Esta acao ira destruir TODOS os recursos da infraestrutura!"
echo "   - Banco de dados MySQL (todos os dados serao perdidos)"
echo "   - Container Registry (todas as imagens serao perdidas)"
echo "   - App Service"
echo "   - Resource Group completo"
echo ""
echo "Tem certeza que deseja continuar? Digite 'sim' para confirmar:"
read -r response

if [[ "$response" != "sim" ]]; then
    echo "Operacao cancelada."
    exit 0
fi

echo "Criando plano de destruicao..."
terraform plan -destroy -var="environment=$ENVIRONMENT" -out="destroy.tfplan"

echo "Destruindo infraestrutura..."
terraform apply "destroy.tfplan"

echo "Limpando arquivos temporarios..."
rm -f destroy.tfplan
rm -f terraform.tfstate*
rm -rf .terraform/

echo "Infraestrutura destruida com sucesso!"
echo ""
echo "Recursos removidos:"
echo "   - Resource Group: medinventory-rg"
echo "   - MySQL Server e Database"
echo "   - Container Registry"
echo "   - App Service e Service Plan"
echo "   - Storage Account"
echo ""
echo "Processo de destruicao concluido!"