"""
Datadog LLM Metrics Module
Provides custom metrics for Gemini LLM observability

This module enables comprehensive LLM telemetry including:
- Request counts and latency
- Token usage (input/output/total)
- Cost estimation based on Gemini pricing
- Error tracking by type
- Google Search grounding utilization
- Response quality indicators
"""

import time
import logging
from datadog import statsd
from ddtrace import tracer
from functools import wraps
from typing import Optional, Dict, Any, Callable

logger = logging.getLogger(__name__)

# Gemini 2.0 Flash pricing (per 1K tokens) - Updated Dec 2024
GEMINI_PRICING = {
    "gemini-2.0-flash-exp": {
        "input_per_1k": 0.000075,   # $0.075 per 1M input tokens
        "output_per_1k": 0.0003,    # $0.30 per 1M output tokens
    },
    "gemini-1.5-flash": {
        "input_per_1k": 0.000075,
        "output_per_1k": 0.0003,
    },
    "gemini-1.5-pro": {
        "input_per_1k": 0.00125,
        "output_per_1k": 0.005,
    },
}


class LLMMetrics:
    """
    Custom metrics collector for LLM observability.

    Emits Datadog custom metrics for comprehensive LLM monitoring:
    - llm.gemini.request.count: Total API calls
    - llm.gemini.request.latency: Request latency distribution
    - llm.gemini.tokens.*: Token usage metrics
    - llm.gemini.cost.usd: Estimated cost per request
    - llm.gemini.errors: Error counts by type
    - llm.gemini.grounding.used: Google Search grounding usage
    """

    def __init__(self, service: str):
        """
        Initialize metrics collector.

        Args:
            service: Service name (e.g., 'oracle', 'content-generator')
        """
        self.service = service
        self.default_model = "gemini-2.0-flash-exp"

    def record_llm_request(
        self,
        operation: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: float,
        success: bool = True,
        error_type: Optional[str] = None,
        grounding_used: bool = False,
        extra_tags: Optional[Dict[str, str]] = None
    ) -> float:
        """
        Record comprehensive LLM request metrics.

        Args:
            operation: Name of the operation (e.g., 'generate_paths')
            model: Model identifier
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            latency_ms: Request latency in milliseconds
            success: Whether the request succeeded
            error_type: Type of error if failed
            grounding_used: Whether Google Search grounding was used
            extra_tags: Additional tags for the metrics

        Returns:
            Estimated cost in USD
        """
        tags = [
            f"service:{self.service}",
            f"operation:{operation}",
            f"model:{model}",
            f"success:{str(success).lower()}",
        ]

        if extra_tags:
            tags.extend([f"{k}:{v}" for k, v in extra_tags.items()])

        try:
            # Request count
            statsd.increment("llm.gemini.request.count", tags=tags)

            # Latency distribution
            statsd.distribution("llm.gemini.request.latency", latency_ms, tags=tags)

            # Token metrics
            total_tokens = input_tokens + output_tokens
            statsd.distribution("llm.gemini.tokens.input", input_tokens, tags=tags)
            statsd.distribution("llm.gemini.tokens.output", output_tokens, tags=tags)
            statsd.distribution("llm.gemini.tokens.total", total_tokens, tags=tags)

            # Cost calculation
            pricing = GEMINI_PRICING.get(model, GEMINI_PRICING[self.default_model])
            cost = (input_tokens / 1000 * pricing["input_per_1k"]) + \
                   (output_tokens / 1000 * pricing["output_per_1k"])
            statsd.distribution("llm.gemini.cost.usd", cost, tags=tags)

            # Grounding usage
            if grounding_used:
                statsd.increment("llm.gemini.grounding.used", tags=tags)

            # Error tracking
            if not success and error_type:
                error_tags = tags + [f"error_type:{error_type}"]
                statsd.increment("llm.gemini.errors", tags=error_tags)

            # Enrich current span with LLM metadata
            self._enrich_span(
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                cost=cost,
                latency_ms=latency_ms,
                grounding_used=grounding_used,
                error_type=error_type
            )

            logger.debug(
                f"LLM metrics recorded: operation={operation}, "
                f"tokens={total_tokens}, latency={latency_ms:.0f}ms, cost=${cost:.6f}"
            )

            return cost

        except Exception as e:
            logger.warning(f"Failed to record LLM metrics: {e}")
            return 0.0

    def _enrich_span(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        total_tokens: int,
        cost: float,
        latency_ms: float,
        grounding_used: bool,
        error_type: Optional[str] = None
    ):
        """Add LLM metadata to the current APM span."""
        span = tracer.current_span()
        if span:
            span.set_tag("llm.model", model)
            span.set_tag("llm.tokens.input", input_tokens)
            span.set_tag("llm.tokens.output", output_tokens)
            span.set_tag("llm.tokens.total", total_tokens)
            span.set_tag("llm.cost.usd", round(cost, 6))
            span.set_tag("llm.latency_ms", round(latency_ms, 2))
            span.set_tag("llm.grounding_used", grounding_used)
            if error_type:
                span.set_tag("error.type", error_type)
                span.set_tag("error", True)

    def record_parse_error(self, operation: str, error_details: Optional[str] = None):
        """
        Record JSON parsing failure for LLM response.

        Args:
            operation: Name of the operation
            error_details: Optional error details
        """
        tags = [f"service:{self.service}", f"operation:{operation}"]
        statsd.increment("llm.response.parse_error", tags=tags)

        span = tracer.current_span()
        if span:
            span.set_tag("llm.parse_error", True)
            if error_details:
                span.set_tag("llm.parse_error.details", error_details[:200])

    def record_quality_score(self, operation: str, score: float, dimensions: Optional[Dict[str, float]] = None):
        """
        Record response quality indicator (0-1).

        Args:
            operation: Name of the operation
            score: Overall quality score (0-1)
            dimensions: Optional breakdown of quality dimensions
        """
        tags = [f"service:{self.service}", f"operation:{operation}"]
        statsd.gauge("llm.response.quality_score", score, tags=tags)

        if dimensions:
            for dim_name, dim_score in dimensions.items():
                dim_tags = tags + [f"dimension:{dim_name}"]
                statsd.gauge("llm.response.quality_dimension", dim_score, tags=dim_tags)


