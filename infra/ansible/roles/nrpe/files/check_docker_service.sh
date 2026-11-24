#!/usr/bin/env bash
# Nagios NRPE plugin: verifies the Docker systemd service is active on app-host.
set -euo pipefail

if systemctl is-active --quiet docker; then
  echo "OK - Docker service is active and running"
  exit 0
else
  echo "CRITICAL - Docker service is NOT running"
  exit 2
fi
