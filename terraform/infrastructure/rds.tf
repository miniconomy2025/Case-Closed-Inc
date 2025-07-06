data "aws_ssm_parameter" "db_username" {
  name = var.db_username
}

data "aws_ssm_parameter" "db_password" {
  name = var.db_password
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "case_supplier_db" {
  identifier             = "case-supplier-db"
  engine                 = "postgres"
  engine_version         = "16.8"
  instance_class         = "db.t4g.micro"
  db_name                = "casesupplierdb"
  allocated_storage      = 20
  storage_type           = "gp2"
  publicly_accessible    = true
  username               = data.aws_ssm_parameter.db_username.value
  password               = data.aws_ssm_parameter.db_password.value
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
}

output "db_host" {
  value       = aws_db_instance.case_supplier_db.endpoint
  description = "Postgres DB endpoint"
}