# Afterstill Deployment Guide

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

**Pros:** Easiest setup, auto-scaling, free tier available, CDN included

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/afterstill.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   AUTH_SECRET=<generate: openssl rand -base64 32>
   ADMIN_EMAIL=your-admin@email.com
   ADMIN_PASSWORD=your-secure-password
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

4. **Database Options**
   - [Vercel Postgres](https://vercel.com/storage/postgres) - Integrated
   - [Supabase](https://supabase.com) - Free tier, generous limits
   - [Neon](https://neon.tech) - Serverless Postgres, free tier
   - [PlanetScale](https://planetscale.com) - MySQL (change Prisma provider)

5. **Run Migrations**
   After first deploy, run in your local terminal:
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

---

### Option 2: Railway

**Pros:** Simple, includes PostgreSQL, generous free tier

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add PostgreSQL service
4. Railway auto-configures DATABASE_URL
5. Add other environment variables manually

---

### Option 3: Docker (Self-Hosted VPS)

**Pros:** Full control, any cloud provider (DigitalOcean, AWS, GCP, etc.)

1. **Prerequisites on VPS**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com | sh
   
   # Install Docker Compose
   sudo apt install docker-compose-plugin
   ```

2. **Clone and Deploy**
   ```bash
   git clone https://github.com/username/afterstill.git
   cd afterstill
   
   # Create environment file
   cp .env.example .env
   nano .env  # Edit with your values
   
   # Start services
   docker compose up -d
   
   # Run migrations
   docker compose exec app npx prisma migrate deploy
   ```

3. **Setup Nginx Reverse Proxy (Optional)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 📋 Pre-Deployment Checklist

### Required Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | NextAuth secret key (32+ chars) | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Admin login email | `admin@site.com` |
| `ADMIN_PASSWORD` | Admin login password | `secure-password-123` |
| `NEXTAUTH_URL` | Production URL | `https://yourdomain.com` |

### Build Commands
```bash
# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Run migrations (production)
npx prisma migrate deploy

# Build Next.js
npm run build

# Start production server
npm start
```

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Check if migrations are applied
npx prisma migrate status
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

### Auth Issues
- Ensure `AUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Check that `trustHost: true` is in auth config

---

## 📊 Monitoring & Maintenance

### View Logs (Docker)
```bash
docker compose logs -f app
```

### Database Backup
```bash
docker compose exec db pg_dump -U afterstill afterstill > backup.sql
```

### Update Application
```bash
git pull
docker compose build
docker compose up -d
docker compose exec app npx prisma migrate deploy
```
