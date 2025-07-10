terraform {
  backend "azurerm" {
    resource_group_name="po-shared" 
    storage_account_name="tfstateposhared"
    container_name="helpmanualstaticwebsite" 
    key="staticwebsite.tfstate"                                                                                            
  }
  required_providers {
    
    azurerm={
              source  = "hashicorp/azurerm"
              version = "~>3.0"
    }
  }
}


provider "azurerm" {
  features{
  }
  subscription_id  = "6b953fbc-42c0-40da-b8f1-8c5a99beaf8d"
}

resource "azurerm_storage_account" "storage_accounts" {
  for_each = var.storage_accounts

  name                     = each.value.name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind = "StorageV2"

  lifecycle{
    ignore_changes=[
      allow_nested_items_to_be_public,
      tags
    ]
  }
}

resource "azurerm_storage_account_static_website" "static_webapps" {
  for_each           = azurerm_storage_account.storage_accounts
  storage_account_id = each.value.id
  error_404_document = "404.html"
  index_document     = "index.html"
}
