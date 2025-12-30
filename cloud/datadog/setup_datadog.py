#!/usr/bin/env python3
"""
Datadog Setup Script
Automatically creates monitors, dashboard, and SLOs via Datadog API.

Usage:
    export DD_API_KEY=your-api-key
    export DD_APP_KEY=your-app-key
    python setup_datadog.py

Requirements:
    pip install datadog-api-client
"""

import os
import json
import sys
from pathlib import Path

try:
    from datadog_api_client import ApiClient, Configuration
    from datadog_api_client.v1.api import monitors_api, dashboards_api
    from datadog_api_client.v1.model.monitor import Monitor
    from datadog_api_client.v1.model.monitor_options import MonitorOptions
    from datadog_api_client.v1.model.monitor_thresholds import MonitorThresholds
    from datadog_api_client.v1.model.dashboard import Dashboard
except ImportError:
    print("Error: datadog-api-client not installed.")
    print("Run: pip install datadog-api-client")
    sys.exit(1)


def load_json_file(filename: str) -> dict:
    """Load JSON configuration file."""
    script_dir = Path(__file__).parent
    filepath = script_dir / filename
    with open(filepath, 'r') as f:
        return json.load(f)


def create_monitors(api_client: ApiClient):
    """Create monitors from monitors.json configuration."""
    print("\n=== Creating Monitors ===\n")

    monitors_config = load_json_file("monitors.json")
    api_instance = monitors_api.MonitorsApi(api_client)

    created_count = 0
    for monitor_def in monitors_config.get("monitors", []):
        try:
            # Build monitor options
            options_dict = monitor_def.get("options", {})
            thresholds = options_dict.get("thresholds", {})

            monitor_thresholds = None
            if thresholds:
                monitor_thresholds = MonitorThresholds(
                    critical=thresholds.get("critical"),
                    warning=thresholds.get("warning")
                )

            monitor_options = MonitorOptions(
                thresholds=monitor_thresholds,
                notify_no_data=options_dict.get("notify_no_data", False),
                no_data_timeframe=options_dict.get("no_data_timeframe"),
                include_tags=options_dict.get("include_tags", True)
            )

            # Create monitor
            monitor = Monitor(
                name=monitor_def["name"],
                type=monitor_def["type"],
                query=monitor_def["query"],
                message=monitor_def["message"],
                tags=monitor_def.get("tags", []),
                options=monitor_options
            )

            response = api_instance.create_monitor(body=monitor)
            print(f"  [OK] Created monitor: {monitor_def['name']}")
            print(f"       ID: {response.id}")
            created_count += 1

        except Exception as e:
            print(f"  [ERROR] Failed to create monitor '{monitor_def['name']}': {e}")

    print(f"\nCreated {created_count}/{len(monitors_config.get('monitors', []))} monitors")


def create_dashboard(api_client: ApiClient):
    """Create dashboard from dashboard.json configuration."""
    print("\n=== Creating Dashboard ===\n")

    dashboard_config = load_json_file("dashboard.json")
    api_instance = dashboards_api.DashboardsApi(api_client)

    try:
        # Create dashboard using raw dict (API accepts this format)
        response = api_instance.create_dashboard(body=dashboard_config)
        print(f"  [OK] Created dashboard: {dashboard_config['title']}")
        print(f"       ID: {response.id}")
        print(f"       URL: https://app.datadoghq.com/dashboard/{response.id}")
        return response.id

    except Exception as e:
        print(f"  [ERROR] Failed to create dashboard: {e}")
        return None


def create_slos(api_client: ApiClient):
    """Create SLOs for the application."""
    print("\n=== Creating SLOs ===\n")

    # Note: SLO creation requires datadog_api_client.v1.api.service_level_objectives_api
    # For simplicity, we'll print instructions since SLO API is more complex

    slos = [
        {
            "name": "Oracle Path Generation - 99% Success",
            "description": "99% of learning path generation requests should succeed",
            "type": "metric",
            "target": 99.0,
            "timeframe": "7d",
            "numerator": "sum:oracle.path.generated{status:success}.as_count()",
            "denominator": "sum:oracle.path.generated{*}.as_count()"
        },
        {
            "name": "Content Generation Jobs - 95% Success",
            "description": "95% of content generation jobs should complete successfully",
            "type": "metric",
            "target": 95.0,
            "timeframe": "7d",
            "numerator": "sum:content.job.duration{status:completed}.as_count()",
            "denominator": "sum:content.job.duration{*}.as_count()"
        },
        {
            "name": "LLM Response Time - P95 < 10s",
            "description": "95th percentile of LLM requests should complete within 10 seconds",
            "type": "metric",
            "target": 95.0,
            "timeframe": "7d"
        }
    ]

    print("  SLOs to create manually in Datadog UI:\n")
    for slo in slos:
        print(f"  - {slo['name']}")
        print(f"    Target: {slo['target']}%")
        print(f"    Timeframe: {slo['timeframe']}")
        if 'numerator' in slo:
            print(f"    Numerator: {slo['numerator']}")
            print(f"    Denominator: {slo['denominator']}")
        print()


def print_summary():
    """Print setup summary and next steps."""
    print("\n" + "=" * 60)
    print("SETUP COMPLETE")
    print("=" * 60)

    print("""
Next Steps:

1. VERIFY METRICS ARE FLOWING
   - Deploy the updated cloud services
   - Make some API calls to generate traffic
   - Check Metrics > Explorer for:
     * llm.gemini.request.count
     * llm.gemini.request.latency
     * llm.gemini.cost.usd

2. CREATE SLOs (Manual Step)
   - Navigate to Service Level Objectives in Datadog
   - Create the 3 SLOs listed above

3. CONFIGURE INCIDENT MANAGEMENT
   - Go to Incidents > Settings
   - Create workflow to auto-create incidents from monitors
   - Set up notification channels (Slack, PagerDuty)

4. TEST DETECTION RULES
   - Trigger a high latency scenario
   - Verify monitor alerts fire
   - Confirm incident is created with context

5. REVIEW DASHBOARD
   - Open the created dashboard
   - Verify all widgets show data
   - Customize as needed

Documentation: cloud/DATADOG_SETUP.md
""")


def main():
    """Main entry point."""
    print("=" * 60)
    print("DATADOG LLM OBSERVABILITY SETUP")
    print("Gemini Learning Platform - Hackathon Edition")
    print("=" * 60)

    # Check for API keys
    api_key = os.environ.get("DD_API_KEY")
    app_key = os.environ.get("DD_APP_KEY")

    if not api_key or not app_key:
        print("\nError: Missing Datadog API credentials.")
        print("Set the following environment variables:")
        print("  export DD_API_KEY=your-api-key")
        print("  export DD_APP_KEY=your-app-key")
        sys.exit(1)

    # Configure API client
    configuration = Configuration()
    configuration.api_key["apiKeyAuth"] = api_key
    configuration.api_key["appKeyAuth"] = app_key

    # Optionally set site (default is datadoghq.com)
    # configuration.server_variables["site"] = "datadoghq.eu"

    with ApiClient(configuration) as api_client:
        # Create resources
        create_monitors(api_client)
        create_dashboard(api_client)
        create_slos(api_client)

    print_summary()


if __name__ == "__main__":
    main()
