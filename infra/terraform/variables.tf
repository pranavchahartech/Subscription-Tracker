# Input variables for SubSpace Terraform deployment

variable "aws_region" {
  description = "AWS region where all resources are deployed (fixed to Sydney per architecture)"
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project tag applied to all AWS resources"
  type        = string
  default     = "SubSpace"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key on the control node (uploaded as an EC2 key pair)"
  type        = string
  default     = "~/.ssh/devops-key.pub"
}

variable "admin_cidr" {
  description = "Control node public IP in CIDR notation (e.g. 203.0.113.10/32) allowed to SSH into both EC2 hosts"
  type        = string

  validation {
    condition     = var.admin_cidr != "0.0.0.0/0"
    error_message = "admin_cidr must not be 0.0.0.0/0. Restrict SSH to your control node IP/32."
  }
}

variable "my_ip_cidr" {
  description = "Your workstation public IP in CIDR notation (e.g. 203.0.113.20/32) allowed to access the app (port 80) and Nagios UI (port 80)"
  type        = string

  validation {
    condition     = var.my_ip_cidr != "0.0.0.0/0"
    error_message = "my_ip_cidr must not be 0.0.0.0/0. Restrict app and Nagios access to your IP/32."
  }
}

variable "app_instance_type" {
  description = "EC2 instance type for app-host (Docker + SubSpace containers + Puppet agent + NRPE)"
  type        = string
  default     = "t3.small"
}

variable "ops_instance_type" {
  description = "EC2 instance type for ops-host (Puppet Server + Nagios Core)"
  type        = string
  default     = "t3.medium"
}
