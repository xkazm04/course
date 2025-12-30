"""
Content Generator Cloud Function
Generates course and chapter content for map nodes using Gemini with Google Search grounding

Instrumented with Datadog for comprehensive LLM observability:
- APM traces for all endpoints
- Custom metrics for token usage, latency, cost
- Job tracking metrics
- Business metrics for course creation
"""

import os
import sys
import json
import logging
import time
from typing import Optional
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from supabase import create_client, Client
from pydantic import BaseModel, Field
from ddtrace import tracer

# Add shared module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from shared.metrics import ContentGeneratorMetrics

from prompts import COURSE_GENERATION_PROMPT, CHAPTERS_ONLY_PROMPT, DESCRIPTION_GENERATION_PROMPT, CHAPTER_CONTENT_PROMPT
from generator import ContentGenerator
from path_acceptance import PathAcceptanceService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Datadog metrics
metrics = ContentGeneratorMetrics()

# Lazy-init clients
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


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class GenerateRequest(BaseModel):
    """Request model for content generation."""
    node_id: str
    generation_type: str = Field(default="full_course", pattern="^(full_course|chapters_only|description|learning_outcomes)$")
    options: Optional[dict] = None


class JobStatusResponse(BaseModel):
    """Response model for job status."""
    job_id: str
    status: str
    progress_percent: int = 0
    progress_message: Optional[str] = None
    generated_content: Optional[dict] = None
    generated_course_id: Optional[str] = None
    error_message: Optional[str] = None


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "content-generator",
        "timestamp": datetime.utcnow().isoformat()
    })


@app.route("/content/generate", methods=["POST"])
@tracer.wrap(service="content-generator", resource="create_job")
def create_generation_job():
    """
    Create a content generation job for a map node.

    Request body:
    {
        "node_id": "uuid",
        "generation_type": "full_course" | "chapters_only" | "description" | "learning_outcomes",
        "options": { ... }
    }
    """
    try:
        data = request.get_json() or {}
        node_id = data.get("node_id")
        generation_type = data.get("generation_type", "full_course")
        options = data.get("options", {})

        if not node_id:
            return jsonify({"error": "node_id is required"}), 400

        db = get_supabase_client()

        # Validate node exists and is depth 0 or 1
        node_result = db.table("map_nodes").select("*").eq("id", node_id).execute()
        if not node_result.data:
            return jsonify({"error": "Node not found"}), 404

        node = node_result.data[0]
        if node.get("depth", 0) > 1:
            return jsonify({
                "error": "Content generation is only available for depth 0-1 nodes (domains and topics)"
            }), 400

        # Check if node already has a course
        if node.get("course_id"):
            return jsonify({
                "error": "This node already has a course. Delete existing course first.",
                "existing_course_id": node["course_id"]
            }), 409

        # Check for existing active job
        existing_job = db.table("content_generation_jobs").select("id,status").eq(
            "node_id", node_id
        ).in_("status", ["pending", "processing"]).execute()

        if existing_job.data:
            return jsonify({
                "error": "A content generation job is already active for this node",
                "existing_job_id": existing_job.data[0]["id"],
                "status": existing_job.data[0]["status"]
            }), 409

        # Get domain info for context
        domain_id = node.get("domain_id")
        domain_result = db.table("domains").select("name,description").eq("id", domain_id).execute()
        domain = domain_result.data[0] if domain_result.data else {"name": "Unknown", "description": ""}

        # Get sibling nodes for context
        siblings_result = db.table("map_nodes").select("name,description").eq(
            "parent_id", node.get("parent_id")
        ).neq("id", node_id).limit(10).execute()
        siblings = siblings_result.data or []

        # Get existing courses in domain to avoid overlap
        existing_courses_result = db.table("courses").select(
            "title,description"
        ).eq("domain_id", domain_id).limit(20).execute()
        existing_courses = existing_courses_result.data or []

        # Build prompt context
        prompt_context = {
            "node": {
                "id": node["id"],
                "name": node.get("name", ""),
                "description": node.get("description", ""),
                "depth": node.get("depth", 0),
                "node_type": node.get("node_type", "topic"),
                "difficulty": node.get("difficulty", "beginner"),
                "estimated_hours": node.get("estimated_hours", 20),
            },
            "domain": domain,
            "siblings": siblings,
            "existing_courses": existing_courses,
            "options": options,
        }

        # Create job record
        job_data = {
            "node_id": node_id,
            "generation_type": generation_type,
            "status": "pending",
            "prompt_context": prompt_context,
            "progress_percent": 0,
            "progress_message": "Job created, waiting to start...",
        }

        job_result = db.table("content_generation_jobs").insert(job_data).execute()
        if not job_result.data:
            return jsonify({"error": "Failed to create job"}), 500

        job = job_result.data[0]

        # Record job start metric
        metrics.record_job_started(generation_type, node_id)

        # Start async generation (in production, this would be a background task)
        # For Cloud Run, we process synchronously but return quickly
        _start_generation(job["id"])

        return jsonify({
            "job_id": job["id"],
            "status": "pending",
            "estimated_time_seconds": 60,
            "message": "Content generation started. Poll /content/status/{job_id} for updates."
        }), 202

    except Exception as e:
        logger.error(f"Error creating generation job: {e}")
        return jsonify({"error": str(e)}), 500


