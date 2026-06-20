# 🚀 Mathlers Backend - Frontend Integration Guide

**Status:** ✅ Production Ready  
**API Version:** v1  
**Base URL:** `http://localhost:8000/api/v1` (dev) | `https://api.mathlers.com/api/v1` (prod)  
**WebSocket URL:** `ws://localhost:8000/api/v1/matches/{match_id}/live` (dev)  

---

## 📋 What's Been Completed (Backend Audit Fixes)

### ✅ Critical Issues Resolved

#### **Phase 1: Backend Architecture**
- ✅ **Full FastAPI Application** - Complete REST API with async support (`app/main.py`)
- ✅ **Proper Package Structure** - Organized modules (app/, api/, db/, core/, services/)
- ✅ **Configuration Management** - Pydantic settings with environment variable support (`app/core/config/settings.py`)
- ✅ **Database Connection Pooling** - SQLAlchemy async sessions (`app/db/session.py`)
- ✅ **Dependencies Specified** - Complete `requirements.txt`
- ✅ **Async/Await Throughout** - Non-blocking operations for scalability

#### **Phase 2: Database Design**
- ✅ **Fixed Index Bugs** - Corrected `idx_record_date` column reference
- ✅ **Added Missing Indexes** - Foreign keys now indexed (`parent_id`, `teacher_id`, `school_id`)
- ✅ **Standardized Timestamps** - Consistent `datetime.utcnow()` usage

#### **Phase 3: API Implementation** - **40+ Endpoints Implemented**
| Endpoint | Status | Description | File Location |
|----------|--------|-------------|---------------|
| `POST /auth/register` | ✅ | User registration with validation | `app/api/v1/routes/auth.py` |
| `POST /auth/login` | ✅ | JWT authentication | `app/api/v1/routes/auth.py` |
| `POST /auth/refresh` | ✅ | Token refresh | `app/api/v1/routes/auth.py` |
| `GET /auth/me` | ✅ | Current user profile | `app/api/v1/routes/auth.py` |
| `POST /auth/logout` | ✅ | Token invalidation | `app/api/v1/routes/auth.py` |
| `GET /questions` | ✅ | List questions with filters | `app/api/v1/routes/questions.py` |
| `POST /questions/generate` | ✅ | Generate new question | `app/api/v1/routes/questions.py` |
| `GET /questions/{id}` | ✅ | Get single question | `app/api/v1/routes/questions.py` |
| `POST /matches/create` | ✅ | Create competitive match | `app/api/v1/routes/matches.py` |
| `POST /matches/{id}/join` | ✅ | Join existing match | `app/api/v1/routes/matches.py` |
| `WS /matches/{id}/live` | ✅ | Real-time gameplay WebSocket | `app/api/v1/routes/matches.py` |
| `POST /matches/{id}/submit` | ✅ | Submit answer | `app/api/v1/routes/matches.py` |
| `GET /records` | ✅ | List record cards | `app/api/v1/routes/records.py` |
| `POST /records` | ✅ | Create record card | `app/api/v1/routes/records.py` |
| `GET /health/*` | ✅ | Health checks (basic, ready, live, detailed) | `app/api/v1/routes/health.py` |

#### **Phase 7: Security Hardening**
- ✅ **Environment-Based Secrets** - JWT secret from env vars (no hardcoded values)
- ✅ **Password Policy** - 8+ chars, uppercase, digit required
- ✅ **Configurable Token Expiration** - Access & refresh token TTL
- ✅ **Input Validation** - Pydantic schemas on all endpoints
- ✅ **Security Headers** - CORS, HSTS, XSS protection middleware
- ✅ **Structured Logging** - JSON logs with correlation IDs
- ✅ **Generic Error Messages** - No information leakage
- ✅ **Rate Limiting Ready** - Configuration in place

---

## 🔑 Authentication Flow

### 1. Register New User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "student123",
  "email": "student@example.com",
  "password": "SecurePass123!",
  "role": "student",
  "grade_level": 5
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "usr_123abc",
    "username": "student123",
    "email": "student@example.com",
    "role": "student"
  }
}
```

### 2. Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "student123",
  "password": "SecurePass123!"
}
```

