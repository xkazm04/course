"""
Oracle Cloud Function
Learning path generation and Google Search grounding

Instrumented with Datadog for comprehensive LLM observability:
- APM traces for all endpoints
- Custom metrics for token usage, latency, cost
- Structured logging for debugging
- Business metrics for path generation
"""

import os
import sys
import json
import logging
import time
import uuid
from typing import Optional
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from supabase import create_client, Client
from pydantic import BaseModel
from ddtrace import tracer

# Import shared metrics module (copied locally for deployment)
from shared.metrics import OracleMetrics, estimate_tokens

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Datadog metrics
metrics = OracleMetrics()

# Initialize clients
genai_client: Optional[genai.Client] = None
supabase: Optional[Client] = None


def get_genai_client() -> genai.Client:
    """Lazy initialization of Gemini client."""
    global genai_client
    if genai_client is None:
        genai_client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
    return genai_client


def get_supabase_client() -> Client:
    """Lazy initialization of Supabase client."""
    global supabase
    if supabase is None:
        supabase = create_client(
            os.environ.get("SUPABASE_URL", ""),
            os.environ.get("SUPABASE_SERVICE_KEY", "")
        )
    return supabase


# Static questions (first 3 questions before LLM kicks in)
STATIC_QUESTIONS = [
    {
        "id": "domain",
        "question": "What area interests you most?",
        "options": [
            {"id": "frontend", "label": "Frontend", "description": "Build beautiful user interfaces"},
            {"id": "backend", "label": "Backend", "description": "Power server infrastructure"},
            {"id": "fullstack", "label": "Fullstack", "description": "Master the complete stack"},
            {"id": "mobile", "label": "Mobile", "description": "Create native mobile apps"},
            {"id": "games", "label": "Games", "description": "Build interactive experiences"},
            {"id": "databases", "label": "Databases", "description": "Architect data systems"},
        ]
    },
    {
        "id": "experience",
        "question": "What's your current experience level?",
        "options": [
            {"id": "beginner", "label": "Beginner", "description": "Just starting out"},
            {"id": "intermediate", "label": "Intermediate", "description": "Some experience"},
            {"id": "advanced", "label": "Advanced", "description": "Looking to specialize"},
        ]
    },
    {
        "id": "goal",
        "question": "What's your primary goal?",
        "options": [
            {"id": "job", "label": "Get a job", "description": "Land your first or next role"},
            {"id": "projects", "label": "Build projects", "description": "Create real applications"},
            {"id": "fundamentals", "label": "Master fundamentals", "description": "Deep understanding"},
            {"id": "freelance", "label": "Freelance", "description": "Work independently"},
        ]
    }
]


class OracleRequest(BaseModel):
    """Request model for Oracle endpoints."""
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    answer: Optional[str] = None
    question_index: int = 0


def build_system_prompt(domain: str, experience: str, goal: str) -> str:
    """Build system prompt for Gemini with context."""
    return f"""You are the Learning Oracle, an expert career and education advisor specializing in software development paths.

CONTEXT:
- User's chosen domain: {domain}
- Experience level: {experience}
- Primary goal: {goal}

YOUR ROLE:
1. Ask targeted follow-up questions to understand the user's specific needs
2. Consider current job market trends and in-demand skills
3. Evaluate which learning path would be most effective
4. Eventually suggest a personalized learning path

RESPONSE FORMAT:
Always respond with valid JSON in this format:
{{
    "type": "question" | "path_suggestion",
    "question": "Your question text" (if type is question),
    "options": [
        {{"id": "option_id", "label": "Short label", "description": "Explanation"}}
    ] (if type is question),
    "reasoning": "Brief explanation of why you're asking this" (if type is question),
    "paths": [...] (if type is path_suggestion)
}}

GUIDELINES:
- Ask 2-4 more questions after the initial 3 static questions
- Questions should help narrow down: specific technologies, time commitment, learning style
- Use Google Search to ground your suggestions in current market trends
- Be encouraging but realistic about job market expectations
"""


