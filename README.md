# Afterstill - Aesthetic Literary Showcase ✨

> A mind-blowing, aesthetic literacy platform with intelligent discovery and immersive reading experiences.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🌟 Features

### Core Features
- **🎨 Beautiful UI/UX**: Stunning dark mode design with fluid animations
- **📚 Writing Management**: Complete CMS for managing literary content
- **🤖 AI-Powered**: Smart content analysis, recommendations, and insights
- **🔍 Intelligent Discovery**: Semantic search and mood-based filtering
- **📊 Advanced Analytics**: Real-time visitor tracking and engagement metrics
- **🎯 Reading Experience**: Immersive reading mode with companion features
- **🗺️ Atlas View**: Interactive semantic graph visualization
- **🎭 Archive Map**: Beautiful spatial navigation of content
- **💬 Collaborative Reflections**: Peer-to-peer reading discussions

### Technical Features
- **⚡ Performance Optimized**: Advanced caching, code splitting, lazy loading
- **🔒 Security Hardened**: Input validation, XSS protection, rate limiting
- **📱 PWA Ready**: Offline support, installable, push notifications
- **♿ Accessible**: WCAG compliant, keyboard navigation, screen reader support
- **🌐 SEO Optimized**: Meta tags, structured data, sitemap generation
- **🎨 Genius Animations**: Magnetic cursors, liquid effects, parallax scrolling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- OpenAI API key (for AI features)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd afterstill

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
npm run db:push

# Seed initial data (optional)
npm run db:seed

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 📁 Project Structure

```
afterstill/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin dashboard
│   │   ├── reading/      # Reading pages
│   │   └── ...
│   ├── components/       # React components
│   ├── lib/              # Utility libraries
│   │   ├── ai-enhanced.ts      # AI utilities
│   │   ├── animations.ts       # Animation helpers
│   │   ├── cache.ts           # Caching system
│   │   ├── performance.ts     # Performance utils
│   │   ├── security.ts        # Security functions
│   │   └── ...
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── public/
│   ├── sw.js            # Service worker
│   └── manifest.json    # PWA manifest
└── ...
```

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run typecheck    # Check TypeScript types
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Create and run migrations
npm run db:seed      # Seed database
npm run analyze      # Analyze bundle size
npm run clean        # Clean build cache
```

## 🎨 Key Technologies

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js v5
- **AI**: OpenAI GPT-4 Turbo
- **Animations**: Framer Motion, Three.js
- **Real-time**: PeerJS for P2P
- **Email**: Resend
- **Type Safety**: TypeScript

## 🚢 Deployment

### Docker

```bash
# Build and run
docker-compose up -d
```

### Vercel

```bash
vercel deploy
```

## 📊 Performance & Security

- Multi-layer caching (memory + IndexedDB)
- Advanced bundle optimization
- Input validation & sanitization
- Rate limiting & CSRF protection
- Service worker with offline support

## 🎯 AI Features

- Content analysis & sentiment detection
- Smart recommendations & personalization
- Semantic search with vector embeddings
- Auto-tagging & quality scoring
- Mood-based content filtering

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader optimized
- Focus management
- Reduced motion support

---

**Built with ❤️ using Next.js, React, and modern web technologies**
