#!/bin/bash

# Script para criar a infraestrutura do MedInventory na Azure
# Uso: ./create.sh [environment]

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR"

echo "Criando infraestrutura do MedInventory para o ambiente: $ENVIRONMENT"

# Verificar se o Terraform está instalado
if ! command -v terraform &> /dev/null; then
    echo "Terraform nao esta instalado. Instale o Terraform primeiro."
    exit 1
fi

# Verificar se o Azure CLI está instalado
if ! command -v az &> /dev/null; then
    echo "Azure CLI nao esta instalado. Instale o Azure CLI primeiro."
    exit 1
fi

# Verificar se está logado no Azure
if ! az account show &> /dev/null; then
    echo "Fazendo login no Azure..."
    az login
fi

echo "Informacoes da conta Azure:"
az account show --query "{subscriptionId:id, tenantId:tenantId, name:name}" -o table

# Navegar para o diretório do Terraform
cd "$TERRAFORM_DIR"

# Inicializar o Terraform
echo "Inicializando Terraform..."
terraform init

# Validar a configuração
echo "Validando configuracao..."
terraform validate

# Planejar a implantação
echo "Criando plano de execução..."
terraform plan -var="environment=$ENVIRONMENT" -out="tfplan"

# Confirmar implantação
echo "Deseja aplicar as mudanças? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Aplicando mudanças..."
    terraform apply "tfplan"
    
    echo "Infraestrutura criada com sucesso!"
    echo ""
    echo "Informacoes importantes:"
    echo "- URL da aplicacao: $(terraform output -raw app_service_url)"
    echo "- Servidor MySQL: $(terraform output -raw mysql_server_fqdn)"
    echo "- Registry ACR: $(terraform output -raw container_registry_login_server)"
    echo ""
    echo "Para obter as credenciais sensiveis, execute:"
    echo "  terraform output -raw database_url"
    echo "  terraform output -raw container_registry_admin_password"
    echo ""
    echo "Para fazer deploy da aplicacao, execute:"
    echo "  ./deploy.sh $ENVIRONMENT"
else
    echo "Implantacao cancelada."
    rm -f tfplan
    exit 0
fi

rm -f tfplan
echo "Processo concluido!"