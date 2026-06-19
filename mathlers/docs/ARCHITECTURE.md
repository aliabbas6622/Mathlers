# Mathlers Platform - Complete Architecture Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [API Design](#api-design)
6. [Database Schema](#database-schema)
7. [Security & Access Control](#security--access-control)
8. [Deployment Guide](#deployment-guide)

---

## System Overview

**Mathlers** is an AI-powered educational platform that transforms mathematics learning into an exciting boxing-themed competition experience. The platform uses real-world records from sports, esports, gaming, and science to generate endless unique math questions.

### Key Features

- **AI Question Generation**: Automatically generates math questions from real-world data
- **Boxing Ring Theme**: Competition structured as boxing rounds (Warm-up → Jab → Hook → Uppercut → Knockout)
- **Role-Based Access**: Admin, Moderator, Teacher, Parent, Student, Guest roles
- **Real-Time Competitions**: 1v1 matches, tournaments, leaderboards
- **Gamification**: Belts, badges, streaks, ELO rankings
- **Multi-Platform**: Web and mobile support

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   Web App    │    │  Mobile App  │    │  Teacher     │               │
│  │  (React.js)  │    │ (React Native)│   │  Dashboard   │               │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘               │
│         │                   │                    │                       │
│         └───────────────────┼────────────────────┘                       │
│                             │                                            │
│                     (HTTPS / WebSocket)                                  │
│                             │                                            │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Load Balancer   │
                    │   (AWS ALB/Nginx) │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┼────────────────────────────────────────────┐
│                        API GATEWAY                                       │
│                    (Rate Limiting, Auth)                                 │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Auth        │    │   Core        │    │   Competition │
│   Service     │    │   Service     │    │   Service     │
│               │    │               │    │               │
│ - Login       │    │ - Users       │    │ - Matches     │
│ - Register    │    │ - Profiles    │    │ - Tournaments │
│ - JWT         │    │ - Classes     │    │ - Leaderboards│
│ - RBAC        │    │ - Schools     │    │ - ELO System  │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                     │
        │            ┌───────▼────────┐           │
        │            │   AI Service   │           │
        │            │                │           │
        │            │ - Question Gen │           │
        │            │ - RAG Pipeline │           │
        │            │ - Validation   │           │
        │            └───────┬────────┘           │
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
        ▼                    ▼                     ▼
┌───────────────┐   ┌───────────────┐    ┌───────────────┐
│  PostgreSQL   │   │    Redis      │    │   Vector DB   │
│  (Primary DB) │   │   (Cache)     │    │   (Pinecone)  │
│               │   │               │    │               │
│ - Users       │   │ - Sessions    │    │ - Embeddings  │
│ - Questions   │   │ - Leaderboards│    │ - Records     │
│ - Matches     │   │ - Rate Limits │    │ - RAG Data    │
│ - Records     │   │ - Pub/Sub     │    │               │
└───────────────┘   └───────────────┘    └───────────────┘
                             │
                    ┌────────▼────────┐
                    │  Data Ingestion │
                    │    Workers      │
                    │                 │
                    │ - Guinness API  │
                    │ - Esports APIs  │
                    │ - Steam API     │
                    │ - Sports APIs   │
                    └─────────────────┘
```

---

## Core Components

### 1. Authentication Service

Handles user authentication, authorization, and session management.

**Technologies**: JWT, bcrypt, Flask/JWT

**Key Functions**:
- User registration with role assignment
- Login/logout with JWT tokens
- Refresh token mechanism
- Role-based access control (RBAC)
- Permission checking decorators

### 2. Core Service

Main business logic for users, schools, classes, and content management.

**Modules**:
- `user_management.py`: CRUD operations for users
- `school_management.py`: School and class operations
- `content_management.py`: Questions and record cards
- `progress_tracking.py`: Student progress analytics

### 3. AI Service

Question generation engine using AI and real-world data.

**Components**:
- `question_generator.py`: Template-based question generation
- `rag_pipeline.py`: Retrieval-augmented generation for context
- `validator.py`: Mathematical accuracy validation
- `difficulty_calibrator.py`: Adaptive difficulty adjustment

### 4. Competition Service

Real-time match and tournament management.

**Features**:
- Matchmaking system (ELO-based)
- Real-time score tracking (WebSocket)
- Tournament bracket generation
- Leaderboard calculations
- Belt/badge awarding

---

## Data Flow

### Question Generation Flow

```
1. Data Sources → Data Ingestion Worker
   ├── Guinness World Records API
   ├── Esports Charts API
   ├── Speedrun.com API
   └── Sports Reference API

2. Data Ingestion → Record Cards (Database)
   ├── Parse and validate data
   ├── Extract numeric values
   ├── Tag with difficulty/topics
   └── Store in record_cards table

3. Record Cards → Vector Database (Embeddings)
   ├── Generate embeddings
   └── Store for RAG retrieval

4. Match Request → Question Generator
   ├── Fetch relevant records (RAG)
   ├── Select appropriate templates
   ├── Generate questions with AI
   ├── Validate mathematical accuracy
   └── Return question set

5. Questions → Cache (Redis)
   └── TTL: 1 hour for reuse
```

### Competition Flow

```
1. Student initiates match → Competition Service
   ├── Check eligibility
   ├── Find opponent (matchmaking)
   └── Create match record

2. Match starts → Generate questions
   ├── Fetch 20 questions (5 rounds)
   ├── Distribute by round type
   └── Send to both players

3. Real-time gameplay → WebSocket
   ├── Player answers question
   ├── Validate answer
   ├── Calculate score (base + speed + streak)
   ├── Update live leaderboard
   └── Broadcast to opponent

4. Match ends → Post-processing
   ├── Determine winner
   ├── Update ELO ratings
   ├── Award badges/belts
   ├── Update statistics
   └── Log to analytics

5. Results → Frontend
   ├── Match summary
   ├── ELO changes
   ├── New badges earned
   └── Leaderboard positions
```

---

## API Design

### RESTful Endpoints

#### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
POST   /api/auth/refresh           # Refresh token
POST   /api/auth/logout            # Logout
GET    /api/auth/me                # Get current user
```

#### Users (Admin/Teacher only)
```
GET    /api/users                  # List users (paginated)
GET    /api/users/:id              # Get user details
PUT    /api/users/:id              # Update user
DELETE /api/users/:id              # Delete user
POST   /api/users/:id/role         # Change user role
```

#### Questions
```
GET    /api/questions              # List questions (filters: difficulty, topic)
POST   /api/questions/generate     # Generate new questions (AI)
GET    /api/questions/:id          # Get specific question
PUT    /api/questions/:id          # Update question
DELETE /api/questions/:id          # Delete question
POST   /api/questions/:id/validate # Validate question accuracy
```

#### Competitions
```
GET    /api/matches                # List matches
POST   /api/matches/create         # Create new match
GET    /api/matches/:id            # Get match details
POST   /api/matches/:id/join       # Join match
WS     /api/matches/:id/live       # Live match updates (WebSocket)

GET    /api/tournaments            # List tournaments
POST   /api/tournaments            # Create tournament
GET    /api/tournaments/:id        # Get tournament details
POST   /api/tournaments/:id/register # Register for tournament
GET    /api/tournaments/:id/bracket # Get bracket
```

#### Progress & Analytics
```
GET    /api/progress/:userId       # Get user progress
GET    /api/progress/:userId/topics # Topic mastery breakdown
GET    /api/analytics/leaderboard  # Global leaderboard
GET    /api/analytics/school/:id   # School-specific analytics
GET    /api/analytics/class/:id    # Class analytics
```

#### Schools & Classes (Teacher)
```
GET    /api/schools                # List schools
POST   /api/schools                # Create school
GET    /api/classes                # List classes (teacher's)
POST   /api/classes                # Create class
POST   /api/classes/:id/enroll     # Enroll student
DELETE /api/classes/:id/enroll/:studentId # Remove student
GET    /api/classes/:id/students   # List enrolled students
POST   /api/classes/:id/assign     # Assign practice
```

---

## Database Schema

### Key Tables

#### Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    elo_rating INTEGER DEFAULT 1000,
    age_group VARCHAR(50),
    parent_id INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Record Cards
```sql
CREATE TABLE record_cards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    holder VARCHAR(255),
    numeric_value FLOAT NOT NULL,
    unit VARCHAR(50),
    previous_value FLOAT,
    category VARCHAR(50) NOT NULL,
    source VARCHAR(255),
    difficulty_tags JSONB,
    math_topics JSONB,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Questions
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    scenario TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer VARCHAR(255) NOT NULL,
    correct_option_index INTEGER,
    step_by_step_solution TEXT,
    difficulty VARCHAR(50) NOT NULL,
    math_topic VARCHAR(50),
    round_type VARCHAR(50),
    record_card_id INTEGER REFERENCES record_cards(id),
    is_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Matches
```sql
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    mode VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    tournament_id INTEGER REFERENCES tournaments(id),
    winner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

---

## Security & Access Control

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| Admin | 100 | Full system access |
| Moderator | 80 | Content moderation, user management |
| Teacher | 60 | Class management, student tracking |
| Parent | 40 | View child progress, manage account |
| Student | 20 | Practice, compete, view own progress |
| Guest | 0 | Public content, demo access |

### Permission System

Each role has specific permissions defined in `settings.yaml`:

```yaml
roles:
  admin:
    permissions:
      - manage_users
      - manage_roles
      - delete_content
      - ban_users
      
  teacher:
    permissions:
      - create_classes
      - view_student_progress
      - assign_practice
      
  student:
    permissions:
      - practice_mode
      - join_competitions
      - view_leaderboards
```

### Security Measures

1. **Authentication**: JWT tokens with refresh mechanism
2. **Password Storage**: bcrypt hashing (12 rounds)
3. **Input Validation**: All inputs sanitized and validated
4. **Rate Limiting**: 60 requests/minute per user
5. **CORS**: Configured allowed origins
6. **HTTPS**: All communications encrypted
7. **SQL Injection Prevention**: ORM with parameterized queries
8. **XSS Protection**: Content sanitization
9. **DDoS Protection**: Cloudflare integration

---

## Deployment Guide

### Infrastructure Requirements

#### Production Environment

```yaml
Cloud Provider: AWS
Region: us-east-1 (primary), eu-west-1 (backup)

Compute:
  - ECS Fargate (containers)
  - Min instances: 2
  - Max instances: 50
  - Auto-scaling: CPU > 70%

Database:
  - RDS PostgreSQL (db.r5.large)
  - Multi-AZ deployment
  - Automated backups

Cache:
  - ElastiCache Redis (cache.r5.large)
  - Cluster mode enabled

Storage:
  - S3 for static assets
  - CloudFront CDN

Monitoring:
  - CloudWatch
  - Datadog
  - Sentry (error tracking)
```

### Docker Configuration

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app.main:app"]
```

### Environment Variables

```bash
# .env.production
DB_HOST=mathlers-db.xxxxx.us-east-1.rds.amazonaws.com
DB_USER=mathlers_admin
DB_PASSWORD=${SECRET_DB_PASSWORD}
REDIS_HOST=mathlers-redis.xxxxx.ng.0001.use1.cache.amazonaws.com
JWT_SECRET=${SECRET_JWT_KEY}
OPENAI_API_KEY=${SECRET_OPENAI_KEY}
SENTRY_DSN=${SECRET_SENTRY_DSN}
```

### Deployment Steps

1. **Build and Push Images**
   ```bash
   docker build -t mathlers-backend ./backend
   docker tag mathlers-backend:latest ${ECR_REPO}/mathlers-backend:latest
   docker push ${ECR_REPO}/mathlers-backend:latest
   ```

2. **Update ECS Task Definition**
   ```bash
   aws ecs register-task-definition --cli-input-json file://task-def.json
   ```

3. **Deploy to ECS**
   ```bash
   aws ecs update-service --cluster mathlers --service backend \
     --task-definition mathlers-backend --force-new-deployment
   ```

4. **Run Database Migrations**
   ```bash
   alembic upgrade head
   ```

5. **Verify Deployment**
   ```bash
   curl https://api.mathlers.com/health
   ```

---

## Cost Estimates

### Monthly Costs (Estimated)

| Service | 1K Users | 10K Users | 100K Users |
|---------|----------|-----------|------------|
| Compute (ECS) | $100 | $500 | $3,000 |
| Database (RDS) | $150 | $300 | $1,500 |
| Cache (Redis) | $50 | $150 | $500 |
| AI API Calls | $200 | $2,000 | $20,000 |
| CDN/Bandwidth | $50 | $200 | $1,000 |
| Monitoring | $50 | $100 | $300 |
| **Total** | **$600** | **$3,250** | **$26,300** |

### Cost Per Question Generated

- OpenAI GPT-4o: ~$0.003 per question
- With caching: ~$0.0003 per question (10x reuse)
- Target: <$0.001 per question average

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up infrastructure
- [ ] Implement authentication system
- [ ] Create database schema
- [ ] Build basic user management

### Phase 2: Core Features (Weeks 5-8)
- [ ] Question generation engine
- [ ] Record card data ingestion
- [ ] Basic competition system
- [ ] Scoring algorithm

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] Tournament system
- [ ] ELO matchmaking
- [ ] Gamification (belts, badges)
- [ ] Teacher dashboard

### Phase 4: Polish & Scale (Weeks 13-16)
- [ ] Performance optimization
- [ ] Load testing
- [ ] Security audit
- [ ] Beta launch

### Phase 5: Launch (Weeks 17+)
- [ ] Marketing site
- [ ] User onboarding
- [ ] Monitor and iterate
- [ ] Feature expansion

---

## Support & Contact

For questions or issues, contact the development team at dev@mathlers.com

**Version**: 1.0.0  
**Last Updated**: 2026
