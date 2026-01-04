#!/usr/bin/env python3
"""
OpenForge Traffic Generator
============================

Generates realistic traffic to the Oracle and Content Generator services
to demonstrate Datadog detection rules and observability features.

Usage:
    python traffic_generator.py --mode normal --duration 300
    python traffic_generator.py --mode stress --requests 100
    python traffic_generator.py --mode chaos --error-rate 0.2
    python traffic_generator.py --mode demo --all

Modes:
    normal  - Simulate realistic user traffic patterns
    stress  - High volume traffic to test latency thresholds
    chaos   - Inject errors to trigger detection rules
    demo    - Run all scenarios sequentially for demonstration

Detection Rules Demonstrated:
    1. [LLM] Gemini Response Latency Critical (>10s)
    2. [LLM] Gemini API Error Rate Elevated (>5%)
    3. [Cost] LLM Token Spend Anomaly
    4. [Jobs] Content Generation Failure Rate (>10%)
    5. [LLM] JSON Parse Errors Elevated (>10)
"""

import argparse
import asyncio
import json
import logging
import random
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict, Any
import aiohttp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class ServiceConfig:
    """Service endpoint configuration."""
    oracle_url: str = "http://localhost:8080"
    content_generator_url: str = "http://localhost:8081"
    timeout: int = 120  # seconds


# Sample data for realistic traffic
DOMAINS = ["frontend", "backend", "fullstack", "mobile", "games", "databases"]
EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"]
MOTIVATIONS = ["career_change", "skill_upgrade", "hobby", "startup"]
LEARNING_STYLES = ["video", "project_based", "reading", "interactive"]
GOALS = ["get_hired", "freelance", "build_product", "promotion"]
COMMITMENTS = ["casual", "part_time", "dedicated", "immersive"]


# =============================================================================
# REQUEST GENERATORS
# =============================================================================

def generate_oracle_profile() -> Dict[str, Any]:
    """Generate a realistic user profile for Oracle path generation."""
    return {
        "domain": random.choice(DOMAINS),
        "experience_level": random.choice(EXPERIENCE_LEVELS),
        "motivation": random.choice(MOTIVATIONS),
        "learning_style": random.choice(LEARNING_STYLES),
        "goal": random.choice(GOALS),
        "commitment": random.choice(COMMITMENTS),
        "challenge": random.choice(["time", "focus", "direction", "confidence"]),
        "interest": random.choice(["ai_integration", "cloud", "mobile", "web3"]),
        "constraint": random.choice(["time", "budget", "location", "experience"]),
        "additional_context": f"Generated test profile at {datetime.now().isoformat()}"
    }


def generate_content_request(node_id: str = None) -> Dict[str, Any]:
    """Generate a content generation request."""
    return {
        "node_id": node_id or f"test-node-{random.randint(1000, 9999)}",
        "generation_type": random.choice(["full_course", "chapters_only", "description"]),
        "options": {
            "difficulty": random.choice(["beginner", "intermediate", "advanced"]),
            "estimated_hours": random.randint(5, 40)
        }
    }


# =============================================================================
# TRAFFIC PATTERNS
# =============================================================================

