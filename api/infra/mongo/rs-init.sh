#!/bin/bash
# Generate a replica set keyFile with correct ownership/permissions
openssl rand -base64 756 > /tmp/replica.key
chmod 400 /tmp/replica.key
chown mongodb:mongodb /tmp/replica.key

# Delegate to the official entrypoint with replica set flags
exec docker-entrypoint.sh mongod --replSet rs0 --keyFile /tmp/replica.key "$@"
