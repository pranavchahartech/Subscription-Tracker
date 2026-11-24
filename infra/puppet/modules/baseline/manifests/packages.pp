# Enforces required baseline OS and monitoring packages on app-host.

class baseline::packages {
  $required_packages = [
    'curl',
    'ca-certificates',
    'gnupg',
    'jq',
    'nagios-nrpe-server',
    'monitoring-plugins',
  ]

  package { $required_packages:
    ensure => installed,
  }
}
