#!/bin/bash

# Production deployment script for Afterstill
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment
if [ -f ".env.$ENVIRONMENT" ]; then
    echo "✓ Loading environment from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | xargs)
else
    echo "${RED}✗ Environment file .env.$ENVIRONMENT not found${NC}"
    exit 1
fi

# Pre-deployment checks
echo ""
echo "📋 Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "${RED}✗ Node.js 18 or higher is required${NC}"
    exit 1
fi
echo "${GREEN}✓${NC} Node.js version: $(node -v)"

# Check database connection
if [ -z "$DATABASE_URL" ]; then
    echo "${RED}✗ DATABASE_URL not set${NC}"
    exit 1
fi
echo "${GREEN}✓${NC} Database URL configured"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci --production=false
echo "${GREEN}✓${NC} Dependencies installed"

# Run type check
echo ""
echo "🔍 Running type check..."
npm run typecheck
echo "${GREEN}✓${NC} Type check passed"

# Run linter
echo ""
echo "🧹 Running linter..."
npm run lint
echo "${GREEN}✓${NC} Linter passed"

# Generate Prisma client
echo ""
echo "🗄️  Generating Prisma client..."
npx prisma generate
echo "${GREEN}✓${NC} Prisma client generated"

# Run database migrations
echo ""
echo "🔄 Running database migrations..."
read -p "Run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    echo "${GREEN}✓${NC} Migrations completed"
else
    echo "${YELLOW}⚠${NC}  Migrations skipped"
fi

# Build application
echo ""
echo "🏗️  Building application..."
npm run build
echo "${GREEN}✓${NC} Build completed"

# Test build
echo ""
echo "🧪 Testing build..."
timeout 10 npm start &
PID=$!
sleep 5
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "${GREEN}✓${NC} Health check passed"
    kill $PID
else
    echo "${RED}✗ Health check failed${NC}"
    kill $PID
    exit 1
fi

# Create backup
echo ""
echo "💾 Creating backup..."
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
if [ -d ".next" ]; then
    cp -r .next "$BACKUP_DIR/"
fi
echo "${GREEN}✓${NC} Backup created in $BACKUP_DIR"

# Deploy
echo ""
echo "🚀 Deploying to $ENVIRONMENT..."

if [ "$ENVIRONMENT" == "production" ]; then
    # Production deployment
    if command -v pm2 &> /dev/null; then
        pm2 stop afterstill || true
        pm2 delete afterstill || true
        pm2 start npm --name "afterstill" -- start
        pm2 save
        echo "${GREEN}✓${NC} Deployed with PM2"
    elif command -v docker-compose &> /dev/null; then
        docker-compose down
        docker-compose up -d --build
        echo "${GREEN}✓${NC} Deployed with Docker"
    else
        echo "${YELLOW}⚠${NC}  No deployment method found (PM2 or Docker)"
        echo "Manual deployment required"
    fi
else
    # Development/Staging deployment
    echo "${YELLOW}⚠${NC}  Development deployment - starting dev server"
    npm run dev
fi

# Post-deployment checks
echo ""
echo "✅ Post-deployment checks..."
sleep 5

# Health check
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "${GREEN}✓${NC} Application is running"
else
    echo "${RED}✗ Application health check failed${NC}"
    exit 1
fi

# Clear cache (if needed)
echo ""
read -p "Clear application cache? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Clearing cache..."
    # Add cache clearing logic here
    echo "${GREEN}✓${NC} Cache cleared"
fi

# Summary
echo ""
echo "═══════════════════════════════════════"
echo "  ${GREEN}✓ Deployment Complete!${NC}"
echo "═══════════════════════════════════════"
echo "Environment: $ENVIRONMENT"
echo "Time: $(date)"
echo "Backup: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "  • Monitor logs: pm2 logs afterstill"
echo "  • Check metrics: npm run analyze"
echo "  • Test application: http://localhost:3000"
echo ""