def build_conversation_history(session: dict) -> list[dict]:
    """Build conversation history for Gemini from session data."""
    history = []

    # Add static answers if present
    if session.get("domain_answer"):
        history.append({
            "role": "user",
            "content": f"Domain: {session['domain_answer']}"
        })

    if session.get("experience_answer"):
        history.append({
            "role": "user",
            "content": f"Experience: {session['experience_answer']}"
        })

    if session.get("goal_answer"):
        history.append({
            "role": "user",
            "content": f"Goal: {session['goal_answer']}"
        })

    # Add LLM conversation history
    llm_questions = session.get("llm_questions", [])
    llm_answers = session.get("llm_answers", [])

    for i, q in enumerate(llm_questions):
        history.append({"role": "assistant", "content": json.dumps(q)})
        if i < len(llm_answers):
            history.append({"role": "user", "content": llm_answers[i]})

    return history


@tracer.wrap(service="oracle", resource="generate_next_question")
def generate_next_question(session: dict) -> dict:
    """Generate next question using Gemini with Google Search grounding."""
    start_time = time.time()
    client = get_genai_client()
    model_name = "gemini-2.0-flash-exp"

    # Build prompt with conversation history
    system_prompt = build_system_prompt(
        session.get("domain_answer", ""),
        session.get("experience_answer", ""),
        session.get("goal_answer", "")
    )

    history = build_conversation_history(session)

    # Count LLM questions asked so far
    llm_question_count = len(session.get("llm_questions", []))

    # Determine if we should ask more questions or generate paths
    if llm_question_count >= 3:
        user_message = "Based on our conversation, please suggest 2-3 personalized learning paths for me."
    else:
        user_message = "Please ask me another targeted question to help refine my learning path."

    # Build a combined prompt with history (simpler approach)
    history_text = "\n".join([f"{h['role'].upper()}: {h['content']}" for h in history])
    full_prompt = f"""Previous conversation:
{history_text}

Now respond to: {user_message}"""

    # Configure Google Search grounding
    google_search_tool = types.Tool(
        google_search=types.GoogleSearch()
    )

    # Estimate input tokens
    input_tokens = estimate_tokens(system_prompt + full_prompt)

    try:
        # Generate response with Gemini - use simple string input
        response = client.models.generate_content(
            model=model_name,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=[google_search_tool],
                temperature=0.7,
                max_output_tokens=1024,
            )
        )

        response_text = response.text
        output_tokens = estimate_tokens(response_text)
        latency_ms = (time.time() - start_time) * 1000

        # Check for grounding usage
        grounding_used = False
        grounding_info = None
        try:
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                    grounding_used = True
                    gm = candidate.grounding_metadata
                    grounding_info = {
                        "search_queries": getattr(gm, 'search_entry_point', {}).get('rendered_content', '') if hasattr(gm, 'search_entry_point') else None,
                    }
        except Exception as e:
            logger.warning(f"Could not extract grounding metadata: {e}")

        # Record successful LLM request metrics
        metrics.record_llm_request(
            operation="generate_next_question",
            model=model_name,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            success=True,
            grounding_used=grounding_used,
            extra_tags={
                "domain": session.get("domain_answer", "unknown"),
                "experience": session.get("experience_answer", "unknown"),
                "question_count": str(llm_question_count)
            }
        )

        # Clean up potential markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()

        result = json.loads(response_text)
        result["grounding_sources"] = grounding_info
        return result

    except json.JSONDecodeError as e:
        latency_ms = (time.time() - start_time) * 1000
        logger.error(f"Failed to parse Gemini response: {e}")
        logger.error(f"Raw response: {response.text}")

        # Record parse error
        metrics.record_parse_error("generate_next_question", str(e))
        metrics.record_llm_request(
            operation="generate_next_question",
            model=model_name,
            input_tokens=input_tokens,
            output_tokens=estimate_tokens(response.text) if response else 0,
            latency_ms=latency_ms,
            success=False,
            error_type="JSONDecodeError"
        )

        # Return a fallback question
        return {
            "type": "question",
            "question": "What specific technologies are you most interested in learning?",
            "options": [
                {"id": "react", "label": "React/Next.js", "description": "Modern frontend frameworks"},
                {"id": "python", "label": "Python", "description": "Backend and data science"},
                {"id": "typescript", "label": "TypeScript", "description": "Type-safe JavaScript"},
                {"id": "other", "label": "Something else", "description": "Tell me more"},
            ],
            "reasoning": "Understanding your technology preferences helps create a focused path."
        }

    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        logger.error(f"Error in generate_next_question: {e}")

        # Record error metrics
        metrics.record_llm_request(
            operation="generate_next_question",
            model=model_name,
            input_tokens=input_tokens,
            output_tokens=0,
            latency_ms=latency_ms,
            success=False,
            error_type=type(e).__name__
        )
        raise


