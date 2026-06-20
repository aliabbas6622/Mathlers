# Mathlers Backend API

Production-ready FastAPI backend for the Mathlers educational platform.

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Development Setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Start database and cache:**
```bash
# Using Docker (recommended)
docker-compose up -d db redis

# Or install locally
# PostgreSQL: https://www.postgresql.org/download/
# Redis: https://redis.io/download/
```

5. **Run migrations:**
```bash
alembic upgrade head
```

6. **Start the API:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

7. **Access the API:**
- API: http://localhost:8000
- Docs (Swagger): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Production Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f api
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/password` - Change password
- `POST /api/v1/auth/logout` - Logout

### Questions
- `GET /api/v1/questions` - List questions
- `GET /api/v1/questions/{id}` - Get question
- `POST /api/v1/questions/generate` - Generate question
- `GET /api/v1/questions/random` - Get random question

### Matches
- `POST /api/v1/matches/create` - Create match
- `GET /api/v1/matches/{id}` - Get match
- `POST /api/v1/matches/join` - Join match
- `WS /api/v1/matches/ws/{id}` - Real-time gameplay

### Records
- `GET /api/v1/records` - List record cards
- `GET /api/v1/records/{id}` - Get record
- `POST /api/v1/records` - Create record (admin)
- `PUT /api/v1/records/{id}` - Update record (admin)
- `DELETE /api/v1/records/{id}` - Delete record (admin)

### Health
- `GET /api/v1/health` - Health check
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe
- `GET /api/v1/health/detailed` - Detailed health

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Input validation with Pydantic
- CORS protection
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Rate limiting ready
- SQL injection prevention via SQLAlchemy ORM

## Configuration

All configuration is managed through environment variables. See `.env.example` for all options.

Key variables:
- `JWT_SECRET_KEY` - **MUST CHANGE IN PRODUCTION**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `CORS_ORIGINS` - Allowed frontend origins
- `ENVIRONMENT` - development/staging/production

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py
```

## Project Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── routes/      # API route handlers
│   │   ├── schemas/     # Pydantic models
│   │   └── router.py    # Main API router
│   ├── core/
│   │   ├── config/      # Configuration management
│   │   └── auth.py      # Auth utilities (deprecated)
│   ├── db/
│   │   └── session.py   # Database connection
│   ├── middleware/      # Custom middleware
│   ├── models/
│   │   └── database.py  # SQLAlchemy models
│   ├── services/        # Business logic
│   └── main.py          # Application entry point
├── tests/               # Test files
├── .env.example         # Environment template
├── Dockerfile           # Production container
├── docker-compose.yml   # Local development stack
└── requirements.txt     # Python dependencies
```

## License

Proprietary - Mathlers Platform
