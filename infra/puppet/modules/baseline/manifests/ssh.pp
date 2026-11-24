# Enforces SSH hardening on app-host without locking out key-based ubuntu access.
# Uses 01-subspace-hardening.conf so settings apply before cloud-init drop-ins.

class baseline::ssh {
  file { '/etc/ssh/sshd_config.d/01-subspace-hardening.conf':
    ensure       => file,
    owner        => 'root',
    group        => 'root',
    mode         => '0644',
    validate_cmd => '/usr/sbin/sshd -t -f %',
    content      => @(EOF),
      # Managed by Puppet (baseline::ssh)
      PermitRootLogin no
      PasswordAuthentication no
      KbdInteractiveAuthentication no
      PubkeyAuthentication yes
      | EOF
  }

  service { 'ssh':
    ensure    => running,
    enable    => true,
    subscribe => File['/etc/ssh/sshd_config.d/01-subspace-hardening.conf'],
  }
}
