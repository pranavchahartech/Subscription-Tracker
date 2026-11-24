# Main Terraform configuration for SubSpace DevOps infrastructure (ap-southeast-2)
# Creates two Ubuntu 24.04 EC2 instances (app-host and ops-host) in the default VPC,
# restrictive security groups, an SSH key pair, and the Ansible inventory file.

provider "aws" {
  region = var.aws_region

  # Tag every AWS resource consistently for easy tracking and cleanup
  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "Terraform"
    }
  }
}

# Look up the account's default VPC in ap-southeast-2
data "aws_vpc" "default" {
  default = true
}

# Find the latest official Canonical Ubuntu 24.04 LTS (Noble Numbat) amd64 gp3 AMI
data "aws_ami" "ubuntu_24_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical official AWS account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# Upload the control node's SSH public key to AWS EC2
resource "aws_key_pair" "devops" {
  key_name   = "subspace-devops-key"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

# ── Security Groups ──────────────────────────────────────────────────────────
# Note: Ingress and egress rules are defined as separate resources so app-host
# and ops-host security groups can reference each other without cycle errors.

resource "aws_security_group" "app_host" {
  name        = "subspace-app-host-sg"
  description = "Security group for SubSpace app-host (SSH from control node, HTTP from user, NRPE from ops-host)"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name = "subspace-app-host-sg"
  }
}

resource "aws_security_group" "ops_host" {
  name        = "subspace-ops-host-sg"
  description = "Security group for SubSpace ops-host (SSH from control node, Nagios UI from user, Puppet from app-host)"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name = "subspace-ops-host-sg"
  }
}

# ── app-host Security Group Rules ────────────────────────────────────────────

resource "aws_vpc_security_group_ingress_rule" "app_ssh" {
  security_group_id = aws_security_group.app_host.id
  description       = "Allow SSH from control node only"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.admin_cidr
}

resource "aws_vpc_security_group_ingress_rule" "app_http" {
  security_group_id = aws_security_group.app_host.id
  description       = "Allow HTTP (port 80) to SubSpace frontend from allowed user IP"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = var.my_ip_cidr
}

resource "aws_vpc_security_group_ingress_rule" "app_http_from_ops" {
  security_group_id            = aws_security_group.app_host.id
  description                  = "Allow Nagios on ops-host to run check_http against app-host port 80"
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  referenced_security_group_id = aws_security_group.ops_host.id
}

resource "aws_vpc_security_group_ingress_rule" "app_nrpe" {
  security_group_id            = aws_security_group.app_host.id
  description                  = "Allow NRPE checks (port 5666) from ops-host only"
  ip_protocol                  = "tcp"
  from_port                    = 5666
  to_port                      = 5666
  referenced_security_group_id = aws_security_group.ops_host.id
}

resource "aws_vpc_security_group_egress_rule" "app_egress_all" {
  security_group_id = aws_security_group.app_host.id
  description       = "Allow all outbound traffic (apt, GHCR image pulls, Puppet agent -> ops-host)"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# ── ops-host Security Group Rules ────────────────────────────────────────────

resource "aws_vpc_security_group_ingress_rule" "ops_ssh" {
  security_group_id = aws_security_group.ops_host.id
  description       = "Allow SSH from control node only"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.admin_cidr
}

resource "aws_vpc_security_group_ingress_rule" "ops_nagios_http" {
  security_group_id = aws_security_group.ops_host.id
  description       = "Allow Nagios Core web UI (port 80) from allowed user IP"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = var.my_ip_cidr
}

resource "aws_vpc_security_group_ingress_rule" "ops_puppet" {
  security_group_id            = aws_security_group.ops_host.id
  description                  = "Allow Puppet Server communication (port 8140) from app-host only"
  ip_protocol                  = "tcp"
  from_port                    = 8140
  to_port                      = 8140
  referenced_security_group_id = aws_security_group.app_host.id
}

resource "aws_vpc_security_group_egress_rule" "ops_egress_all" {
  security_group_id = aws_security_group.ops_host.id
  description       = "Allow all outbound traffic (apt, Puppet packages, NRPE checks -> app-host)"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# ── EC2 Instances ────────────────────────────────────────────────────────────

# Application host: Docker, SubSpace containers, Puppet agent, and NRPE agent
resource "aws_instance" "app_host" {
  ami                         = data.aws_ami.ubuntu_24_04.id
  instance_type               = var.app_instance_type
  key_name                    = aws_key_pair.devops.key_name
  vpc_security_group_ids      = [aws_security_group.app_host.id]
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name    = "subspace-app-host"
    Role    = "app-host"
    Project = var.project_name
  }
}

# Operations host: Puppet Server and Nagios Core monitoring server
resource "aws_instance" "ops_host" {
  ami                         = data.aws_ami.ubuntu_24_04.id
  instance_type               = var.ops_instance_type
  key_name                    = aws_key_pair.devops.key_name
  vpc_security_group_ids      = [aws_security_group.ops_host.id]
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name    = "subspace-ops-host"
    Role    = "ops-host"
    Project = var.project_name
  }
}

# ── Ansible Inventory Generation ─────────────────────────────────────────────

# Automatically write infra/ansible/inventory.ini using the newly created IPs
resource "local_file" "ansible_inventory" {
  filename        = "${path.module}/../ansible/inventory.ini"
  file_permission = "0644"

  content = <<-EOT
    # Auto-generated by Terraform — do not edit manually.
    # Re-run `terraform apply` to refresh IP addresses.

    [app_host]
    app-host ansible_host=${aws_instance.app_host.public_ip} private_ip=${aws_instance.app_host.private_ip}

    [ops_host]
    ops-host ansible_host=${aws_instance.ops_host.public_ip} private_ip=${aws_instance.ops_host.private_ip}

    [all:vars]
    ansible_user=ubuntu
    ansible_ssh_private_key_file=${replace(var.ssh_public_key_path, ".pub", "")}
    ansible_python_interpreter=/usr/bin/python3
  EOT
}
