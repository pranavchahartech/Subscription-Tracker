# Terraform and provider version constraints for SubSpace AWS infrastructure

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    # AWS provider for EC2 instances, key pair, and security groups
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    # Local provider to generate the Ansible inventory.ini file from EC2 outputs
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}
