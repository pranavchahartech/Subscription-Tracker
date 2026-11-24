# SubSpace DevOps Deployment & Operations Runbook (INT333)

This runbook walks step by step from a fresh **Ubuntu 24.04 EC2 control node** in AWS **`ap-southeast-2` (Sydney)** to a fully deployed, Puppet-enforced, and Nagios-monitored SubSpace environment—including live demo steps for **Nagios alerting**, **Puppet drift correction**, and **clean teardown**.

---

## 1. Architecture Summary

| Host | Instance Type | Disk | Role | Exposed Ports (Restricted by SG) |
| :--- | :--- | :--- | :--- | :--- |
| **Control Node** *(manual)* | Ubuntu 24.04 | — | Runs AWS CLI, Terraform, Ansible | Outbound SSH to managed hosts |
| **`app-host`** *(Terraform)* | `t3.small` | 20 GB `gp3` | Docker + SubSpace containers (`postgres:15`, `backend`, `frontend` nginx) + Puppet Agent + NRPE | `22` (control node `/32`), `80` (your IP `/32` + `ops-host` SG), `5666` (`ops-host` SG) |
| **`ops-host`** *(Terraform)* | `t3.medium` | 20 GB `gp3` | Puppet 8 Server + Nagios Core 4 + Apache2 Web UI | `22` (control node `/32`), `80` (your IP `/32`), `8140` (`app-host` SG) |

> **Security Notes**
> - No `0.0.0.0/0` ingress rules exist on SSH or application ports.
> - PostgreSQL port `5432` is **never published** outside the internal Docker Compose network on `app-host`.
> - No AWS access keys or secrets are stored in Git.

---

## 2. Control Node Prerequisites (Fresh Ubuntu 24.04 EC2)

SSH into your manually created control node and install the required tools:

```bash
sudo apt-get update
sudo apt-get install -y git curl unzip gnupg software-properties-common python3-pip awscli

# 1. Install Terraform (official HashiCorp apt repo)
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install -y terraform

# 2. Install Ansible & ansible-lint
sudo apt-get install -y ansible ansible-lint

# 3. Configure AWS CLI credentials (choose region: ap-southeast-2)
aws configure
aws sts get-caller-identity

# 4. Generate an SSH key pair for Terraform EC2 instances
ssh-keygen -t ed25519 -f ~/.ssh/devops-key -N ""

# 5. Clone the repository
git clone https://github.com/pranavchahartech/Subscription-Tracker.git
cd Subscription-Tracker
```

---

## 3. Provision Infrastructure with Terraform

1. Find your control node's public IP and your workstation/laptop's public IP:

   ```bash
   # On the control node:
   curl -s https://checkip.amazonaws.com
   ```

2. Create `infra/terraform/terraform.tfvars` from the example template:

   ```bash
   cd infra/terraform
   cp terraform.tfvars.example terraform.tfvars
   nano terraform.tfvars
   ```

   Set your real `/32` CIDR ranges (never `0.0.0.0/0`):

   ```hcl
   aws_region          = "ap-southeast-2"
   project_name        = "SubSpace"
   ssh_public_key_path = "~/.ssh/devops-key.pub"
   admin_cidr          = "<CONTROL_NODE_PUBLIC_IP>/32"
   my_ip_cidr          = "<YOUR_LAPTOP_PUBLIC_IP>/32"
   ```

3. Validate, preview, and apply:

   ```bash
   terraform fmt -check -recursive
   terraform init
   terraform validate
   terraform plan
   terraform apply
   ```

4. Confirm the outputs and verify that Terraform generated `infra/ansible/inventory.ini`:

   ```bash
   terraform output
   cat ../ansible/inventory.ini
   ```

---

## 4. Configure Secrets & Bootstrap with Ansible

1. Create and encrypt the Ansible Vault file for application and Nagios secrets:

   ```bash
   cd ../ansible
   cp group_vars/all/vault.yml.example group_vars/all/vault.yml
   nano group_vars/all/vault.yml
   # Fill in strong passwords and 32+ character JWT secrets, then encrypt:
   ansible-vault encrypt group_vars/all/vault.yml
   ```

2. Wait ~30 seconds for EC2 SSH readiness, then verify Ansible connectivity:

   ```bash
   ansible all -m ping
   ```

3. Run the master playbook (bootstraps `common`, `puppet_server`, `nagios`, `docker`, `app`, `puppet_agent`, and `nrpe`):

   ```bash
   ansible-playbook site.yml --ask-vault-pass
   ```

   > **Tip**: Re-running `ansible-playbook site.yml --ask-vault-pass` should complete cleanly with `failed=0` and minimal/zero changes (idempotency check).

---

## 5. Verify the Application and Nagios Dashboard

Read your host public IPs from Terraform outputs:

```bash
cd ../terraform && terraform output
```