class TrafficGenerator:
    """Generates traffic to OpenForge services."""

    def __init__(self, config: ServiceConfig):
        self.config = config
        self.stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_latency_ms": 0,
            "errors_by_type": {},
            "requests_by_endpoint": {}
        }

    async def _make_request(
        self,
        session: aiohttp.ClientSession,
        method: str,
        url: str,
        data: Optional[Dict] = None,
        inject_error: bool = False,
        simulate_slow: bool = False
    ) -> Dict[str, Any]:
        """Make an HTTP request and record metrics."""
        start_time = time.time()
        endpoint = url.split("/")[-1]

        self.stats["total_requests"] += 1
        self.stats["requests_by_endpoint"][endpoint] = \
            self.stats["requests_by_endpoint"].get(endpoint, 0) + 1

        # Optionally inject artificial delay to simulate slow responses
        if simulate_slow:
            await asyncio.sleep(random.uniform(8, 15))  # Simulate >10s latency

        try:
            # Optionally inject malformed data to cause errors
            if inject_error:
                data = {"malformed": True, "missing_required_fields": True}

            async with session.request(
                method,
                url,
                json=data,
                timeout=aiohttp.ClientTimeout(total=self.config.timeout)
            ) as response:
                latency_ms = (time.time() - start_time) * 1000
                self.stats["total_latency_ms"] += latency_ms

                result = {
                    "status": response.status,
                    "latency_ms": latency_ms,
                    "endpoint": endpoint,
                    "success": 200 <= response.status < 300
                }

                try:
                    result["body"] = await response.json()
                except:
                    result["body"] = await response.text()

                if result["success"]:
                    self.stats["successful_requests"] += 1
                    logger.info(f"✓ {endpoint}: {response.status} ({latency_ms:.0f}ms)")
                else:
                    self.stats["failed_requests"] += 1
                    error_type = f"HTTP_{response.status}"
                    self.stats["errors_by_type"][error_type] = \
                        self.stats["errors_by_type"].get(error_type, 0) + 1
                    logger.warning(f"✗ {endpoint}: {response.status} ({latency_ms:.0f}ms)")

                return result

        except asyncio.TimeoutError:
            latency_ms = (time.time() - start_time) * 1000
            self.stats["failed_requests"] += 1
            self.stats["errors_by_type"]["timeout"] = \
                self.stats["errors_by_type"].get("timeout", 0) + 1
            logger.error(f"✗ {endpoint}: TIMEOUT ({latency_ms:.0f}ms)")
            return {"status": 0, "error": "timeout", "latency_ms": latency_ms}

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            self.stats["failed_requests"] += 1
            error_type = type(e).__name__
            self.stats["errors_by_type"][error_type] = \
                self.stats["errors_by_type"].get(error_type, 0) + 1
            logger.error(f"✗ {endpoint}: {error_type} ({latency_ms:.0f}ms)")
            return {"status": 0, "error": str(e), "latency_ms": latency_ms}

    # -------------------------------------------------------------------------
    # Oracle Service Requests
    # -------------------------------------------------------------------------

    async def oracle_health(self, session: aiohttp.ClientSession) -> Dict:
        """Check Oracle service health."""
        return await self._make_request(
            session, "GET",
            f"{self.config.oracle_url}/health"
        )

    async def oracle_generate_paths(
        self,
        session: aiohttp.ClientSession,
        profile: Optional[Dict] = None,
        inject_error: bool = False,
        simulate_slow: bool = False
    ) -> Dict:
        """Generate learning paths via Oracle."""
        return await self._make_request(
            session, "POST",
            f"{self.config.oracle_url}/oracle/generate",
            data=profile or generate_oracle_profile(),
            inject_error=inject_error,
            simulate_slow=simulate_slow
        )

    async def oracle_start_session(
        self,
        session: aiohttp.ClientSession,
        user_id: Optional[str] = None
    ) -> Dict:
        """Start a new Oracle session (legacy flow)."""
        return await self._make_request(
            session, "POST",
            f"{self.config.oracle_url}/oracle/start",
            data={"user_id": user_id or f"test-user-{random.randint(1000, 9999)}"}
        )

    async def oracle_submit_answer(
        self,
        session: aiohttp.ClientSession,
        session_id: str,
        answer: str,
        question_index: int
    ) -> Dict:
        """Submit an answer in Oracle session."""
        return await self._make_request(
            session, "POST",
            f"{self.config.oracle_url}/oracle/answer",
            data={
                "session_id": session_id,
                "answer": answer,
                "question_index": question_index
            }
        )

    # -------------------------------------------------------------------------
    # Content Generator Service Requests
    # -------------------------------------------------------------------------

    async def content_health(self, session: aiohttp.ClientSession) -> Dict:
        """Check Content Generator service health."""
        return await self._make_request(
            session, "GET",
            f"{self.config.content_generator_url}/health"
        )

    async def content_create_job(
        self,
        session: aiohttp.ClientSession,
        node_id: Optional[str] = None,
        inject_error: bool = False
    ) -> Dict:
        """Create a content generation job."""
        return await self._make_request(
            session, "POST",
            f"{self.config.content_generator_url}/content/generate",
            data=generate_content_request(node_id),
            inject_error=inject_error
        )

    async def content_get_status(
        self,
        session: aiohttp.ClientSession,
        job_id: str
    ) -> Dict:
        """Get content generation job status."""
        return await self._make_request(
            session, "GET",
            f"{self.config.content_generator_url}/content/status/{job_id}"
        )

    async def content_list_jobs(
        self,
        session: aiohttp.ClientSession,
        limit: int = 20
    ) -> Dict:
        """List recent content generation jobs."""
        return await self._make_request(
            session, "GET",
            f"{self.config.content_generator_url}/content/jobs?limit={limit}"
        )

    async def content_accept_path(
        self,
        session: aiohttp.ClientSession,
        path_data: Dict,
        domain: str
    ) -> Dict:
        """Accept an Oracle path and create nodes."""
        return await self._make_request(
            session, "POST",
            f"{self.config.content_generator_url}/api/path/accept",
            data={"path": path_data, "domain": domain}
        )

    # -------------------------------------------------------------------------
    # Traffic Patterns
    # -------------------------------------------------------------------------

    async def run_normal_traffic(
        self,
        duration_seconds: int = 300,
        requests_per_minute: int = 10
    ):
        """
        Simulate normal user traffic patterns.

        This generates realistic traffic that should NOT trigger alerts.
        """
        logger.info(f"Starting NORMAL traffic for {duration_seconds}s at {requests_per_minute} req/min")

        start_time = time.time()
        interval = 60 / requests_per_minute

        async with aiohttp.ClientSession() as session:
            while time.time() - start_time < duration_seconds:
                # Mix of different request types
                request_type = random.choices(
                    ["oracle_generate", "oracle_session", "content_job", "health"],
                    weights=[40, 20, 30, 10]
                )[0]

                if request_type == "oracle_generate":
                    await self.oracle_generate_paths(session)
                elif request_type == "oracle_session":
                    result = await self.oracle_start_session(session)
                    if result.get("success") and result.get("body", {}).get("session_id"):
                        # Simulate answering a few questions
                        session_id = result["body"]["session_id"]
                        for i, answer in enumerate(["frontend", "beginner", "job"]):
                            await self.oracle_submit_answer(session, session_id, answer, i)
                            await asyncio.sleep(random.uniform(0.5, 2))
                elif request_type == "content_job":
                    await self.content_create_job(session)
                else:
                    await self.oracle_health(session)
                    await self.content_health(session)

                # Wait before next request (with some jitter)
                await asyncio.sleep(interval * random.uniform(0.5, 1.5))

        self._print_stats("NORMAL TRAFFIC")

    async def run_stress_traffic(
        self,
        num_requests: int = 100,
        concurrency: int = 10
    ):
        """
        Generate high-volume traffic to test latency thresholds.

        This may trigger:
        - [LLM] Gemini Response Latency Critical (if LLM is slow under load)
        - [Cost] LLM Token Spend Anomaly (high token usage)
        """
        logger.info(f"Starting STRESS traffic: {num_requests} requests, concurrency={concurrency}")

        async with aiohttp.ClientSession() as session:
            # Create batches of concurrent requests
            for batch_start in range(0, num_requests, concurrency):
                batch_size = min(concurrency, num_requests - batch_start)
                tasks = []

                for i in range(batch_size):
                    # Mostly Oracle generate requests (expensive)
                    if random.random() < 0.7:
                        tasks.append(self.oracle_generate_paths(session))
                    else:
                        tasks.append(self.content_create_job(session))

                await asyncio.gather(*tasks)
                logger.info(f"Completed batch {batch_start + batch_size}/{num_requests}")

        self._print_stats("STRESS TRAFFIC")

    async def run_chaos_traffic(
        self,
        duration_seconds: int = 120,
        error_rate: float = 0.2,
        slow_rate: float = 0.1
    ):
        """
        Inject errors and slow responses to trigger detection rules.

        This will trigger:
        - [LLM] Gemini API Error Rate Elevated (error_rate > 5%)
        - [LLM] Gemini Response Latency Critical (slow_rate causes >10s)
        - [LLM] JSON Parse Errors Elevated (malformed requests)
        - [Jobs] Content Generation Failure Rate (failed jobs)
        """
        logger.info(f"Starting CHAOS traffic for {duration_seconds}s (error_rate={error_rate}, slow_rate={slow_rate})")

        start_time = time.time()

        async with aiohttp.ClientSession() as session:
            while time.time() - start_time < duration_seconds:
                # Decide if this request should be problematic
                inject_error = random.random() < error_rate
                simulate_slow = random.random() < slow_rate

                request_type = random.choice(["oracle", "content"])

                if request_type == "oracle":
                    await self.oracle_generate_paths(
                        session,
                        inject_error=inject_error,
                        simulate_slow=simulate_slow
                    )
                else:
                    await self.content_create_job(
                        session,
                        inject_error=inject_error
                    )

                await asyncio.sleep(random.uniform(0.5, 2))

        self._print_stats("CHAOS TRAFFIC")

    async def run_latency_spike(self, num_slow_requests: int = 10):
        """
        Generate requests that will cause high latency alerts.

        This triggers:
        - [LLM] Gemini Response Latency Critical (>10s threshold)
        """
        logger.info(f"Starting LATENCY SPIKE: {num_slow_requests} slow requests")

        async with aiohttp.ClientSession() as session:
            tasks = [
                self.oracle_generate_paths(session, simulate_slow=True)
                for _ in range(num_slow_requests)
            ]
            await asyncio.gather(*tasks)

        self._print_stats("LATENCY SPIKE")

    async def run_error_burst(self, num_errors: int = 50):
        """
        Generate a burst of errors to trigger error rate alerts.

        This triggers:
        - [LLM] Gemini API Error Rate Elevated (>5% threshold)
        - [LLM] JSON Parse Errors Elevated (>10 threshold)
        """
        logger.info(f"Starting ERROR BURST: {num_errors} bad requests")

        async with aiohttp.ClientSession() as session:
            tasks = []
            for _ in range(num_errors):
                if random.random() < 0.5:
                    tasks.append(self.oracle_generate_paths(session, inject_error=True))
                else:
                    tasks.append(self.content_create_job(session, inject_error=True))

            await asyncio.gather(*tasks)

        self._print_stats("ERROR BURST")

    async def run_high_volume_burst(self, num_requests: int = 200):
        """
        Generate high volume of successful requests to trigger cost anomaly.

        This triggers:
        - [Cost] LLM Token Spend Anomaly (unusual cost pattern)
        """
        logger.info(f"Starting HIGH VOLUME BURST: {num_requests} requests")

        async with aiohttp.ClientSession() as session:
            # Send all requests as fast as possible
            tasks = [
                self.oracle_generate_paths(session)
                for _ in range(num_requests)
            ]
            await asyncio.gather(*tasks)

        self._print_stats("HIGH VOLUME BURST")

    async def run_demo_all(self):
        """
        Run all traffic patterns sequentially for demonstration.

        This demonstrates all detection rules in order.
        """
        logger.info("=" * 60)
        logger.info("OPENFORGE TRAFFIC GENERATOR - FULL DEMO")
        logger.info("=" * 60)

        # 1. Normal traffic baseline
        logger.info("\n[1/5] Normal Traffic (2 minutes) - Establishing baseline...")
        await self.run_normal_traffic(duration_seconds=120, requests_per_minute=5)
        await asyncio.sleep(30)

        # 2. Latency spike
        logger.info("\n[2/5] Latency Spike - Triggering latency alerts...")
        await self.run_latency_spike(num_slow_requests=5)
        await asyncio.sleep(30)

        # 3. Error burst
        logger.info("\n[3/5] Error Burst - Triggering error rate alerts...")
        await self.run_error_burst(num_errors=30)
        await asyncio.sleep(30)

        # 4. High volume
        logger.info("\n[4/5] High Volume - Triggering cost anomaly...")
        await self.run_high_volume_burst(num_requests=50)
        await asyncio.sleep(30)

        # 5. Return to normal
        logger.info("\n[5/5] Recovery - Normal traffic to show recovery...")
        await self.run_normal_traffic(duration_seconds=60, requests_per_minute=5)

        logger.info("\n" + "=" * 60)
        logger.info("DEMO COMPLETE")
        logger.info("=" * 60)
        self._print_final_summary()

    def _print_stats(self, label: str):
        """Print current statistics."""
        avg_latency = (
            self.stats["total_latency_ms"] / self.stats["total_requests"]
            if self.stats["total_requests"] > 0 else 0
        )
        error_rate = (
            self.stats["failed_requests"] / self.stats["total_requests"] * 100
            if self.stats["total_requests"] > 0 else 0
        )

        logger.info(f"\n--- {label} STATS ---")
        logger.info(f"Total Requests: {self.stats['total_requests']}")
        logger.info(f"Successful: {self.stats['successful_requests']}")
        logger.info(f"Failed: {self.stats['failed_requests']} ({error_rate:.1f}%)")
        logger.info(f"Avg Latency: {avg_latency:.0f}ms")
        if self.stats["errors_by_type"]:
            logger.info(f"Errors by Type: {self.stats['errors_by_type']}")
        logger.info("-" * 30)

    def _print_final_summary(self):
        """Print final summary with detection rule mapping."""
        logger.info("\n" + "=" * 60)
        logger.info("DETECTION RULES DEMONSTRATION SUMMARY")
        logger.info("=" * 60)

        error_rate = (
            self.stats["failed_requests"] / self.stats["total_requests"] * 100
            if self.stats["total_requests"] > 0 else 0
        )
        avg_latency = (
            self.stats["total_latency_ms"] / self.stats["total_requests"]
            if self.stats["total_requests"] > 0 else 0
        )

        rules = [
            {
                "name": "[LLM] Gemini Response Latency Critical",
                "threshold": ">10,000ms",
                "observed": f"{avg_latency:.0f}ms avg",
                "triggered": "Yes" if avg_latency > 10000 else "Check Datadog"
            },
            {
                "name": "[LLM] Gemini API Error Rate Elevated",
                "threshold": ">5%",
                "observed": f"{error_rate:.1f}%",
                "triggered": "Yes" if error_rate > 5 else "No"
            },
            {
                "name": "[Cost] LLM Token Spend Anomaly",
                "threshold": "3σ deviation",
                "observed": f"{self.stats['total_requests']} requests",
                "triggered": "Check Datadog (anomaly detection)"
            },
            {
                "name": "[Jobs] Content Generation Failure Rate",
                "threshold": ">10%",
                "observed": "See job metrics in Datadog",
                "triggered": "Check Datadog"
            },
            {
                "name": "[LLM] JSON Parse Errors Elevated",
                "threshold": ">10 in 10min",
                "observed": f"{self.stats['errors_by_type'].get('HTTP_400', 0)} bad requests",
                "triggered": "Check Datadog"
            }
        ]

        for rule in rules:
            logger.info(f"\n{rule['name']}")
            logger.info(f"  Threshold: {rule['threshold']}")
            logger.info(f"  Observed:  {rule['observed']}")
            logger.info(f"  Status:    {rule['triggered']}")

        logger.info("\n" + "=" * 60)
        logger.info("View detailed metrics in Datadog Dashboard:")
        logger.info("  Dashboards > LLM Application Health Overview")
        logger.info("=" * 60)


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="OpenForge Traffic Generator - Demonstrate Datadog Detection Rules",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "--mode",
        choices=["normal", "stress", "chaos", "latency", "errors", "volume", "demo"],
        default="normal",
        help="Traffic generation mode"
    )

    parser.add_argument(
        "--oracle-url",
        default="http://localhost:8080",
        help="Oracle service URL"
    )

    parser.add_argument(
        "--content-url",
        default="http://localhost:8081",
        help="Content Generator service URL"
    )

    parser.add_argument(
        "--duration",
        type=int,
        default=300,
        help="Duration in seconds (for normal/chaos modes)"
    )

    parser.add_argument(
        "--requests",
        type=int,
        default=100,
        help="Number of requests (for stress/burst modes)"
    )

    parser.add_argument(
        "--error-rate",
        type=float,
        default=0.2,
        help="Error injection rate 0-1 (for chaos mode)"
    )

    parser.add_argument(
        "--slow-rate",
        type=float,
        default=0.1,
        help="Slow request rate 0-1 (for chaos mode)"
    )

    parser.add_argument(
        "--concurrency",
        type=int,
        default=10,
        help="Concurrent requests (for stress mode)"
    )

    args = parser.parse_args()

    config = ServiceConfig(
        oracle_url=args.oracle_url,
        content_generator_url=args.content_url
    )

    generator = TrafficGenerator(config)

    # Run the selected mode
    if args.mode == "normal":
        asyncio.run(generator.run_normal_traffic(
            duration_seconds=args.duration,
            requests_per_minute=10
        ))
    elif args.mode == "stress":
        asyncio.run(generator.run_stress_traffic(
            num_requests=args.requests,
            concurrency=args.concurrency
        ))
    elif args.mode == "chaos":
        asyncio.run(generator.run_chaos_traffic(
            duration_seconds=args.duration,
            error_rate=args.error_rate,
            slow_rate=args.slow_rate
        ))
    elif args.mode == "latency":
        asyncio.run(generator.run_latency_spike(num_slow_requests=args.requests))
    elif args.mode == "errors":
        asyncio.run(generator.run_error_burst(num_errors=args.requests))
    elif args.mode == "volume":
        asyncio.run(generator.run_high_volume_burst(num_requests=args.requests))
    elif args.mode == "demo":
        asyncio.run(generator.run_demo_all())


if __name__ == "__main__":
    main()
