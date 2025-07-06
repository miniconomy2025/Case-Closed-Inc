resource "aws_s3_bucket" "case_supplier_s3_bucket_instance" {
  bucket = "case-supplier-s3-cloudfront-distribution-bucket" # must be globally unique
  
  tags = {
    Name = "case_supplier_s3_bucket_instance"
  }
}

resource "aws_s3_bucket_website_configuration" "website_config" {
  bucket = aws_s3_bucket.case_supplier_s3_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = aws_s3_bucket.case_supplier_s3_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "bucket_acl" {
  depends_on = [aws_s3_bucket_public_access_block.public_access]
  bucket     = aws_s3_bucket.case_supplier_s3_bucket.id
  acl        = "public-read"
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.case_supplier_s3_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.case_supplier_s3_bucket.arn}/*"
      }
    ]
  })
}


output "s3_website_url" {
  value = aws_s3_bucket_website_configuration.website_config.website_endpoint
}