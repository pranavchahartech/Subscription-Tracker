# Enforces Docker Engine service state on app-host.
# Drift demo: if `systemctl stop docker` is run manually, the next Puppet run restarts it.

class baseline::docker {
  service { 'docker':
    ensure => running,
    enable => true,
  }
}
