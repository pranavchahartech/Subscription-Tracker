# Terraform outputs for SubSpace infrastructure

output "app_host_public_ip" {
  description = "Public IPv4 address of app-host (SubSpace web app on port 80)"
  value       = aws_instance.app_host.public_ip
}

output "app_host_private_ip" {
  description = "Private VPC IPv4 address of app-host (used by Nagios NRPE and Puppet)"
  value       = aws_instance.app_host.private_ip
}

output "ops_host_public_ip" {
  description = "Public IPv4 address of ops-host (Nagios web UI on http://<ip>/nagios)"
  value       = aws_instance.ops_host.public_ip
}

output "ops_host_private_ip" {
  description = "Private VPC IPv4 address of ops-host (used by Puppet agents on port 8140)"
  value       = aws_instance.ops_host.private_ip
}
