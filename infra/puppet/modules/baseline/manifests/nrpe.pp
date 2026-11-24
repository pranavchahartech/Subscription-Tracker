# Enforces NRPE configuration and service state on app-host.
# Uses the ops_host_private_ip custom fact written by Ansible in /etc/facter/facts.d/subspace.yaml.

class baseline::nrpe {
  require baseline::packages

  $ops_ip = $facts['ops_host_private_ip'] ? {
    undef   => '',
    default => String($facts['ops_host_private_ip']),
  }

  file { '/etc/nagios/nrpe.d':
    ensure => directory,
    owner  => 'root',
    group  => 'root',
    mode   => '0755',
  }

  file { '/etc/nagios/nrpe.cfg':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => epp('baseline/nrpe.cfg.epp', {
      'ops_host_private_ip' => $ops_ip,
    }),
  }

  service { 'nagios-nrpe-server':
    ensure    => running,
    enable    => true,
    subscribe => File['/etc/nagios/nrpe.cfg'],
  }
}
