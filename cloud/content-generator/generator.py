"""
Content Generator Logic
Handles LLM calls and database operations for course content generation

Instrumented with Datadog for comprehensive LLM observability.
"""

import os
import sys
import json
import logging
import time
from datetime import datetime
from typing import Optional

from google import genai
from google.genai import types
from supabase import Client
from ddtrace import tracer

# Add shared module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from shared.metrics import ContentGeneratorMetrics, estimate_tokens

from prompts import COURSE_GENERATION_PROMPT, CHAPTERS_ONLY_PROMPT, DESCRIPTION_GENERATION_PROMPT, CHAPTER_CONTENT_PROMPT

logger = logging.getLogger(__name__)

# Initialize metrics
metrics = ContentGeneratorMetrics()


class ContentGenerator:
    """Generates course content using Gemini with Google Search grounding."""

    def __init__(self, genai_client: genai.Client, supabase_client: Client):
        self.genai = genai_client
        self.db = supabase_client
        self.model = "gemini-2.0-flash-exp"

    @tracer.wrap(service="content-generator", resource="process_job")
    def process_job(self, job_id: str) -> None:
        """Process a content generation job."""
        start_time = time.time()
        generation_type = "full_course"

        try:
            # Get job details
            job_result = self.db.table("content_generation_jobs").select("*").eq("id", job_id).execute()
            if not job_result.data:
                raise ValueError(f"Job {job_id} not found")

            job = job_result.data[0]
            context = job.get("prompt_context", {})
            generation_type = job.get("generation_type", "full_course")

            # Update status to processing
            self._update_job(job_id, {
                "status": "processing",
                "started_at": datetime.utcnow().isoformat(),
                "progress_percent": 10,
                "progress_message": "Preparing content generation..."
            })

            # Generate content based on type
            if generation_type == "full_course":
                result = self._generate_full_course(job_id, context)
            elif generation_type == "chapters_only":
                result = self._generate_chapters_only(job_id, context)
            elif generation_type == "description":
                result = self._generate_description(job_id, context)
            elif generation_type == "chapter_content":
                result = self._generate_chapter_content(job_id, context)
            else:
                raise ValueError(f"Unknown generation type: {generation_type}")

            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)

            # Mark as completed
            self._update_job(job_id, {
                "status": "completed",
                "progress_percent": 100,
                "progress_message": "Content generation complete!",
                "generated_content": result.get("content"),
                "generated_course_id": result.get("course_id"),
                "tokens_used": result.get("tokens_used"),
                "latency_ms": latency_ms,
                "grounding_sources": result.get("grounding_sources"),
                "completed_at": datetime.utcnow().isoformat()
            })

            # Record successful job completion metrics
            metrics.record_job_completed(
                generation_type=generation_type,
                duration_ms=latency_ms,
                status="completed",
                tokens_used=result.get("tokens_used", 0)
            )

            logger.info(f"Job {job_id} completed in {latency_ms}ms, tokens: {result.get('tokens_used', 0)}")

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"Error processing job {job_id}: {e}")

            # Record failed job metrics
            metrics.record_job_completed(
                generation_type=generation_type,
                duration_ms=latency_ms,
                status="failed",
                tokens_used=0
            )

            self._update_job(job_id, {
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.utcnow().isoformat()
            })
            raise

    def _update_job(self, job_id: str, updates: dict) -> None:
        """Update job record."""
        self.db.table("content_generation_jobs").update(updates).eq("id", job_id).execute()

    @tracer.wrap(service="content-generator", resource="generate_full_course")
    def _generate_full_course(self, job_id: str, context: dict) -> dict:
        """Generate a complete course with chapters."""
        llm_start_time = time.time()
        node = context.get("node", {})
        domain = context.get("domain", {})
        siblings = context.get("siblings", [])
        existing_courses = context.get("existing_courses", [])
        domain_name = domain.get("name", "unknown")

        # Build prompt
        prompt = COURSE_GENERATION_PROMPT.format(
            node_name=node.get("name", ""),
            domain_name=domain_name,
            node_type=node.get("node_type", "topic"),
            depth=node.get("depth", 0),
            difficulty=node.get("difficulty", "beginner"),
            estimated_hours=node.get("estimated_hours", 20),
            description=node.get("description", ""),
            existing_courses=json.dumps(existing_courses, indent=2) if existing_courses else "None",
            sibling_topics=json.dumps([s.get("name") for s in siblings]) if siblings else "None"
        )

        input_tokens = estimate_tokens(prompt)

        self._update_job(job_id, {
            "progress_percent": 20,
            "progress_message": "Generating course structure with AI..."
        })

        try:
            # Call Gemini with Google Search grounding
            response, grounding_sources = self._call_gemini(prompt)
            output_tokens = estimate_tokens(response)
            llm_latency_ms = (time.time() - llm_start_time) * 1000

            # Record LLM request metrics
            metrics.record_llm_request(
                operation="generate_full_course",
                model=self.model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=llm_latency_ms,
                success=True,
                grounding_used=True,
                extra_tags={"domain": domain_name}
            )

            self._update_job(job_id, {
                "progress_percent": 50,
                "progress_message": "Parsing generated content..."
            })

            # Parse response
            content = self._parse_json_response(response)

            if not content or "course" not in content:
                metrics.record_parse_error("generate_full_course", "missing 'course' key")
                raise ValueError("Invalid response format: missing 'course' key")

            self._update_job(job_id, {
                "progress_percent": 60,
                "progress_message": "Creating course in database..."
            })

            # Create course record
            course_data = content["course"]
            course_record = {
                "title": course_data.get("title", node.get("name")),
                "subtitle": course_data.get("subtitle"),
                "description": course_data.get("description"),
                "long_description": course_data.get("long_description"),
                "what_you_will_learn": course_data.get("what_you_will_learn", []),
                "requirements": course_data.get("requirements", []),
                "target_audience": course_data.get("target_audience", []),
                "difficulty": course_data.get("difficulty", node.get("difficulty", "beginner")),
                "estimated_hours": course_data.get("estimated_hours", node.get("estimated_hours", 20)),
                "domain_id": node.get("domain_id") if "domain_id" in node else domain.get("id"),
                "status": "draft",
            }

            # Fetch domain_id from node if not in context
            if not course_record.get("domain_id"):
                node_result = self.db.table("map_nodes").select("domain_id").eq("id", node.get("id")).execute()
                if node_result.data:
                    course_record["domain_id"] = node_result.data[0].get("domain_id")

            course_result = self.db.table("courses").insert(course_record).execute()
            if not course_result.data:
                raise ValueError("Failed to create course record")

            course = course_result.data[0]
            course_id = course["id"]

            self._update_job(job_id, {
                "progress_percent": 75,
                "progress_message": "Creating chapters..."
            })

            # Create chapter records
            chapters = content.get("chapters", [])
            for i, chapter_data in enumerate(chapters):
                chapter_record = {
                    "course_id": course_id,
                    "title": chapter_data.get("title", f"Chapter {i + 1}"),
                    "description": chapter_data.get("description"),
                    "estimated_minutes": chapter_data.get("estimated_minutes", 45),
                    "xp_reward": chapter_data.get("xp_reward", 100),
                    "sort_order": chapter_data.get("sort_order", i + 1),
                }
                self.db.table("chapters").insert(chapter_record).execute()

            self._update_job(job_id, {
                "progress_percent": 90,
                "progress_message": "Linking course to map node..."
            })

            # Update map node with course_id
            self.db.table("map_nodes").update({
                "course_id": course_id
            }).eq("id", node.get("id")).execute()

            # Record course creation business metric
            metrics.record_course_created(
                domain_name=domain_name,
                difficulty=course_record.get("difficulty", "beginner"),
                num_chapters=len(chapters)
            )

            total_tokens = input_tokens + output_tokens
            return {
                "content": content,
                "course_id": course_id,
                "tokens_used": total_tokens,
                "grounding_sources": grounding_sources
            }

        except json.JSONDecodeError as e:
            llm_latency_ms = (time.time() - llm_start_time) * 1000
            metrics.record_parse_error("generate_full_course", str(e))
            metrics.record_llm_request(
                operation="generate_full_course",
                model=self.model,
                input_tokens=input_tokens,
                output_tokens=0,
                latency_ms=llm_latency_ms,
                success=False,
                error_type="JSONDecodeError"
            )
            raise

        except Exception as e:
            llm_latency_ms = (time.time() - llm_start_time) * 1000
            metrics.record_llm_request(
                operation="generate_full_course",
                model=self.model,
                input_tokens=input_tokens,
                output_tokens=0,
                latency_ms=llm_latency_ms,
                success=False,
                error_type=type(e).__name__
            )
            raise

    @tracer.wrap(service="content-generator", resource="generate_chapters_only")
    def _generate_chapters_only(self, job_id: str, context: dict) -> dict:
        """Generate only chapter structure for existing course."""
        node = context.get("node", {})
        domain = context.get("domain", {})

        # Get existing chapters for context
        existing_chapters = []
        if node.get("course_id"):
            chapters_result = self.db.table("chapters").select(
                "title,description"
            ).eq("course_id", node["course_id"]).execute()
            existing_chapters = chapters_result.data or []

        prompt = CHAPTERS_ONLY_PROMPT.format(
            node_name=node.get("name", ""),
            domain_name=domain.get("name", ""),
            difficulty=node.get("difficulty", "beginner"),
            estimated_hours=node.get("estimated_hours", 20),
            description=node.get("description", ""),
            existing_chapters=json.dumps(existing_chapters) if existing_chapters else "None"
        )

        self._update_job(job_id, {
            "progress_percent": 30,
            "progress_message": "Generating chapter structure..."
        })

        response, grounding_sources = self._call_gemini(prompt)
        content = self._parse_json_response(response)

        if not content or "chapters" not in content:
            raise ValueError("Invalid response format: missing 'chapters' key")

        return {
            "content": content,
            "course_id": node.get("course_id"),
            "tokens_used": self._estimate_tokens(prompt, response),
            "grounding_sources": grounding_sources
        }

    @tracer.wrap(service="content-generator", resource="generate_description")
    def _generate_description(self, job_id: str, context: dict) -> dict:
        """Generate expanded description for a node."""
        node = context.get("node", {})
        domain = context.get("domain", {})

        prompt = DESCRIPTION_GENERATION_PROMPT.format(
            node_name=node.get("name", ""),
            domain_name=domain.get("name", ""),
            description=node.get("description", "")
        )

        self._update_job(job_id, {
            "progress_percent": 30,
            "progress_message": "Generating description..."
        })

        response, grounding_sources = self._call_gemini(prompt)
        content = self._parse_json_response(response)

        if not content or "long_description" not in content:
            raise ValueError("Invalid response format: missing 'long_description' key")

        # Update node or course with new description
        if node.get("course_id"):
            self.db.table("courses").update({
                "long_description": content.get("long_description"),
                "what_you_will_learn": content.get("what_you_will_learn", []),
                "requirements": content.get("prerequisites", [])
            }).eq("id", node["course_id"]).execute()

        return {
            "content": content,
            "course_id": node.get("course_id"),
            "tokens_used": self._estimate_tokens(prompt, response),
            "grounding_sources": grounding_sources
        }

    @tracer.wrap(service="content-generator", resource="generate_chapter_content")
    def _generate_chapter_content(self, job_id: str, context: dict) -> dict:
        """Generate rich content for a chapter (level 2 node)."""
        llm_start_time = time.time()
        node = context.get("node", {})
        domain = context.get("domain", {})
        domain_name = domain.get("name", "unknown")

        # Get parent course info
        parent_course = None
        course_name = node.get("name", "Unknown Course")
        if node.get("parent_id"):
            parent_result = self.db.table("map_nodes").select(
                "name,course_id"
            ).eq("id", node["parent_id"]).execute()
            if parent_result.data:
                course_name = parent_result.data[0].get("name", course_name)

        # Get sibling chapters for context
        sibling_chapters = []
        if node.get("parent_id"):
            siblings_result = self.db.table("map_nodes").select(
                "name,description"
            ).eq("parent_id", node["parent_id"]).neq("id", node.get("id")).limit(10).execute()
            sibling_chapters = siblings_result.data or []

        # Determine primary language based on domain
        primary_language = self._get_primary_language(domain_name)

        # Build prompt
        prompt = CHAPTER_CONTENT_PROMPT.format(
            chapter_name=node.get("name", ""),
            course_name=course_name,
            domain_name=domain_name,
            difficulty=node.get("difficulty", "beginner"),
            estimated_minutes=int(node.get("estimated_hours", 1) * 60),
            prerequisites=json.dumps(node.get("prerequisites", [])) if node.get("prerequisites") else "None specified",
            sibling_chapters=json.dumps([s.get("name") for s in sibling_chapters]) if sibling_chapters else "None",
            primary_language=primary_language
        )

        input_tokens = estimate_tokens(prompt)

        self._update_job(job_id, {
            "progress_percent": 20,
            "progress_message": "Generating chapter content with AI..."
        })

        try:
            # Call Gemini with Google Search grounding
            response, grounding_sources = self._call_gemini(prompt)
            output_tokens = estimate_tokens(response)
            llm_latency_ms = (time.time() - llm_start_time) * 1000

            # Record LLM request metrics
            metrics.record_llm_request(
                operation="generate_chapter_content",
                model=self.model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency_ms=llm_latency_ms,
                success=True,
                grounding_used=True,
                extra_tags={"domain": domain_name}
            )

            self._update_job(job_id, {
                "progress_percent": 50,
                "progress_message": "Parsing generated content..."
            })

            # Parse response
            content = self._parse_json_response(response)

            # Validate required fields
            required_fields = ["explanation", "code_examples", "benefits", "caveats"]
            missing = [f for f in required_fields if f not in content]
            if missing:
                metrics.record_parse_error("generate_chapter_content", f"missing fields: {missing}")
                raise ValueError(f"Invalid response format: missing fields {missing}")

            self._update_job(job_id, {
                "progress_percent": 70,
                "progress_message": "Saving chapter content..."
            })

            # Save content to sections table
            section_content = {
                "type": "chapter_content",
                "version": "1.0",
                "explanation": content.get("explanation", ""),
                "code_examples": content.get("code_examples", []),
                "benefits": content.get("benefits", []),
                "alternatives": content.get("alternatives", []),
                "caveats": content.get("caveats", []),
                "videos": content.get("videos", []),
                "resources": content.get("resources", []),
                "homework": content.get("homework", [])
            }

            # Find or create section for this chapter
            # First, find the chapter record
            chapter_result = self.db.table("chapters").select("id").eq(
                "title", node.get("name")
            ).execute()

            if chapter_result.data:
                chapter_id = chapter_result.data[0]["id"]

                # Create section with content
                section_data = {
                    "chapter_id": chapter_id,
                    "title": node.get("name"),
                    "content_json": section_content,
                    "sort_order": 1
                }

                self.db.table("sections").insert(section_data).execute()

            self._update_job(job_id, {
                "progress_percent": 90,
                "progress_message": "Updating node status..."
            })

            # Update map_node with generated content summary
            self.db.table("map_nodes").update({
                "generation_status": "ready",
                "description": content.get("explanation", "")[:500] if content.get("explanation") else node.get("description")
            }).eq("id", node.get("id")).execute()

            total_tokens = input_tokens + output_tokens
            return {
                "content": content,
                "course_id": None,  # Chapter content doesn't create a course
                "tokens_used": total_tokens,
                "grounding_sources": grounding_sources
            }

        except json.JSONDecodeError as e:
            llm_latency_ms = (time.time() - llm_start_time) * 1000
            metrics.record_parse_error("generate_chapter_content", str(e))
            metrics.record_llm_request(
                operation="generate_chapter_content",
                model=self.model,
                input_tokens=input_tokens,
                output_tokens=0,
                latency_ms=llm_latency_ms,
                success=False,
                error_type="JSONDecodeError"
            )
            raise

        except Exception as e:
            llm_latency_ms = (time.time() - llm_start_time) * 1000
            metrics.record_llm_request(
                operation="generate_chapter_content",
                model=self.model,
                input_tokens=input_tokens,
                output_tokens=0,
                latency_ms=llm_latency_ms,
                success=False,
                error_type=type(e).__name__
            )
            raise

    def _get_primary_language(self, domain_name: str) -> str:
        """Get the primary programming language for a domain."""
        domain_languages = {
            "frontend": "typescript",
            "backend": "python",
            "fullstack": "typescript",
            "mobile": "typescript",
            "devops": "yaml",
            "data": "python",
            "ai": "python",
            "security": "python",
            "blockchain": "solidity",
            "game": "csharp",
        }
        domain_lower = domain_name.lower()
        for key, lang in domain_languages.items():
            if key in domain_lower:
                return lang
        return "typescript"  # Default

    def _call_gemini(self, prompt: str) -> tuple[str, Optional[dict]]:
        """Call Gemini API with Google Search grounding."""
        google_search_tool = types.Tool(
            google_search=types.GoogleSearch()
        )

        response = self.genai.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[google_search_tool],
                temperature=0.7,
                max_output_tokens=4096,
            )
        )

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

        return response.text, grounding_sources

    def _parse_json_response(self, response_text: str) -> dict:
        """Parse JSON from LLM response, handling markdown code blocks."""
        text = response_text.strip()

        # Handle markdown code blocks
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first line (```json or ```)
            lines = lines[1:]
            # Find closing ```
            for i, line in enumerate(lines):
                if line.strip() == "```":
                    lines = lines[:i]
                    break
            text = "\n".join(lines)

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Raw response: {response_text[:500]}")
            raise ValueError(f"Invalid JSON in LLM response: {e}")

    def _estimate_tokens(self, prompt: str, response: str) -> int:
        """Rough token estimation (4 chars per token average)."""
        return (len(prompt) + len(response)) // 4
