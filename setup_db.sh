#!/bin/bash
set -e

echo "🔧 Setting PostgreSQL password for user postgres..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '12345678!';"

echo "📦 Creating collab_workspace database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'collab_workspace'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE collab_workspace;"

echo "✅ PostgreSQL setup complete! Database 'collab_workspace' is ready with password '12345678!'."