class OracleMetrics(LLMMetrics):
    """Metrics specific to the Oracle service."""

    def __init__(self):
        super().__init__(service="oracle")

    def record_session_created(self, domain: str, experience_level: str, user_id: Optional[str] = None):
        """Record new oracle session creation."""
        tags = [
            f"domain:{domain}",
            f"experience_level:{experience_level}",
            "service:oracle",
        ]
        statsd.increment("oracle.session.created", tags=tags)

        span = tracer.current_span()
        if span:
            span.set_tag("oracle.session.domain", domain)
            span.set_tag("oracle.session.experience_level", experience_level)

    def record_path_generated(
        self,
        domain: str,
        confidence: float,
        num_paths: int,
        generation_method: str = "llm"
    ):
        """
        Record learning path generation.

        Args:
            domain: Learning domain
            confidence: Confidence score (0-1)
            num_paths: Number of paths generated
            generation_method: 'llm' or 'fallback'
        """
        confidence_tier = "high" if confidence > 0.8 else "medium" if confidence > 0.5 else "low"
        tags = [
            f"domain:{domain}",
            f"confidence_tier:{confidence_tier}",
            f"generation_method:{generation_method}",
            "status:success",
            "service:oracle",
        ]
        statsd.increment("oracle.path.generated", value=num_paths, tags=tags)
        statsd.distribution("oracle.path.confidence", confidence, tags=tags)

        span = tracer.current_span()
        if span:
            span.set_tag("oracle.paths.count", num_paths)
            span.set_tag("oracle.paths.confidence", confidence)
            span.set_tag("oracle.paths.confidence_tier", confidence_tier)

    def record_path_selected(self, path_id: str, domain: str):
        """Record when a user selects a generated path."""
        tags = [f"domain:{domain}", "service:oracle"]
        statsd.increment("oracle.path.selected", tags=tags)


