# locals {
#   common_tags = {
#     environment = "prod"
#     project     = "case-supplier-api"
#     owner       = "AWS-Group-3"
#     created_by  = "terraform"
#     managed_by  = "GitHub Actions"
#   }
# }

# # Frontend CNAME
# resource "azurerm_dns_cname_record" "case_supplier_frontend" {
#   name                = "case-supplier-frontend"
#   record              = "d2hhphmbxli2xz.cloudfront.net"
   
#   zone_name           = data.azurerm_dns_zone.grad_projects_dns_zone.name
#   resource_group_name = "the-hive"
#   ttl                 = 3600
#   tags                = local.common_tags
# }

# # API CNAME  
# resource "azurerm_dns_cname_record" "case_supplier_api" {
#   name                = "case-supplier-api"
#   record              = "ec2-13-246-82-211.af-south-1.compute.amazonaws.com"
   
#   zone_name           = data.azurerm_dns_zone.grad_projects_dns_zone.name
#   resource_group_name = "the-hive"
#   ttl                 = 3600
#   tags                = local.common_tags
# }

