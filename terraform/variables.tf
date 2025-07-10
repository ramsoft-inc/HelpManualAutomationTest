variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for the resource group"
  type        = string
}

variable "storage_accounts" {
  description = "Map of storage accounts with names and tags"
  type = map(object({
    name   = string
  }))
}