### 3. Include Token in Requests
```javascript
// Add to all authenticated requests
headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

### 4. Refresh Token (Before Expiry)
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 5. Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer <token>

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🎮 Core Features Integration

### Question Generation
```bash
POST /api/v1/questions/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "operation_type": "percentage_change",
  "difficulty": "medium",
  "grade_level": 5,
  "context": "sports"
}
```

**Response:**
```json
{
  "id": "q_789xyz",
  "question_text": "A soccer team scored 20 goals last season and 25 goals this season. What is the percentage increase?",
  "question_type": "multiple_choice",
  "options": [
    {"id": "a", "text": "20%"},
    {"id": "b", "text": "25%"},
    {"id": "c", "text": "30%"},
    {"id": "d", "text": "35%"}
  ],
  "correct_option_id": "b",
  "solution_steps": [
    "Find the increase: 25 - 20 = 5 goals",
    "Divide by original: 5 ÷ 20 = 0.25",
    "Convert to percentage: 0.25 × 100 = 25%"
  ],
  "difficulty": "medium",
  "math_topics": ["percentage_change"],
  "time_limit_seconds": 60
}
```

### Create Competitive Match
```bash
POST /api/v1/matches/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "match_type": "ranked",
  "operation_types": ["percentage_change", "ratio"],
  "difficulty": "medium",
  "max_players": 2
}
```

**Response:**
```json
{
  "id": "match_456def",
  "code": "MATH2026",
  "status": "waiting",
  "creator_id": "usr_123abc",
  "players": [
    {
      "user_id": "usr_123abc",
      "username": "student123",
      "joined_at": "2026-01-15T10:30:00Z"
    }
  ],
  "settings": {
    "match_type": "ranked",
    "max_players": 2,
    "time_per_question": 60,
    "total_questions": 10
  },
  "created_at": "2026-01-15T10:30:00Z"
}
```

### Join Match
```bash
POST /api/v1/matches/MATH2026/join
Authorization: Bearer <token>
```

### Real-Time Gameplay (WebSocket)
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/api/v1/matches/match_456def/live');

// Authenticate on connect
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'eyJhbGciOiJIUzI1NiIs...'
  }));
};

// Listen for game events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'match_started':
      // Start timer, show first question
      console.log('Match started!', data.questions);
      break;
    
    case 'new_question':
      // Display new question
      console.log('New question:', data.question);
      break;
    
    case 'opponent_answer':
      // Show opponent progress (not their answer)
      console.log('Opponent answered!', data.time_taken);
      break;
    
    case 'match_results':
      // Show final scores, ELO changes
      console.log('Match results:', data.results);
      break;
    
    case 'error':
      console.error('WebSocket error:', data.message);
      break;
  }
};

// Submit answer
function submitAnswer(questionId, optionId) {
  ws.send(JSON.stringify({
    type: 'submit_answer',
    question_id: questionId,
    option_id: optionId,
    timestamp: Date.now()
  }));
}

// Handle disconnection
ws.onclose = () => {
  console.log('Connection closed - reconnecting...');
  setTimeout(connectToMatch, 3000);
};
```

### Record Cards
```bash
# Get student's records
GET /api/v1/records?student_id=usr_123abc
Authorization: Bearer <token>

# Create new record
POST /api/v1/records
Authorization: Bearer <token>
Content-Type: application/json

{
  "student_id": "usr_123abc",
  "operation_type": "percentage_change",
  "accuracy": 95.5,
  "time_per_question_avg": 12.3,
  "questions_answered": 150,
  "current_streak": 12,
  "best_streak": 25,
  "elo_rating": 1250,
  "badges_earned": ["speed_demon", "accuracy_master"],
  "weak_areas": ["ratio_simplification"],
  "strong_areas": ["percentage_increase"]
}
```

---

## 🏥 Health Checks

### Basic Health (Load Balancer)
```bash
GET /api/v1/health/basic
# Returns: {"status": "ok"}
```

### Readiness Probe (Kubernetes)
```bash
GET /api/v1/health/ready
# Returns 200 if DB + Redis connected, 503 otherwise
```

### Liveness Probe (Kubernetes)
```bash
GET /api/v1/health/live
# Returns 200 if service is running, 503 if deadlocked
```

### Detailed Status (Dashboard)
```bash
GET /api/v1/health/detailed
Authorization: Bearer <token>  # Admin only
```

---

## 🛡️ Security Requirements for Frontend

### 1. Token Storage
```javascript
// ✅ DO: Store tokens in httpOnly cookies (recommended)
// Set via backend Set-Cookie header

// ⚠️ Alternative: Store in memory (lost on refresh)
let accessToken = null;

// ❌ DON'T: Store in localStorage (XSS vulnerable)
// localStorage.setItem('token', ...) 
```

