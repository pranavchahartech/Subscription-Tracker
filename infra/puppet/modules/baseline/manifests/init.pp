# Baseline Puppet module for SubSpace app-host.
# Enforces required packages, Docker daemon state, NRPE service/config,
# SSH hardening, and application directory permissions.

class baseline {
  include baseline::packages
  include baseline::docker
  include baseline::nrpe
  include baseline::ssh
  include baseline::app_dir
}
