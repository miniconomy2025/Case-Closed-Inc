locals {
  common_tags = {
    environment = "prod"
    project     = "case-supplier-api"
    owner       = "AWS-Group-3"
    created_by  = "terraform"
    managed_by  = "GitHub Actions"
  }
}

#  Frontend CNAME
# resource "azurerm_dns_cname_record" "case_supplier_frontend" {
#   name                = "case-supplier"
#   record              = "d2hhphmbxli2xz.cloudfront.net"
   
#   zone_name           = data.azurerm_dns_zone.grad_projects_dns_zone.name
#   resource_group_name = "the-hive"
#   ttl                 = 3600
#   tags                = local.common_tags
# }

# # SSL validation for frontend domain
# resource "azurerm_dns_cname_record" "screen_supplier_ssl_validation_frontend" {
#   name                = "_23d0ed02702a858864eb0827b5d4c6ca.case-supplier.projects.bbdgrad.com"
#   record              = "_39149715957dec17af46873a1c200e72.xlfgrmvvlj.acm-validations.aws."
   
#   zone_name           = data.azurerm_dns_zone.grad_projects_dns_zone.name
#   resource_group_name = "the-hive"
#   ttl                 = 300
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