class ContentGeneratorMetrics(LLMMetrics):
    """Metrics specific to the Content Generator service."""

    def __init__(self):
        super().__init__(service="content-generator")

    def record_job_started(self, generation_type: str, node_id: str):
        """Record content generation job start."""
        tags = [
            f"generation_type:{generation_type}",
            "service:content-generator",
        ]
        statsd.increment("content.job.started", tags=tags)

    def record_job_completed(
        self,
        generation_type: str,
        duration_ms: float,
        status: str,
        tokens_used: int = 0
    ):
        """
        Record content generation job completion.

        Args:
            generation_type: Type of generation (full_course, chapters_only, description)
            duration_ms: Job duration in milliseconds
            status: 'completed' or 'failed'
            tokens_used: Total tokens consumed
        """
        tags = [
            f"generation_type:{generation_type}",
            f"status:{status}",
            "service:content-generator",
        ]
        statsd.distribution("content.job.duration", duration_ms, tags=tags)
        statsd.increment("content.job.completed", tags=tags)

        if tokens_used > 0:
            statsd.distribution("content.job.tokens", tokens_used, tags=tags)

    def record_course_created(self, domain_name: str, difficulty: str, num_chapters: int):
        """
        Record course creation.

        Args:
            domain_name: Name of the domain
            difficulty: Course difficulty level
            num_chapters: Number of chapters created
        """
        tags = [
            f"domain:{domain_name}",
            f"difficulty:{difficulty}",
            "service:content-generator",
        ]
        statsd.increment("content.course.created", tags=tags)
        statsd.distribution("content.course.chapters", num_chapters, tags=tags)

        span = tracer.current_span()
        if span:
            span.set_tag("content.course.domain", domain_name)
            span.set_tag("content.course.difficulty", difficulty)
            span.set_tag("content.course.chapters", num_chapters)

    def record_job_progress(self, job_id: str, progress_percent: int, message: str):
        """Record job progress update."""
        tags = ["service:content-generator"]
        statsd.gauge("content.job.progress", progress_percent, tags=tags + [f"job_id:{job_id}"])


def estimate_tokens(text: str) -> int:
    """
    Estimate token count from text.

    Uses a simple heuristic of ~4 characters per token for English text.
    For more accurate counts, use the Gemini tokenizer directly.

    Args:
        text: Input text

    Returns:
        Estimated token count
    """
    if not text:
        return 0
    return max(1, len(text) // 4)


def llm_traced(operation: str, service: str):
    """
    Decorator for LLM operations with automatic metrics.

    Wraps a function to automatically record:
    - Request latency
    - Success/failure status
    - Error types on failure

    The decorated function should return a dict with optional keys:
    - model: Model identifier
    - input_tokens: Input token count
    - output_tokens: Output token count
    - grounding_used: Whether grounding was used

    Args:
        operation: Name of the operation for metrics
        service: Service name

    Example:
        @llm_traced("generate_paths", "oracle")
        def generate_paths(session):
            # ... LLM call ...
            return {
                "result": paths,
                "input_tokens": 1000,
                "output_tokens": 500,
                "grounding_used": True
            }
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            metrics = LLMMetrics(service)
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                latency_ms = (time.time() - start_time) * 1000

                # Extract metrics from result if available
                if isinstance(result, dict):
                    metrics.record_llm_request(
                        operation=operation,
                        model=result.get("model", "gemini-2.0-flash-exp"),
                        input_tokens=result.get("input_tokens", 0),
                        output_tokens=result.get("output_tokens", 0),
                        latency_ms=latency_ms,
                        success=True,
                        grounding_used=result.get("grounding_used", False)
                    )

                return result

            except Exception as e:
                latency_ms = (time.time() - start_time) * 1000
                error_type = type(e).__name__

                metrics.record_llm_request(
                    operation=operation,
                    model="gemini-2.0-flash-exp",
                    input_tokens=0,
                    output_tokens=0,
                    latency_ms=latency_ms,
                    success=False,
                    error_type=error_type
                )

                raise

        return wrapper
    return decorator