@tracer.wrap(service="oracle", resource="generate_learning_paths")
def generate_learning_paths(session: dict, available_nodes: list[dict]) -> list[dict]:
    """Generate learning path suggestions based on session and available nodes."""
    start_time = time.time()
    client = get_genai_client()
    model_name = "gemini-2.0-flash-exp"
    domain = session.get("domain_answer", "unknown")

    # Build comprehensive prompt
    system_prompt = f"""You are the Learning Oracle generating personalized learning paths.

USER PROFILE:
- Domain: {session.get("domain_answer", "")}
- Experience: {session.get("experience_answer", "")}
- Goal: {session.get("goal_answer", "")}

AVAILABLE LEARNING NODES:
{json.dumps(available_nodes[:50], indent=2)}

TASK:
Generate 2-3 learning paths tailored to this user. Each path should:
1. Include existing nodes from the available list (by their IDs)
2. Suggest any additional nodes that should be "forged" (created) if they don't exist
3. Provide estimated duration and reasoning

RESPONSE FORMAT (JSON):
{{
    "paths": [
        {{
            "name": "Path name",
            "description": "Brief description",
            "node_ids": ["existing-node-id-1", "existing-node-id-2"],
            "forge_suggestions": [
                {{
                    "name": "Suggested new node",
                    "description": "Why this should exist",
                    "parent_slug": "parent-node-slug"
                }}
            ],
            "estimated_weeks": 8,
            "reasoning": "Why this path fits the user",
            "confidence": 0.85
        }}
    ]
}}
"""

    # Include conversation history
    history = build_conversation_history(session)
    history_text = "\n".join([f"{h['role']}: {h['content']}" for h in history])
    user_prompt = f"Conversation history:\n{history_text}\n\nGenerate personalized learning paths based on current job market trends."

    # Estimate input tokens
    input_tokens = estimate_tokens(system_prompt + user_prompt)

    # Configure Google Search grounding for market trends
    google_search_tool = types.Tool(
        google_search=types.GoogleSearch()
    )

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=[google_search_tool],
                temperature=0.7,
                max_output_tokens=2048,
            )
        )

        response_text = response.text
        output_tokens = estimate_tokens(response_text)
        latency_ms = (time.time() - start_time) * 1000

        # Clean up markdown
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()

        result = json.loads(response_text)
        paths = result.get("paths", [])

        # Calculate average confidence for metrics
        avg_confidence = sum(p.get("confidence", 0.5) for p in paths) / len(paths) if paths else 0

        # Record successful metrics
        metrics.record_llm_request(
            operation="generate_learning_paths",
            model=model_name,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            success=True,
            grounding_used=True,
            extra_tags={"domain": domain}
        )

        # Record business metric for path generation
        if paths:
            metrics.record_path_generated(
                domain=domain,
                confidence=avg_confidence,
                num_paths=len(paths),
                generation_method="llm"
            )

        return paths

    except json.JSONDecodeError as e:
        latency_ms = (time.time() - start_time) * 1000
        logger.error(f"Failed to parse paths response: {e}")

        metrics.record_parse_error("generate_learning_paths", str(e))
        metrics.record_llm_request(
            operation="generate_learning_paths",
            model=model_name,
            input_tokens=input_tokens,
            output_tokens=0,
            latency_ms=latency_ms,
            success=False,
            error_type="JSONDecodeError"
        )
        return []

    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        logger.error(f"Error generating learning paths: {e}")

        metrics.record_llm_request(
            operation="generate_learning_paths",
            model=model_name,
            input_tokens=input_tokens,
            output_tokens=0,
            latency_ms=latency_ms,
            success=False,
            error_type=type(e).__name__
        )
        raise


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})


# =============================================================================
# NEW SINGLE-CALL ORACLE ENDPOINT
# =============================================================================

