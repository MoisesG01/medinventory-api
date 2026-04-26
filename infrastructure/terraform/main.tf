terraform {
  backend "azurerm" {
    resource_group_name  = "medinventory-rg"
    storage_account_name = "medinventorystorage"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Use existing Resource Group (not managed by Terraform)
data "azurerm_resource_group" "main" {
  name = "${var.project_name}-rg"
}

# Use existing Storage Account (not managed by Terraform)
data "azurerm_storage_account" "main" {
  name                = "${replace(var.project_name, "-", "")}storage"
  resource_group_name = data.azurerm_resource_group.main.name
}

data "azurerm_client_config" "current" {}

# Random password for database
resource "random_password" "mysql_password" {
  length  = 16
  special = true
}