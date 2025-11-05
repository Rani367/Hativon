#!/bin/bash

# Local PostgreSQL Setup Script for Arch Linux
# This script sets up PostgreSQL for local development

set -e

echo "🚀 Setting up PostgreSQL for local development..."
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    sudo pacman -S postgresql --noconfirm
else
    echo "✓ PostgreSQL is already installed"
fi

# Initialize PostgreSQL data directory if not exists
if [ ! -d "/var/lib/postgres/data" ]; then
    echo "📁 Initializing PostgreSQL data directory..."
    sudo -u postgres initdb -D /var/lib/postgres/data
else
    echo "✓ PostgreSQL data directory already exists"
fi

# Start PostgreSQL service
echo "🔄 Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Wait for PostgreSQL to be ready
sleep 2

# Create database user and database
echo "👤 Creating database user and database..."
sudo -u postgres psql -c "CREATE USER handesaim WITH PASSWORD 'handesaim123';" 2>/dev/null || echo "✓ User already exists"
sudo -u postgres psql -c "CREATE DATABASE handesaim_blog OWNER handesaim;" 2>/dev/null || echo "✓ Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE handesaim_blog TO handesaim;" 2>/dev/null || true

echo ""
echo "✅ PostgreSQL setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. The following has been added to your .env.local:"
echo "      POSTGRES_URL=postgresql://handesaim:handesaim123@localhost:5432/handesaim_blog"
echo ""
echo "   2. Run: npm run db:init"
echo "   3. Run: npm run create-admin"
echo "   4. Run: npm run dev"
echo ""

# Add database URL to .env.local if not already there
if ! grep -q "POSTGRES_URL=" .env.local 2>/dev/null; then
    echo "" >> .env.local
    echo "# Local PostgreSQL Database" >> .env.local
    echo "POSTGRES_URL=postgresql://handesaim:handesaim123@localhost:5432/handesaim_blog" >> .env.local
    echo "✓ Added POSTGRES_URL to .env.local"
else
    echo "ℹ️  POSTGRES_URL already in .env.local (not modified)"
fi

echo ""
echo "🎉 Setup complete! You can now run: npm run db:init"