def build_comprehensive_prompt(profile: dict) -> str:
    """Build a comprehensive system prompt from user profile."""
    experience_context = {
        "beginner": "just starting their journey, needs foundational guidance and encouragement",
        "intermediate": "has solid basics, looking to break through plateaus and specialize",
        "advanced": "experienced developer seeking to optimize expertise and stay ahead of trends"
    }

    commitment_context = {
        "casual": "2-5 hours per week, needs efficient learning path",
        "part_time": "10-15 hours per week, can make steady progress",
        "dedicated": "20-30 hours per week, accelerated learning possible",
        "immersive": "40+ hours per week, bootcamp-style intensity"
    }

    exp_desc = experience_context.get(profile.get("experience_level", "beginner"), "learning")
    commit_desc = commitment_context.get(profile.get("commitment", "part_time"), "moderate time")
    domain = profile.get("domain", "software development")

    return f"""You are the Learning Oracle, an expert career and education advisor for software developers.

USER PROFILE:
- Domain: {domain}
- Experience Level: {profile.get("experience_level", "beginner")} ({exp_desc})
- Motivation: {profile.get("motivation", "career growth")}
- Learning Style: {profile.get("learning_style", "mixed")}
- Primary Challenge: {profile.get("challenge", "learning effectively")}
- Goal: {profile.get("goal", "improve skills")}
- Emerging Interest: {profile.get("interest", "current technologies")}
- Main Constraint: {profile.get("constraint", "time")}
- Time Commitment: {profile.get("commitment", "part_time")} ({commit_desc})
- Additional Context: {profile.get("additional_context", "None provided")}

RAW ANSWERS (for additional context):
{json.dumps(profile.get("all_answers", {}), indent=2)}

YOUR TASK:
Generate 2-3 personalized learning paths. Each path must contain a COMPLETE HIERARCHICAL STRUCTURE:

LEVEL DEFINITIONS (CRITICAL):
- Level 0: DOMAIN (1 per path) - The broad area of study (e.g., "Frontend Development", "React Ecosystem")
- Level 1: COURSE (3-6 per path) - A complete mini-course that can stand alone (e.g., "React Fundamentals", "State Management Patterns")
- Level 2: CHAPTER (3-6 per course) - Individual lessons/chapters within a course. These are CONCRETE, ACTIONABLE learning units.

CHAPTER NAMING CONVENTION (Level 2):
Chapters should be named like actual course chapters, for example:
- "Introduction to React Components"
- "Setting Up Your Development Environment"
- "Building Your First Interactive Form"
- "Understanding the Virtual DOM"
- "Implementing Authentication Flow"
- "Deploying to Production"

DO NOT name chapters as broad topics like "React Hooks" or "State Management" - those are COURSES (Level 1).
Chapters should be specific lessons a student can complete in 30-90 minutes.

RESPONSE FORMAT (valid JSON only):
{{
    "paths": [
        {{
            "id": "path-1",
            "name": "Descriptive path name",
            "description": "2-3 sentence description of this learning path",
            "nodes": [
                {{
                    "id": "node-1",
                    "name": "Frontend Development",
                    "description": "Master modern frontend technologies",
                    "level": 0,
                    "parent_id": null,
                    "difficulty": "beginner",
                    "estimated_hours": 40,
                    "order": 1,
                    "is_existing": false
                }},
                {{
                    "id": "node-2",
                    "name": "React Fundamentals",
                    "description": "Learn core React concepts and patterns",
                    "level": 1,
                    "parent_id": "node-1",
                    "difficulty": "beginner",
                    "estimated_hours": 10,
                    "order": 1,
                    "is_existing": false
                }},
                {{
                    "id": "node-3",
                    "name": "Introduction to JSX and Components",
                    "description": "Learn how to write JSX and create your first React components",
                    "level": 2,
                    "parent_id": "node-2",
                    "difficulty": "beginner",
                    "estimated_hours": 1.5,
                    "order": 1,
                    "is_existing": false
                }},
                {{
                    "id": "node-4",
                    "name": "Managing Component State with useState",
                    "description": "Master state management in functional components",
                    "level": 2,
                    "parent_id": "node-2",
                    "difficulty": "beginner",
                    "estimated_hours": 1.5,
                    "order": 2,
                    "is_existing": false
                }}
            ],
            "estimated_weeks": 12,
            "reasoning": "Personalized explanation of why this path matches their profile",
            "confidence": 0.85
        }}
    ],
    "overall_advice": "Brief personalized advice for their journey"
}}

GUIDELINES:
1. Each path: 1 domain (level 0) → 3-6 courses (level 1) → 3-6 chapters each (level 2)
2. Total chapters per path: 15-30 chapters for comprehensive learning
3. Chapter estimated_hours: 0.5-2 hours each (these are individual lessons)
4. Course estimated_hours: Sum of its chapters
5. Set is_existing: true ONLY if matching an existing node from the available list
6. Make paths specific to domain ({domain}) and experience ({profile.get("experience_level", "beginner")})
7. Use Google Search to ground recommendations in 2024-2025 industry trends
8. Chapter names must be SPECIFIC and ACTIONABLE (start with verbs like "Introduction to", "Building", "Implementing", "Understanding", "Deploying")

IMPORTANT: Respond ONLY with valid JSON, no markdown code blocks or extra text."""


