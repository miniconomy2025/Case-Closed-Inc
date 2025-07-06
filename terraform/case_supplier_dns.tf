locals {
  common_tags = {
    environment = "prod"
    project     = "case-supplier-api"
    owner       = "AWS-Group-3"
    created_by  = "terraform"
    managed_by  = "GitHub Actions"
  }
}

resource "azurerm_dns_cname_record" "case_supplier_web" {
  name                = "case-supplier"
  record              = "cloudfront-distribution.cloudfront.net"  # TODO: replace with cloudfront url
  zone_name           = data.azurerm_dns_zone.grad_projects_dns_zone.name
  resource_group_name = "the-hive"
  ttl                 = 3600
  tags                = local.common_tags
}

resource "azurerm_dns_cname_record" "case_supplier_api" {
  name                = "case-supplier-api"
  record              = "ec2-elastic-ip"  # TODO: replace with ec2 ip
  zone_name           = data.azurerm_dns_zone.grad_projects_dns_zone.name
  resource_group_name = "the-hive"
  ttl                 = 3600
  tags                = local.common_tags
}
