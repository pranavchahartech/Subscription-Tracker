#!/usr/bin/env bash
# Nagios NRPE plugin: checks PostgreSQL inside the subspace-postgres container (no public port 5432).
set -euo pipefail

if ! docker inspect -f '{{.State.Running}}' subspace-postgres 2>/dev/null | grep -q '^true$'; then
  echo "CRITICAL - subspace-postgres container is not running"
  exit 2
fi

if OUTPUT=$(docker exec subspace-postgres pg_isready -h 127.0.0.1 -p 5432 2>&1); then
  echo "OK - PostgreSQL container healthy (${OUTPUT})"
  exit 0
else
  echo "CRITICAL - PostgreSQL readiness check failed (${OUTPUT})"
  exit 2
fi