def extract_json_from_llm_response(response_text: str) -> dict:
    """
    Robust JSON extraction from LLM responses.
    Handles markdown blocks, truncated strings, trailing commas, etc.
    """
    import re

    original_text = response_text

    # Step 1: Remove markdown code blocks
    if "```" in response_text:
        # Try to extract content between ```json and ```
        match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', response_text, re.DOTALL)
        if match:
            response_text = match.group(1).strip()
        else:
            # Just remove all ``` markers
            response_text = response_text.replace("```json", "").replace("```", "").strip()

    # Step 2: Find JSON object boundaries
    if not response_text.startswith("{"):
        start = response_text.find("{")
        if start != -1:
            response_text = response_text[start:]

    # Step 3: Try direct parse first
    try:
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        logger.warning(f"Direct JSON parse failed: {e}")

    # Step 4: Fix common LLM JSON issues
    fixed_text = response_text

    # Fix trailing commas before ] or }
    fixed_text = re.sub(r',(\s*[\]\}])', r'\1', fixed_text)

    # Fix missing commas between array elements or object properties
    fixed_text = re.sub(r'"\s*\n\s*"', '",\n"', fixed_text)
    fixed_text = re.sub(r'(\d)\s*\n\s*"', r'\1,\n"', fixed_text)
    fixed_text = re.sub(r'(true|false|null)\s*\n\s*"', r'\1,\n"', fixed_text)

    try:
        return json.loads(fixed_text)
    except json.JSONDecodeError as e:
        logger.warning(f"Fixed JSON parse failed: {e}")

    # Step 5: Try to find complete "paths" array even if rest is truncated
    # Look for pattern: {"paths": [...]}
    paths_match = re.search(r'"paths"\s*:\s*\[', response_text)
    if paths_match:
        # Find where the paths array starts
        start_pos = paths_match.end() - 1  # Position of [
        bracket_count = 0
        end_pos = start_pos

        for i in range(start_pos, len(response_text)):
            char = response_text[i]
            if char == '[':
                bracket_count += 1
            elif char == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    end_pos = i + 1
                    break

        if end_pos > start_pos:
            paths_array_text = response_text[start_pos:end_pos]
            # Fix the extracted array
            paths_array_text = re.sub(r',(\s*[\]\}])', r'\1', paths_array_text)

            try:
                paths_array = json.loads(paths_array_text)
                logger.info(f"Successfully extracted paths array with {len(paths_array)} paths")
                return {"paths": paths_array}
            except json.JSONDecodeError as e:
                logger.warning(f"Paths array extraction failed: {e}")

    # Step 6: Try to repair truncated JSON by completing it
    # Count unclosed braces and brackets
    brace_count = 0
    bracket_count = 0
    in_string = False
    escape_next = False

    for char in response_text:
        if escape_next:
            escape_next = False
            continue
        if char == '\\':
            escape_next = True
            continue
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
        elif char == '[':
            bracket_count += 1
        elif char == ']':
            bracket_count -= 1

    # If we have unclosed structures, try to close them
    if brace_count > 0 or bracket_count > 0:
        # Find last complete structure we can salvage
        # Remove the last incomplete element
        last_comma = response_text.rfind(',')
        if last_comma > 0:
            truncated = response_text[:last_comma]
            # Add closing brackets/braces
            closing = ']' * bracket_count + '}' * brace_count
            repaired = truncated + closing

            try:
                result = json.loads(repaired)
                logger.info(f"JSON repair succeeded by truncating and closing")
                return result
            except json.JSONDecodeError:
                pass

    # Step 7: Last resort - try to parse individual path objects
    path_objects = []
    path_pattern = r'\{\s*"id"\s*:\s*"path-\d+"[^}]*\}'

    # This is too simplistic for nested objects, skip it

    raise json.JSONDecodeError(f"Could not extract valid JSON from LLM response", original_text[:100], 0)