def _start_generation(job_id: str):
    """Start the content generation process."""
    try:
        generator = ContentGenerator(
            genai_client=get_genai_client(),
            supabase_client=get_supabase_client()
        )
        generator.process_job(job_id)
    except Exception as e:
        logger.error(f"Error in generation: {e}")
        db = get_supabase_client()
        db.table("content_generation_jobs").update({
            "status": "failed",
            "error_message": str(e),
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", job_id).execute()


@app.route("/content/status/<job_id>", methods=["GET"])
@tracer.wrap(service="content-generator", resource="get_job_status")
def get_job_status(job_id: str):
    """
    Get the status of a content generation job.

    Returns job status, progress, and generated content when complete.
    """
    try:
        db = get_supabase_client()

        job_result = db.table("content_generation_jobs").select("*").eq("id", job_id).execute()
        if not job_result.data:
            return jsonify({"error": "Job not found"}), 404

        job = job_result.data[0]

        response = {
            "job_id": job["id"],
            "status": job["status"],
            "progress_percent": job.get("progress_percent", 0),
            "progress_message": job.get("progress_message"),
            "created_at": job.get("created_at"),
        }

        if job["status"] == "completed":
            response["generated_content"] = job.get("generated_content")
            response["generated_course_id"] = job.get("generated_course_id")
            response["completed_at"] = job.get("completed_at")
            response["metadata"] = {
                "model_used": job.get("model_used"),
                "tokens_used": job.get("tokens_used"),
                "latency_ms": job.get("latency_ms"),
                "grounding_sources": job.get("grounding_sources"),
            }

        if job["status"] == "failed":
            response["error_message"] = job.get("error_message")
            response["completed_at"] = job.get("completed_at")

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/content/jobs", methods=["GET"])
@tracer.wrap(service="content-generator", resource="list_jobs")
def list_jobs():
    """
    List recent content generation jobs.

    Query params:
    - node_id: Filter by node
    - status: Filter by status
    - limit: Max results (default 20)
    """
    try:
        db = get_supabase_client()

        node_id = request.args.get("node_id")
        status = request.args.get("status")
        limit = int(request.args.get("limit", 20))

        query = db.table("content_generation_jobs").select(
            "id,node_id,generation_type,status,progress_percent,progress_message,created_at,completed_at"
        ).order("created_at", desc=True).limit(limit)

        if node_id:
            query = query.eq("node_id", node_id)
        if status:
            query = query.eq("status", status)

        result = query.execute()

        return jsonify({
            "jobs": result.data or [],
            "count": len(result.data or [])
        })

    except Exception as e:
        logger.error(f"Error listing jobs: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/content/retry/<job_id>", methods=["POST"])
@tracer.wrap(service="content-generator", resource="retry_job")
def retry_job(job_id: str):
    """Retry a failed content generation job."""
    try:
        db = get_supabase_client()

        job_result = db.table("content_generation_jobs").select("*").eq("id", job_id).execute()
        if not job_result.data:
            return jsonify({"error": "Job not found"}), 404

        job = job_result.data[0]

        if job["status"] != "failed":
            return jsonify({"error": "Can only retry failed jobs"}), 400

        # Reset job status
        db.table("content_generation_jobs").update({
            "status": "pending",
            "progress_percent": 0,
            "progress_message": "Retrying...",
            "error_message": None,
            "generated_content": None,
            "generated_course_id": None,
            "started_at": None,
            "completed_at": None,
        }).eq("id", job_id).execute()

        # Start generation again
        _start_generation(job_id)

        return jsonify({
            "job_id": job_id,
            "status": "pending",
            "message": "Job retry started"
        })

    except Exception as e:
        logger.error(f"Error retrying job: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# PATH ACCEPTANCE ENDPOINTS
# =============================================================================

@app.route("/api/path/accept", methods=["POST"])
@tracer.wrap(service="content-generator", resource="accept_path")
def accept_path():
    """
    Accept an Oracle learning path and create nodes + generation jobs.

    Request body:
    {
        "path": {
            "id": "path-1",
            "name": "Path Name",
            "nodes": [
                { "id": "node-1", "name": "Topic", "level": 1, "is_existing": false },
                { "id": "node-2", "name": "Chapter", "level": 2, "parent_id": "node-1", "is_existing": false }
            ]
        },
        "domain": "frontend"
    }
    """
    try:
        data = request.get_json() or {}
        path_data = data.get("path")
        domain = data.get("domain")

        if not path_data:
            return jsonify({"error": "path is required"}), 400
        if not domain:
            return jsonify({"error": "domain is required"}), 400

        service = PathAcceptanceService(get_supabase_client())
        result = service.accept_path(path_data, domain)

        # Start generation for all jobs in background
        for job in result.get("generation_jobs", []):
            try:
                _start_generation(job["job_id"])
            except Exception as e:
                logger.error(f"Failed to start generation for job {job['job_id']}: {e}")

        return jsonify(result), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error accepting path: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/content/status/batch", methods=["POST"])
@tracer.wrap(service="content-generator", resource="batch_status")
def get_batch_status():
    """
    Get status of all jobs in a batch.

    Request body:
    {
        "batch_id": "uuid"
    }
    """
    try:
        data = request.get_json() or {}
        batch_id = data.get("batch_id")

        if not batch_id:
            return jsonify({"error": "batch_id is required"}), 400

        service = PathAcceptanceService(get_supabase_client())
        result = service.get_batch_status(batch_id)

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error getting batch status: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/nodes/status", methods=["GET"])
@tracer.wrap(service="content-generator", resource="nodes_status")
def get_nodes_status():
    """
    Get generation status for multiple map nodes.

    Query params:
    - ids: Comma-separated list of node UUIDs
    """
    try:
        ids_param = request.args.get("ids", "")
        if not ids_param:
            return jsonify({"error": "ids parameter is required"}), 400

        node_ids = [id.strip() for id in ids_param.split(",") if id.strip()]
        if not node_ids:
            return jsonify({"error": "No valid node IDs provided"}), 400

        service = PathAcceptanceService(get_supabase_client())
        result = service.get_nodes_status(node_ids)

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error getting nodes status: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
