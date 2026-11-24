# Main Puppet site manifest for SubSpace infrastructure.
# Classifies app-host (and any default agent) with the baseline profile.

node 'app-host', default {
  include baseline
}