@app.route("/oracle/generate", methods=["POST"])
@tracer.wrap(service="oracle", resource="generate_paths_single_call")
def generate_paths_single_call():
    """
    Generate learning paths from complete user profile in a single call.

    Request body:
    {
        "domain": "frontend",
        "experience_level": "beginner",
        "motivation": "career_change",
        "learning_style": "project_based",
        "concerns": ["time", "job_market"],
        "challenge": "knowledge_gaps",
        "goal": "senior_role",
        "interest": "ai_integration",
        "constraint": "time",
        "commitment": "part_time",
        "additional_context": "I'm a designer wanting to code...",
        "all_answers": { ... }
    }
    """
    try:
        data = request.get_json() or {}

        # Validate required fields
        if not data.get("domain"):
            return jsonify({"error": "domain is required"}), 400
        if not data.get("experience_level"):
            return jsonify({"error": "experience_level is required"}), 400
        if not data.get("commitment"):
            return jsonify({"error": "commitment is required"}), 400

        client = get_genai_client()
        db = get_supabase_client()

        # Get available nodes for context
        nodes_result = db.table("map_nodes").select(
            "id,slug,name,node_type,domain_id,description,difficulty"
        ).limit(100).execute()
        available_nodes = nodes_result.data or []

        # Build comprehensive prompt
        system_prompt = build_comprehensive_prompt(data)

        # Add available nodes to prompt
        nodes_context = f"\n\nAVAILABLE LEARNING NODES IN PLATFORM:\n{json.dumps(available_nodes[:30], indent=2)}"

        user_prompt = f"""Based on this user's complete profile, generate 2-3 personalized learning paths.

Consider current job market trends and in-demand skills for {data.get("domain", "software development")} in 2024-2025.

If relevant nodes exist in the available list, include their IDs. For topics not yet in the platform, add them to forge_suggestions.

{nodes_context}

Generate the paths now. IMPORTANT: Return ONLY valid JSON, ensure all strings are properly terminated."""

        # Configure Google Search grounding
        google_search_tool = types.Tool(
            google_search=types.GoogleSearch()
        )

        # Use gemini-3-flash-preview model
        model_name = "gemini-3-flash-preview"

        # Generate response
        response = client.models.generate_content(
            model=model_name,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=[google_search_tool],
                temperature=0.7,
                max_output_tokens=10000,
            )
        )

        # Parse response using robust extraction
        response_text = response.text.strip()
        logger.info(f"Raw LLM response length: {len(response_text)}")
        logger.info(f"Response preview (first 500 chars): {response_text[:500]}")
        logger.info(f"Response preview (last 200 chars): {response_text[-200:]}")

        result = extract_json_from_llm_response(response_text)
        paths = result.get("paths", [])

        # Validate and enhance path structure
        for i, path in enumerate(paths):
            # Assign IDs to paths if not present
            if not path.get("id"):
                path["id"] = f"path-{i + 1}"

            # Ensure nodes array exists
            if not path.get("nodes"):
                path["nodes"] = []
                logger.warning(f"Path {path.get('id')} missing nodes array")

            # Ensure node_ids array exists
            if not path.get("node_ids"):
                path["node_ids"] = []

            # Ensure forge_suggestions array exists
            if not path.get("forge_suggestions"):
                path["forge_suggestions"] = []

            # Validate each node has required fields
            for j, node in enumerate(path.get("nodes", [])):
                if not node.get("id"):
                    node["id"] = f"{path['id']}-node-{j + 1}"
                if "level" not in node:
                    node["level"] = 1
                if "parent_id" not in node:
                    node["parent_id"] = None
                if "order" not in node:
                    node["order"] = j + 1
                if "is_existing" not in node:
                    node["is_existing"] = False

        # Log path stats for debugging
        for path in paths:
            node_count = len(path.get("nodes", []))
            logger.info(f"Path '{path.get('name')}' has {node_count} nodes")

        # Extract grounding metadata
        grounding_sources = None
        try:
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                    gm = candidate.grounding_metadata
                    grounding_sources = {
                        "search_queries": getattr(gm, 'search_entry_point', {}).get('rendered_content', '') if hasattr(gm, 'search_entry_point') else None,
                    }
        except Exception as e:
            logger.warning(f"Could not extract grounding metadata: {e}")

        return jsonify({
            "paths": paths,
            "overall_advice": result.get("overall_advice"),
            "metadata": {
                "model_used": model_name,
                "grounding_sources": grounding_sources,
            }
        })

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response: {e}")
        logger.error(f"Raw response text: {response_text[:500] if response_text else 'None'}")

        # Return error instead of fallback - let the client know AI generation failed
        return jsonify({
            "error": "Failed to parse AI response. Please try again.",
            "details": str(e),
            "raw_preview": response_text[:200] if response_text else None
        }), 500

    except Exception as e:
        logger.error(f"Error generating paths: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# LEGACY ENDPOINTS (for backward compatibility)
# =============================================================================

@app.route("/oracle/start", methods=["POST"])
@tracer.wrap(service="oracle", resource="start_session")
def start_session():
    """Start a new Oracle session."""
    data = request.get_json() or {}
    user_id = data.get("user_id")

    db = get_supabase_client()

    # Create new session
    session_data = {
        "user_id": user_id,
        "status": "in_progress",
        "conversation_history": [],
        "llm_questions": [],
        "llm_answers": [],
    }

    result = db.table("oracle_sessions").insert(session_data).execute()
    session = result.data[0] if result.data else None

    if not session:
        return jsonify({"error": "Failed to create session"}), 500

    # Record session creation (domain will be recorded after first answer)
    logger.info(f"Oracle session created: {session['id']}")

    # Return first static question
    return jsonify({
        "session_id": session["id"],
        "question_index": 0,
        "question": STATIC_QUESTIONS[0],
        "total_static_questions": len(STATIC_QUESTIONS),
    })


@app.route("/oracle/answer", methods=["POST"])
@tracer.wrap(service="oracle", resource="submit_answer")
def submit_answer():
    """Submit an answer and get next question."""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    answer = data.get("answer")
    question_index = data.get("question_index", 0)

    if not session_id or answer is None:
        return jsonify({"error": "Missing session_id or answer"}), 400

    db = get_supabase_client()

    # Get current session
    result = db.table("oracle_sessions").select("*").eq("id", session_id).execute()
    session = result.data[0] if result.data else None

    if not session:
        return jsonify({"error": "Session not found"}), 404

    # Update session with answer
    updates = {}

    if question_index < len(STATIC_QUESTIONS):
        # Static question answer
        question_id = STATIC_QUESTIONS[question_index]["id"]
        updates[f"{question_id}_answer"] = answer

        # Update conversation history
        history = session.get("conversation_history", [])
        history.append({
            "type": "static",
            "question_id": question_id,
            "answer": answer,
            "timestamp": datetime.utcnow().isoformat()
        })
        updates["conversation_history"] = history

        # Update session
        db.table("oracle_sessions").update(updates).eq("id", session_id).execute()

        # Return next static question or transition to LLM
        next_index = question_index + 1
        if next_index < len(STATIC_QUESTIONS):
            return jsonify({
                "session_id": session_id,
                "question_index": next_index,
                "question": STATIC_QUESTIONS[next_index],
                "phase": "static",
            })
        else:
            # Transition to LLM-generated questions
            # Refresh session data
            result = db.table("oracle_sessions").select("*").eq("id", session_id).execute()
            session = result.data[0]

            llm_response = generate_next_question(session)

            # Store LLM question
            llm_questions = session.get("llm_questions", [])
            llm_questions.append(llm_response)
            db.table("oracle_sessions").update({
                "llm_questions": llm_questions
            }).eq("id", session_id).execute()

            return jsonify({
                "session_id": session_id,
                "question_index": next_index,
                "question": llm_response,
                "phase": "llm",
            })
    else:
        # LLM question answer
        llm_answers = session.get("llm_answers", [])
        llm_answers.append(answer)

        history = session.get("conversation_history", [])
        history.append({
            "type": "llm",
            "answer": answer,
            "timestamp": datetime.utcnow().isoformat()
        })

        db.table("oracle_sessions").update({
            "llm_answers": llm_answers,
            "conversation_history": history
        }).eq("id", session_id).execute()

        # Refresh session
        result = db.table("oracle_sessions").select("*").eq("id", session_id).execute()
        session = result.data[0]

        # Generate next question or paths
        llm_response = generate_next_question(session)

        if llm_response.get("type") == "path_suggestion":
            # Get available nodes for path generation
            nodes_result = db.table("map_nodes").select("id,slug,name,node_type,domain_id,description").execute()
            available_nodes = nodes_result.data or []

            # Generate detailed paths
            paths = generate_learning_paths(session, available_nodes)

            # Store paths in database
            for path in paths:
                path_data = {
                    "session_id": session_id,
                    "name": path.get("name", "Learning Path"),
                    "description": path.get("description"),
                    "node_ids": path.get("node_ids", []),
                    "forge_suggestions": path.get("forge_suggestions", []),
                    "estimated_weeks": path.get("estimated_weeks"),
                    "reasoning": path.get("reasoning"),
                    "confidence_score": path.get("confidence", 0.8),
                }
                db.table("oracle_paths").insert(path_data).execute()

            # Update session status
            db.table("oracle_sessions").update({
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat()
            }).eq("id", session_id).execute()

            return jsonify({
                "session_id": session_id,
                "phase": "complete",
                "paths": paths,
            })
        else:
            # Store LLM question
            llm_questions = session.get("llm_questions", [])
            llm_questions.append(llm_response)
            db.table("oracle_sessions").update({
                "llm_questions": llm_questions
            }).eq("id", session_id).execute()

            return jsonify({
                "session_id": session_id,
                "question_index": question_index + 1,
                "question": llm_response,
                "phase": "llm",
            })


@app.route("/oracle/session/<session_id>", methods=["GET"])
@tracer.wrap(service="oracle", resource="get_session")
def get_session(session_id: str):
    """Get session details."""
    db = get_supabase_client()

    result = db.table("oracle_sessions").select("*").eq("id", session_id).execute()
    session = result.data[0] if result.data else None

    if not session:
        return jsonify({"error": "Session not found"}), 404

    # Get associated paths if completed
    paths = []
    if session.get("status") == "completed":
        paths_result = db.table("oracle_paths").select("*").eq("session_id", session_id).execute()
        paths = paths_result.data or []

    return jsonify({
        "session": session,
        "paths": paths,
    })


@app.route("/oracle/paths/<session_id>/select", methods=["POST"])
@tracer.wrap(service="oracle", resource="select_path")
def select_path(session_id: str):
    """Select a generated path."""
    data = request.get_json() or {}
    path_id = data.get("path_id")

    if not path_id:
        return jsonify({"error": "Missing path_id"}), 400

    db = get_supabase_client()
    path = None

    # Check if path_id is a valid UUID (legacy flow)
    is_uuid = False
    try:
        uuid.UUID(str(path_id))
        is_uuid = True
    except ValueError:
        is_uuid = False

    try:
        if is_uuid:
            # Legacy flow: Update session with selected path (only if path_id is valid UUID)
            db.table("oracle_sessions").update({
                "selected_path_id": path_id
            }).eq("id", session_id).execute()

            # Get path details from oracle_paths table
            path_result = db.table("oracle_paths").select("*").eq("id", path_id).execute()
            path = path_result.data[0] if path_result.data else None
        else:
            # New flow: path_id is a string like "path-1", just acknowledge selection
            # The path data is already in the frontend from the generate response
            logger.info(f"Path selected (new flow): session={session_id}, path={path_id}")

    except Exception as e:
        logger.warning(f"Error updating session: {e}")
        # Continue anyway - selection is handled client-side

    return jsonify({
        "success": True,
        "path": path,
        "path_id": path_id,
    })


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
