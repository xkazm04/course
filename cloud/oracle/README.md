# Oracle Cloud Function

Learning path generation with Gemini 2.0 Flash and Google Search grounding.

## Architecture

- **Runtime**: Python 3.11 on Cloud Run
- **AI Model**: Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
- **Database**: Supabase (PostgreSQL)
- **Monitoring**: Datadog LLM tracing
- **Grounding**: Google Search for real-time market data

## API Endpoints

### `POST /oracle/start`
Start a new Oracle session.

**Request:**
```json
{
  "user_id": "optional-user-uuid"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "question_index": 0,
  "question": {
    "id": "domain",
    "question": "What area interests you most?",
    "options": [...]
  },
  "total_static_questions": 3
}
```

### `POST /oracle/answer`
Submit an answer and get the next question.

**Request:**
```json
{
  "session_id": "uuid",
  "answer": "frontend",
  "question_index": 0
}
```

**Response (static phase):**
```json
{
  "session_id": "uuid",
  "question_index": 1,
  "question": {...},
  "phase": "static"
}
```

**Response (LLM phase):**
```json
{
  "session_id": "uuid",
  "question_index": 4,
  "question": {
    "type": "question",
    "question": "What specific technologies...",
    "options": [...],
    "reasoning": "..."
  },
  "phase": "llm"
}
```

**Response (complete):**
```json
{
  "session_id": "uuid",
  "phase": "complete",
  "paths": [
    {
      "name": "Frontend Essentials",
      "description": "...",
      "node_ids": ["uuid1", "uuid2"],
      "forge_suggestions": [...],
      "estimated_weeks": 8,
      "reasoning": "..."
    }
  ]
}
```

### `GET /oracle/session/:session_id`
Get session details and generated paths.

### `POST /oracle/paths/:session_id/select`
Select a generated path.

## Flow

1. **Static Questions (0-2)**: Domain, Experience, Goal
2. **LLM Questions (3-5)**: Dynamically generated based on answers
3. **Path Generation**: Uses Google Search grounding for market trends
4. **Path Selection**: User picks from 2-3 suggested paths

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your credentials

# Run locally
python main.py
```

## Deployment

```bash
# Deploy via Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Or deploy directly
gcloud run deploy oracle \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google AI API key for Gemini |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `DD_API_KEY` | Datadog API key |
| `DD_SERVICE` | Datadog service name |
| `DD_ENV` | Datadog environment tag |
