"""
Path Acceptance Logic
Handles accepting Oracle learning paths and creating map nodes, courses, chapters, and generation jobs
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

from supabase import Client
from ddtrace import tracer

logger = logging.getLogger(__name__)


class PathAcceptanceService:
    """Handles the acceptance of Oracle-generated learning paths."""

    def __init__(self, supabase_client: Client):
        self.db = supabase_client

    @tracer.wrap(service="content-generator", resource="accept_path")
    def accept_path(self, path_data: dict, domain: str) -> dict:
        """
        Accept an Oracle learning path and create all necessary records.

        Args:
            path_data: The Oracle path with nodes
            domain: Domain ID or name

        Returns:
            dict with batch_id, created_nodes, generation_jobs, skipped_nodes
        """
        batch_id = str(uuid.uuid4())
        path_id = path_data.get("id", f"path-{batch_id[:8]}")
        path_name = path_data.get("name", "Unnamed Path")
        nodes = path_data.get("nodes", [])

        # Get domain info
        domain_info = self._get_domain_info(domain)
        if not domain_info:
            raise ValueError(f"Domain not found: {domain}")

        domain_id = domain_info["id"]
        domain_name = domain_info.get("name", "Unknown")

        created_nodes = []
        generation_jobs = []
        skipped_nodes = []

        # Track mapping from path_node_id to created map_node_id
        node_id_mapping = {}

        # Process nodes in order (level 1 first, then level 2)
        level_1_nodes = [n for n in nodes if n.get("level") == 1]
        level_2_nodes = [n for n in nodes if n.get("level") == 2]

        # Process level 1 nodes (courses)
        for node in level_1_nodes:
            if node.get("is_existing", False):
                skipped_nodes.append({
                    "path_node_id": node.get("id"),
                    "name": node.get("name"),
                    "reason": "already_exists"
                })
                # Try to find existing node to map IDs
                existing = self._find_existing_node(node.get("name"), domain_id, 1)
                if existing:
                    node_id_mapping[node.get("id")] = existing["id"]
                continue

            result = self._create_course_node(
                node=node,
                domain_id=domain_id,
                domain_name=domain_name,
                batch_id=batch_id,
                path_id=path_id
            )

            created_nodes.append(result["created_node"])
            node_id_mapping[node.get("id")] = result["map_node_id"]

            # Level 1 nodes (courses) don't get content generation jobs
            # Content is generated for chapters (level 2)

        # Process level 2 nodes (chapters)
        for node in level_2_nodes:
            if node.get("is_existing", False):
                skipped_nodes.append({
                    "path_node_id": node.get("id"),
                    "name": node.get("name"),
                    "reason": "already_exists"
                })
                continue

            # Get parent map_node_id from mapping
            parent_path_id = node.get("parent_id")
            parent_map_node_id = node_id_mapping.get(parent_path_id)

            if not parent_map_node_id:
                logger.warning(f"Parent node not found for {node.get('name')}, skipping")
                skipped_nodes.append({
                    "path_node_id": node.get("id"),
                    "name": node.get("name"),
                    "reason": "parent_not_found"
                })
                continue

            result = self._create_chapter_node(
                node=node,
                parent_map_node_id=parent_map_node_id,
                domain_id=domain_id,
                domain_name=domain_name,
                batch_id=batch_id,
                path_id=path_id
            )

            created_nodes.append(result["created_node"])
            node_id_mapping[node.get("id")] = result["map_node_id"]

            # Create generation job for chapter content
            job = self._create_generation_job(
                map_node_id=result["map_node_id"],
                node_name=node.get("name"),
                domain_id=domain_id,
                batch_id=batch_id,
                path_id=path_id,
                path_node_id=node.get("id")
            )
            generation_jobs.append(job)

        return {
            "success": True,
            "batch_id": batch_id,
            "path_id": path_id,
            "path_name": path_name,
            "created_nodes": created_nodes,
            "generation_jobs": generation_jobs,
            "skipped_nodes": skipped_nodes,
            "total_new_nodes": len(created_nodes),
            "total_jobs": len(generation_jobs)
        }

    def _get_domain_info(self, domain: str) -> Optional[dict]:
        """Get domain info by ID or name."""
        # Try by ID first
        result = self.db.table("domains").select("*").eq("id", domain).execute()
        if result.data:
            return result.data[0]

        # Try by name (slug/key)
        result = self.db.table("domains").select("*").eq("name", domain).execute()
        if result.data:
            return result.data[0]

        # Try by slug if there's a slug column
        try:
            result = self.db.table("domains").select("*").eq("slug", domain).execute()
            if result.data:
                return result.data[0]
        except Exception:
            pass

        return None

    def _find_existing_node(self, name: str, domain_id: str, depth: int) -> Optional[dict]:
        """Find an existing map node by name and domain."""
        result = self.db.table("map_nodes").select("id,name").eq(
            "name", name
        ).eq("domain_id", domain_id).eq("depth", depth).execute()

        return result.data[0] if result.data else None

    def _create_course_node(
        self,
        node: dict,
        domain_id: str,
        domain_name: str,
        batch_id: str,
        path_id: str
    ) -> dict:
        """Create a map_node for a level 1 (course) node."""
        node_data = {
            "name": node.get("name"),
            "description": node.get("description", ""),
            "domain_id": domain_id,
            "depth": 1,
            "parent_id": None,  # Level 1 nodes have no parent in map_nodes
            "node_type": "topic",
            "difficulty": node.get("difficulty", "beginner"),
            "estimated_hours": node.get("estimated_hours", 20),
            "status": "active",
            "generation_status": None,  # No content generation for courses themselves
        }

        result = self.db.table("map_nodes").insert(node_data).execute()
        if not result.data:
            raise ValueError(f"Failed to create map node for {node.get('name')}")

        map_node = result.data[0]

        # Create a course record linked to this node
        course_data = {
            "title": node.get("name"),
            "description": node.get("description", ""),
            "domain_id": domain_id,
            "difficulty": node.get("difficulty", "beginner"),
            "estimated_hours": node.get("estimated_hours", 20),
            "status": "draft",
        }

        course_result = self.db.table("courses").insert(course_data).execute()
        course_id = course_result.data[0]["id"] if course_result.data else None

        # Link course to map node
        if course_id:
            self.db.table("map_nodes").update({
                "course_id": course_id
            }).eq("id", map_node["id"]).execute()

        return {
            "created_node": {
                "path_node_id": node.get("id"),
                "map_node_id": map_node["id"],
                "name": node.get("name"),
                "type": "course",
                "course_id": course_id
            },
            "map_node_id": map_node["id"],
            "course_id": course_id
        }

    def _create_chapter_node(
        self,
        node: dict,
        parent_map_node_id: str,
        domain_id: str,
        domain_name: str,
        batch_id: str,
        path_id: str
    ) -> dict:
        """Create a map_node for a level 2 (chapter) node."""
        # Get parent course_id
        parent_result = self.db.table("map_nodes").select("course_id").eq(
            "id", parent_map_node_id
        ).execute()
        parent_course_id = parent_result.data[0].get("course_id") if parent_result.data else None

        node_data = {
            "name": node.get("name"),
            "description": node.get("description", ""),
            "domain_id": domain_id,
            "depth": 2,
            "parent_id": parent_map_node_id,
            "node_type": "subtopic",
            "difficulty": node.get("difficulty", "beginner"),
            "estimated_hours": node.get("estimated_hours", 2),
            "status": "active",
            "generation_status": "pending",  # Will be updated when job starts
        }

        result = self.db.table("map_nodes").insert(node_data).execute()
        if not result.data:
            raise ValueError(f"Failed to create map node for {node.get('name')}")

        map_node = result.data[0]

        # Create a chapter record linked to the parent course
        if parent_course_id:
            # Get current chapter count for sort_order
            chapters_result = self.db.table("chapters").select("id").eq(
                "course_id", parent_course_id
            ).execute()
            sort_order = len(chapters_result.data or []) + 1

            chapter_data = {
                "course_id": parent_course_id,
                "title": node.get("name"),
                "description": node.get("description", ""),
                "estimated_minutes": int(node.get("estimated_hours", 1) * 60),
                "sort_order": sort_order,
                "xp_reward": 100 + (sort_order * 25),  # Increasing XP per chapter
            }

            chapter_result = self.db.table("chapters").insert(chapter_data).execute()
            chapter_id = chapter_result.data[0]["id"] if chapter_result.data else None
        else:
            chapter_id = None

        return {
            "created_node": {
                "path_node_id": node.get("id"),
                "map_node_id": map_node["id"],
                "name": node.get("name"),
                "type": "chapter",
                "chapter_id": chapter_id,
                "parent_course_id": parent_course_id
            },
            "map_node_id": map_node["id"],
            "chapter_id": chapter_id
        }

    def _create_generation_job(
        self,
        map_node_id: str,
        node_name: str,
        domain_id: str,
        batch_id: str,
        path_id: str,
        path_node_id: str
    ) -> dict:
        """Create a content generation job for a chapter node."""
        job_data = {
            "node_id": map_node_id,
            "generation_type": "chapter_content",
            "status": "pending",
            "batch_id": batch_id,
            "path_id": path_id,
            "path_node_id": path_node_id,
            "domain_id": domain_id,
            "progress_percent": 0,
            "progress_message": "Queued for content generation...",
        }

        result = self.db.table("content_generation_jobs").insert(job_data).execute()
        if not result.data:
            raise ValueError(f"Failed to create generation job for {node_name}")

        job = result.data[0]

        # Update map_node with job reference
        self.db.table("map_nodes").update({
            "generation_job_id": job["id"],
            "generation_status": "pending"
        }).eq("id", map_node_id).execute()

        return {
            "job_id": job["id"],
            "node_id": map_node_id,
            "node_name": node_name,
            "status": "pending"
        }

    @tracer.wrap(service="content-generator", resource="get_batch_status")
    def get_batch_status(self, batch_id: str) -> dict:
        """Get status of all jobs in a batch."""
        result = self.db.table("content_generation_jobs").select(
            "id,node_id,status,progress_percent,progress_message,error_message"
        ).eq("batch_id", batch_id).execute()

        jobs = result.data or []

        completed = len([j for j in jobs if j["status"] == "completed"])
        failed = len([j for j in jobs if j["status"] == "failed"])
        total = len(jobs)

        overall_progress = 0
        if total > 0:
            # Weight: completed = 100, processing = progress_percent, pending = 0
            total_progress = sum(
                100 if j["status"] == "completed"
                else j.get("progress_percent", 0) if j["status"] == "processing"
                else 0
                for j in jobs
            )
            overall_progress = round(total_progress / total, 2)

        # Get node names
        node_ids = [j["node_id"] for j in jobs]
        if node_ids:
            nodes_result = self.db.table("map_nodes").select("id,name").in_(
                "id", node_ids
            ).execute()
            node_names = {n["id"]: n["name"] for n in (nodes_result.data or [])}
        else:
            node_names = {}

        return {
            "batch_id": batch_id,
            "overall_progress": overall_progress,
            "completed_count": completed,
            "failed_count": failed,
            "total_count": total,
            "all_completed": completed + failed == total,
            "jobs": [
                {
                    "job_id": j["id"],
                    "node_id": j["node_id"],
                    "node_name": node_names.get(j["node_id"], "Unknown"),
                    "status": j["status"],
                    "progress_percent": j.get("progress_percent", 0),
                    "progress_message": j.get("progress_message"),
                    "error_message": j.get("error_message")
                }
                for j in jobs
            ]
        }

    @tracer.wrap(service="content-generator", resource="get_nodes_status")
    def get_nodes_status(self, node_ids: list) -> dict:
        """Get generation status for multiple nodes."""
        if not node_ids:
            return {"nodes": {}}

        result = self.db.table("map_nodes").select(
            "id,generation_status,generation_job_id,course_id"
        ).in_("id", node_ids).execute()

        nodes = {}
        for node in (result.data or []):
            node_id = node["id"]
            status = node.get("generation_status")

            node_info = {
                "status": status or "ready",  # If no status, assume ready
                "course_id": node.get("course_id")
            }

            # Get progress if generating
            if status in ("pending", "generating") and node.get("generation_job_id"):
                job_result = self.db.table("content_generation_jobs").select(
                    "progress_percent,progress_message"
                ).eq("id", node["generation_job_id"]).execute()

                if job_result.data:
                    job = job_result.data[0]
                    node_info["progress"] = job.get("progress_percent", 0)
                    node_info["message"] = job.get("progress_message")

            # Get error if failed
            if status == "failed" and node.get("generation_job_id"):
                job_result = self.db.table("content_generation_jobs").select(
                    "error_message"
                ).eq("id", node["generation_job_id"]).execute()

                if job_result.data:
                    node_info["error"] = job_result.data[0].get("error_message")

            nodes[node_id] = node_info

        return {"nodes": nodes}
