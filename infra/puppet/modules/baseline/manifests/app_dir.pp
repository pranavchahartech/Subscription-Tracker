# Enforces ownership and permissions on the SubSpace application directory and files.
# Does not manage file contents so secrets in .env stay controlled by Ansible Vault.

class baseline::app_dir {
  file { '/opt/subspace':
    ensure => directory,
    owner  => 'ubuntu',
    group  => 'ubuntu',
    mode   => '0755',
  }

  file { '/opt/subspace/docker-compose.prod.yml':
    ensure  => file,
    owner   => 'ubuntu',
    group   => 'ubuntu',
    mode    => '0644',
    require => File['/opt/subspace'],
  }

  file { '/opt/subspace/.env':
    ensure  => file,
    owner   => 'ubuntu',
    group   => 'ubuntu',
    mode    => '0600',
    require => File['/opt/subspace'],
  }
}