1. **SubSpace Web Application** (open from your workstation IP matching `my_ip_cidr`):
   - Frontend UI: `http://<app_host_public_ip>/`
   - Backend Health Check (proxied through Nginx): `http://<app_host_public_ip>/health`
   - Demo credentials (auto-seeded on first PostgreSQL boot): `demo@subspace.com` / `password123` (or register a new account to confirm PostgreSQL persistence and HTTP cookie login).

2. **Nagios Core Monitoring UI**:
   - URL: `http://<ops_host_public_ip>/nagios4`
   - Username: `nagiosadmin`
   - Password: value of `vault_nagios_admin_password` from `vault.yml`
   - Open **Hosts** (`app-host`, `ops-host`) and **Services** to confirm all checks turn **OK (green)**:
     - `HTTP Frontend (Port 80)`
     - `Backend Health (/health)`
     - `PostgreSQL Container (NRPE)`
     - `Docker Service (NRPE)`
     - `CPU Load (NRPE)`
     - `Root Disk Usage (NRPE)`
     - `Memory Usage (NRPE)`

---

## 6. Live Demo Scenarios (INT333 Presentation)

### Demo A: Triggering and Recovering a Nagios Alert

1. From the control node, SSH into `app-host`:

   ```bash
   ssh -i ~/.ssh/devops-key ubuntu@<app_host_public_ip>
   ```

2. Stop only the backend container so `/health` returns `502 Bad Gateway` while Nginx stays up:

   ```bash
   docker stop subspace-backend
   ```

3. Open the Nagios UI (`http://<ops_host_public_ip>/nagios4`) -> **Services** -> click `Backend Health (/health)` -> **Re-schedule the next check of this service** (or wait 1–3 minutes).
   - Status transitions to **CRITICAL** (`HTTP/1.1 502 Bad Gateway`).

4. Recover the service on `app-host`:

   ```bash
   docker start subspace-backend
   ```

   Re-schedule the check in Nagios UI and confirm the status returns to **OK** (`HTTP OK: HTTP/1.1 200 OK`).

---

### Demo B: Puppet Configuration Drift Correction

1. *(Optional)* Verify `app-host` certificate is signed on `ops-host`:

   ```bash
   ssh -i ~/.ssh/devops-key ubuntu@<ops_host_public_ip> \
     "sudo /opt/puppetlabs/bin/puppetserver ca list --all"
   ```

2. SSH into `app-host` and intentionally introduce drift (stop the Docker daemon and alter `.env` permissions):

   ```bash
   ssh -i ~/.ssh/devops-key ubuntu@<app_host_public_ip>
   sudo systemctl stop docker
   sudo chmod 0644 /opt/subspace/.env
   sudo systemctl status docker --no-pager
   ```

3. Run the Puppet agent to trigger immediate drift remediation (normally runs automatically every 30 minutes):

   ```bash
   sudo /opt/puppetlabs/bin/puppet agent --test
   ```

4. Observe Puppet's output showing both drift corrections:
   - `Service[docker]/ensure: ensure changed 'stopped' to 'running'`
   - `File[/opt/subspace/.env]/mode: mode changed '0644' to '0600'`

5. Verify Docker and SubSpace containers are back online:

   ```bash
   sudo systemctl status docker --no-pager
   docker ps
   ```

---

## 7. Teardown (`terraform destroy`)

When you finish your demo, destroy all Terraform-managed resources from the control node:

```bash
cd ~/Subscription-Tracker/infra/terraform
terraform destroy
```

Type `yes` when prompted. Terraform terminates both `app-host` and `ops-host`, deletes their 20 GB `gp3` root volumes, deletes both security groups and the EC2 key pair, and removes `infra/ansible/inventory.ini`.

---

## 8. Cost-Control Checklist

Run through these checks immediately after `terraform destroy` to avoid surprise AWS charges:

- [ ] **Verify EC2 instances are terminated** in `ap-southeast-2`:
  ```bash
  aws ec2 describe-instances --region ap-southeast-2 \
    --filters "Name=instance-state-name,Values=running,pending,stopping,stopped" \
    --query "Reservations[].Instances[].[InstanceId,InstanceType,State.Name,Tags[?Key=='Name'].Value|[0]]" \
    --output table
  ```
- [ ] **Check for unattached EBS volumes** (should be empty):
  ```bash
  aws ec2 describe-volumes --region ap-southeast-2 \
    --filters "Name=status,Values=available" \
    --query "Volumes[].[VolumeId,Size,VolumeType]" --output table
  ```
- [ ] **Check for Elastic IPs** (none are created by this setup, confirm 0 unassociated EIPs):
  ```bash
  aws ec2 describe-addresses --region ap-southeast-2 --output table
  ```
- [ ] **Stop or terminate your manual control node** in the AWS EC2 console once you no longer need it (`t3.small`/`t3.medium` and the control node all accrue hourly charges while running).
- [ ] **Set an AWS Billing Budget alert** (e.g., \$5–\$10 threshold in AWS Billing & Cost Management) before leaving any demo running.
