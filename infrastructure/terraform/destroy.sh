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

# Verificar se está logado no Azure
if ! az account show &> /dev/null; then
    echo "Fazendo login no Azure..."
    az login
fi

cd "$TERRAFORM_DIR"

echo "Inicializando Terraform (backend remoto no Azure)..."
terraform init

echo "ATENCAO: Esta acao ira destruir os recursos gerenciados pelo Terraform neste state!"
echo "   - Banco de dados MySQL (todos os dados serao perdidos)"
echo "   - Container Registry (todas as imagens serao perdidas)"
echo "   - App Service"
echo "   - Storage de exportacao CSV (se existir no state)"
echo ""
echo "NAO sera destruido:"
echo "   - Storage Account do backend do Terraform: medinventorystorage (container tfstate)"
echo "   - Resource Group existente (o RG e referenciado como data source)"
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

# Observacao: como usamos backend remoto (azurerm), o state e atualizado no blob do Azure.
# Podemos limpar apenas caches locais do Terraform com seguranca.
rm -rf .terraform/ .terraform.lock.hcl 2>/dev/null || true

echo "Infraestrutura destruida com sucesso!"
echo ""
echo "Recursos removidos:"
echo "   - MySQL Server e Database (gerenciados pelo Terraform)"
echo "   - Container Registry (gerenciado pelo Terraform)"
echo "   - App Service e Service Plan (gerenciados pelo Terraform)"
echo "   - Storage de exportacao CSV (se estava no state)"
echo ""
echo "Processo de destruicao concluido!"