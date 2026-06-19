# Mathlers Platform

🥊 **AI-Powered Educational Mathematics Platform**

Transform mathematics learning into an exciting boxing-themed competition experience using real-world records from sports, esports, gaming, and science.

## 📁 Project Structure

```
mathlers/
├── backend/
│   └── app/
│       ├── api/              # API endpoints
│       ├── core/             # Core utilities (auth, config)
│       ├── models/           # Database models
│       ├── services/         # Business logic services
│       ├── utils/            # Helper functions
│       └── tests/            # Test suite
├── frontend/
│   └── src/
│       ├── components/       # React components
│       ├── pages/            # Page components
│       ├── services/         # API services
│       └── styles/           # CSS/Styling
├── config/
│   └── settings.yaml         # Platform configuration
└── docs/
    └── ARCHITECTURE.md       # Architecture documentation
```

## 🚀 Features

### Role-Based Access Control
- **Admin**: Full system access, user management, platform configuration
- **Moderator**: Content moderation, user warnings, temporary bans
- **Teacher**: Class management, student tracking, custom tests
- **Parent**: View child progress, manage account
- **Student**: Practice, compete, earn badges
- **Guest**: Public content, demo access

### Competition Modes
- **Practice Mode**: Solo practice with adaptive difficulty
- **Sparring**: Friendly 1v1 matches
- **Ranked Matches**: ELO-based competitive matchmaking
- **Tournaments**: Weekly/monthly championships

### Boxing Ring Theme
- **Warm-up Round**: 3 questions (1x multiplier)
- **Jab Round**: 5 questions (1.2x multiplier)
- **Hook Round**: 5 questions (1.5x multiplier)
- **Uppercut Round**: 4 questions (2x multiplier)
- **Knockout Round**: 3 questions (3x multiplier)

### Gamification
- Champion Belts (White → Yellow → Green → Blue → Red → Black → Champion)
- Achievement Badges
- Streak Bonuses
- ELO Rankings
- Leaderboards

## ⚙️ Configuration

All platform settings are customizable in `config/settings.yaml`:

- Role permissions and access levels
- Age groups and difficulty levels
- Competition rules and scoring
- Gamification elements
- Data source integrations
- AI model configuration
- Database and cache settings
- Security policies
- Subscription plans

## 🛠️ Tech Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: Flask/FastAPI
- **Database**: PostgreSQL
- **Cache**: Redis
- **Vector DB**: Pinecone (for RAG)
- **Authentication**: JWT + bcrypt

### Frontend
- **Web**: React.js
- **Mobile**: React Native
- **Styling**: TailwindCSS

### Infrastructure
- **Cloud**: AWS
- **Containers**: Docker + ECS
- **CDN**: CloudFront
- **Monitoring**: Datadog, Sentry

## 📋 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (optional)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
alembic upgrade head

# Start development server
python -m uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 📖 Documentation

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md) (coming soon)
- [Deployment Guide](docs/DEPLOYMENT.md) (coming soon)

## 🔐 Security

- JWT authentication with refresh tokens
- bcrypt password hashing (12 rounds)
- Role-based access control (RBAC)
- Rate limiting (60 req/min)
- CORS protection
- SQL injection prevention
- XSS protection
- DDoS mitigation via Cloudflare

## 📊 Sample Questions

The platform generates math questions from real-world records like:

- **Esports World Cup 2026**: $75M prize pool calculations
- **MLBB M7 Championship**: 5.6M peak viewer statistics
- **100m Sprint Records**: Speed/distance/time problems
- **Gaming Records**: Probability and percentage challenges

## 🎯 Roadmap

- [x] Core architecture design
- [x] Database schema
- [x] Authentication system
- [x] Question generation engine
- [ ] Competition system
- [ ] Tournament brackets
- [ ] Real-time WebSocket gameplay
- [ ] Teacher dashboard
- [ ] Mobile apps
- [ ] Beta launch

## 📝 License

Proprietary - All rights reserved

## 👥 Team

Built for Mathlers Organization - 10 years of transforming mathematics education through gamification.

---

**Version**: 1.0.0  
**Last Updated**: 2026
