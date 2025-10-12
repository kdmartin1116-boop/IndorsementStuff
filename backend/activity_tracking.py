"""
Activity tracking for educational accountability

This module tracks user activity on the legal education platform
to ensure responsible use and improve educational content.
"""

import json
from datetime import datetime
from typing import Dict, List, Any
import os

ACTIVITY_LOG = "educational_activity.log"
USAGE_STATS = "usage_statistics.json"

def log_page_view(user_email: str, page: str, session_info: Dict[str, Any] = None) -> None:
    """Log when a user views an educational page"""
    activity = {
        "timestamp": datetime.now().isoformat(),
        "user_email": user_email,
        "activity_type": "page_view",
        "page": page,
        "session_info": session_info or {},
        "purpose": "educational_tracking"
    }
    
    _append_to_log(activity)

def log_resource_download(user_email: str, resource: str, resource_type: str) -> None:
    """Log when a user downloads educational resources"""
    activity = {
        "timestamp": datetime.now().isoformat(),
        "user_email": user_email,
        "activity_type": "resource_download",
        "resource": resource,
        "resource_type": resource_type,
        "purpose": "educational_accountability"
    }
    
    _append_to_log(activity)

def log_search_query(user_email: str, query: str, results_count: int = 0) -> None:
    """Log educational search queries for content improvement"""
    activity = {
        "timestamp": datetime.now().isoformat(),
        "user_email": user_email,
        "activity_type": "search",
        "query": query,
        "results_count": results_count,
        "purpose": "content_improvement"
    }
    
    _append_to_log(activity)

def log_feedback_submission(user_email: str, feedback_type: str, content: str) -> None:
    """Log user feedback for educational improvement"""
    activity = {
        "timestamp": datetime.now().isoformat(),
        "user_email": user_email,
        "activity_type": "feedback",
        "feedback_type": feedback_type,
        "content": content[:500],  # Limit content length
        "purpose": "educational_improvement"
    }
    
    _append_to_log(activity)

def generate_usage_statistics() -> Dict[str, Any]:
    """Generate usage statistics for educational assessment"""
    try:
        activities = []
        if os.path.exists(ACTIVITY_LOG):
            with open(ACTIVITY_LOG, 'r') as f:
                for line in f:
                    try:
                        activities.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        continue
        
        stats = {
            "total_activities": len(activities),
            "unique_users": len(set(activity.get("user_email") for activity in activities)),
            "activity_types": {},
            "popular_pages": {},
            "recent_activity_count": 0,
            "generated_at": datetime.now().isoformat()
        }
        
        # Count activity types
        for activity in activities:
            activity_type = activity.get("activity_type", "unknown")
            stats["activity_types"][activity_type] = stats["activity_types"].get(activity_type, 0) + 1
            
            # Count page views
            if activity_type == "page_view":
                page = activity.get("page", "unknown")
                stats["popular_pages"][page] = stats["popular_pages"].get(page, 0) + 1
            
            # Count recent activity (last 24 hours)
            try:
                activity_time = datetime.fromisoformat(activity.get("timestamp", ""))
                if (datetime.now() - activity_time).total_seconds() < 86400:  # 24 hours
                    stats["recent_activity_count"] += 1
            except ValueError:
                pass
        
        # Save statistics
        with open(USAGE_STATS, 'w') as f:
            json.dump(stats, f, indent=2)
        
        return stats
    
    except Exception as e:
        print(f"Error generating usage statistics: {e}")
        return {"error": str(e), "generated_at": datetime.now().isoformat()}

def get_user_activity_summary(user_email: str) -> Dict[str, Any]:
    """Get activity summary for a specific user"""
    try:
        activities = []
        if os.path.exists(ACTIVITY_LOG):
            with open(ACTIVITY_LOG, 'r') as f:
                for line in f:
                    try:
                        activity = json.loads(line.strip())
                        if activity.get("user_email") == user_email:
                            activities.append(activity)
                    except json.JSONDecodeError:
                        continue
        
        summary = {
            "user_email": user_email,
            "total_activities": len(activities),
            "first_activity": None,
            "last_activity": None,
            "activity_breakdown": {},
            "pages_visited": set(),
            "resources_accessed": []
        }
        
        if activities:
            # Sort by timestamp
            activities.sort(key=lambda x: x.get("timestamp", ""))
            summary["first_activity"] = activities[0].get("timestamp")
            summary["last_activity"] = activities[-1].get("timestamp")
            
            # Analyze activities
            for activity in activities:
                activity_type = activity.get("activity_type", "unknown")
                summary["activity_breakdown"][activity_type] = summary["activity_breakdown"].get(activity_type, 0) + 1
                
                if activity_type == "page_view":
                    summary["pages_visited"].add(activity.get("page", "unknown"))
                elif activity_type == "resource_download":
                    summary["resources_accessed"].append(activity.get("resource", "unknown"))
        
        # Convert set to list for JSON serialization
        summary["pages_visited"] = list(summary["pages_visited"])
        
        return summary
    
    except Exception as e:
        return {"error": str(e), "user_email": user_email}

def _append_to_log(activity: Dict[str, Any]) -> None:
    """Append activity to log file"""
    try:
        with open(ACTIVITY_LOG, 'a') as f:
            f.write(f"{json.dumps(activity)}\n")
    except Exception as e:
        print(f"Error logging activity: {e}")

def cleanup_old_logs(days_to_keep: int = 90) -> None:
    """Clean up old log entries (keep only recent entries)"""
    try:
        if not os.path.exists(ACTIVITY_LOG):
            return
        
        cutoff_date = datetime.now().timestamp() - (days_to_keep * 24 * 60 * 60)
        recent_activities = []
        
        with open(ACTIVITY_LOG, 'r') as f:
            for line in f:
                try:
                    activity = json.loads(line.strip())
                    activity_time = datetime.fromisoformat(activity.get("timestamp", ""))
                    if activity_time.timestamp() > cutoff_date:
                        recent_activities.append(activity)
                except (json.JSONDecodeError, ValueError):
                    continue
        
        # Rewrite file with only recent activities
        with open(ACTIVITY_LOG, 'w') as f:
            for activity in recent_activities:
                f.write(f"{json.dumps(activity)}\n")
        
        print(f"Cleaned up log file, kept {len(recent_activities)} recent activities")
    
    except Exception as e:
        print(f"Error cleaning up logs: {e}")

# Educational accountability features
def generate_accountability_report() -> Dict[str, Any]:
    """Generate a report for educational accountability purposes"""
    stats = generate_usage_statistics()
    
    report = {
        "report_type": "educational_accountability",
        "generated_at": datetime.now().isoformat(),
        "purpose": "Ensure responsible use of legal education platform",
        "statistics": stats,
        "compliance_notes": [
            "All user activity is logged for educational accountability",
            "No personal legal advice is provided through this platform",
            "Users are directed to licensed attorneys for legal assistance",
            "Platform promotes legitimate legal education only"
        ]
    }
    
    return report