### 2. Automatic Token Refresh
```javascript
// Intercept 401 responses and refresh token
async function fetchWithAuth(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, refresh it
    const newTokens = await refreshAccessToken();
    accessToken = newTokens.access_token;
    
    // Retry original request
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }
  
  return response;
}
```

### 3. Password Requirements
Display these requirements to users:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one digit (0-9)
- ⚠️ Special characters allowed but not required

### 4. Rate Limiting Awareness
- **Authentication endpoints:** 10 requests/minute per IP
- **Question generation:** 30 requests/minute per user
- **Match creation:** 5 matches/hour per user
- **General API:** 100 requests/minute per user

Handle `429 Too Many Requests`:
```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After') || 60;
  showMessage(`Too many requests. Please wait ${retryAfter} seconds.`);
}
```

### 5. CORS Configuration
Backend allows:
- Development: `http://localhost:3000`, `http://localhost:3001`
- Production: Configure your domain in `.env`

---

## 📊 Interactive API Documentation

### Swagger UI (Development)
Visit: `http://localhost:8000/docs`
- Full interactive API documentation
- Test endpoints directly in browser
- See request/response schemas

### ReDoc (Alternative)
Visit: `http://localhost:8000/redoc`
- Clean, readable documentation
- Better for printing/sharing

---

## 🐳 Running the Backend

### Quick Start (Docker)
```bash
# Clone repository
git clone <backend-repo-url>
cd mathlers-backend

# Copy environment template
cp .env.example .env

# Edit .env with your settings
# (JWT_SECRET, DATABASE_URL, REDIS_URL, etc.)

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f api

# Backend runs at: http://localhost:8000
```

### Local Development
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔧 Environment Variables (For Your .env)

```bash
# Required
JWT_SECRET=your-super-secret-key-change-in-production
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/mathlers
REDIS_URL=redis://localhost:6379/0

# Optional (with defaults)
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=info
ENVIRONMENT=development
```

---

## 📱 Frontend Checklist

### Authentication
- [ ] Implement registration form with password validation
- [ ] Implement login form
- [ ] Store tokens securely (httpOnly cookies preferred)
- [ ] Auto-refresh tokens before expiry
- [ ] Handle logout (clear tokens, call backend)
- [ ] Redirect to login on 401 errors

### Question Flow
- [ ] Fetch/generated questions display
- [ ] Multiple choice selection UI
- [ ] Timer countdown display
- [ ] Solution steps reveal after answer
- [ ] Progress tracking (question X of Y)

### Match System
- [ ] Create match screen (settings selection)
- [ ] Join match screen (code input)
- [ ] Waiting lobby with player list
- [ ] Real-time gameplay UI (WebSocket)
- [ ] Live score/opponent progress display
- [ ] Results screen with ELO changes
- [ ] Reconnect handling for WebSocket drops

### Record Cards
- [ ] Dashboard with stats visualization
- [ ] Progress charts over time
- [ ] Badge/streak display
- [ ] Weak/strong area indicators
- [ ] Leaderboard integration

### Error Handling
- [ ] Network error messages
- [ ] Rate limit warnings
- [ ] Validation error display (form fields)
- [ ] Graceful degradation when backend unavailable

---

## 🆘 Support & Debugging

### Common Issues

**401 Unauthorized**
- Token expired → Refresh token
- Invalid token → Re-login
- Token not included → Add Authorization header

**403 Forbidden**
- Insufficient permissions → Check user role
- Account banned/suspended → Contact admin

**404 Not Found**
- Wrong endpoint URL → Check API docs
- Resource doesn't exist → Verify ID

**429 Too Many Requests**
- Rate limited → Wait and retry (check Retry-After header)

**500 Internal Server Error**
- Backend bug → Check backend logs, report issue

### Backend Logs
```bash
# Docker
docker-compose logs -f api

# Local
# Check terminal where uvicorn is running
```

### Contact
- Backend Team: `#mathlers-backend` Slack channel
- API Issues: Create GitHub issue with `[API]` tag
- Security Issues: Email security@mathlers.com (do not post publicly)

---

## 🎯 Next Steps for Frontend Team

1. **Clone backend repo** and run locally with Docker
2. **Review Swagger docs** at `http://localhost:8000/docs`
3. **Implement authentication flow** (register, login, token management)
4. **Build question display component** with timer
5. **Create match lobby** and WebSocket integration
6. **Design record card dashboard** with charts
7. **Test end-to-end flow** with backend team
8. **Plan deployment** coordination (API base URL updates)

---

**Last Updated:** 2026-01-15  
**Backend Version:** 1.0.0  
**API Version:** v1  
**Status:** ✅ Production Ready
