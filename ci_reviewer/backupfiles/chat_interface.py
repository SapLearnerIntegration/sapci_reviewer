# New file: src/api/chat_interface.py

import logging
import re
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class IntegrationChatbot:
    """Natural language interface for SAP Integration Suite insights"""

    def __init__(self, tenant_data: Dict[str, Any], analysis_results: Dict[str, Any]):
        """
        Initialize with tenant data and analysis results

        Args:
            tenant_data: Dict containing tenant integration artifacts
            analysis_results: Dict containing analysis results
        """
        self.tenant_data = tenant_data
        self.analysis_results = analysis_results
        self.context = {
            "current_focus": None,
            "last_query": None,
            "last_entities": []
        }

    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Process natural language query and return relevant information

        Args:
            query: Natural language query from user

        Returns:
            Dict containing response and relevant data
        """
        try:
            # Normalize query
            normalized_query = query.lower().strip()
            self.context["last_query"] = normalized_query

            # Extract entities
            entities = self._extract_entities(normalized_query)
            self.context["last_entities"] = entities

            # Identify query intent
            intent = self._identify_intent(normalized_query)
            self.context["current_focus"] = intent

            # Process based on intent
            if intent == "security":
                response = self._handle_security_query(normalized_query, entities)
            elif intent == "error_handling":
                response = self._handle_error_handling_query(normalized_query, entities)
            elif intent == "performance":
                response = self._handle_performance_query(normalized_query, entities)
            elif intent == "compliance":
                response = self._handle_compliance_query(normalized_query, entities)
            elif intent == "recommendations":
                response = self._handle_recommendations_query(normalized_query, entities)
            elif intent == "statistics":
                response = self._handle_statistics_query(normalized_query, entities)
            elif intent == "iflow_details":
                response = self._handle_iflow_details_query(normalized_query, entities)
            else:
                response = self._handle_general_query(normalized_query, entities)

            return response

        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {
                "response_type": "error",
                "message": "Sorry, I encountered an error processing your query. Please try again.",
                "data": None
            }

    def _identify_intent(self, query: str) -> str:
        """Identify the intent of the query"""
        # Security related queries
        security_patterns = [
            r"security", r"vulnerabilit(y|ies)", r"authentication",
            r"authorization", r"oauth", r"certificate", r"encrypt"
        ]

        # Error handling related queries
        error_handling_patterns = [
            r"error handling", r"exception", r"retry", r"logging",
            r"notification", r"alert"
        ]

        # Performance related queries
        performance_patterns = [
            r"performance", r"bottleneck", r"slow", r"latency",
            r"throughput", r"processing time"
        ]

        # Compliance related queries
        compliance_patterns = [
            r"compliance", r"best practice", r"standard", r"naming convention",
            r"documentation"
        ]

        # Recommendations related queries
        recommendations_patterns = [
            r"recommend", r"suggest", r"improve", r"fix", r"remediate"
        ]

        # Statistics related queries
        statistics_patterns = [
            r"statistics", r"count", r"how many", r"distribution",
            r"percentage", r"ratio"
        ]

        # iFlow details related queries
        iflow_details_patterns = [
            r"iflow details", r"integration flow", r"show me iflow",
            r"tell me about iflow"
        ]

        # Check for matches
        for pattern in security_patterns:
            if re.search(pattern, query):
                return "security"

        for pattern in error_handling_patterns:
            if re.search(pattern, query):
                return "error_handling"

        for pattern in performance_patterns:
            if re.search(pattern, query):
                return "performance"

        for pattern in compliance_patterns:
            if re.search(pattern, query):
                return "compliance"

        for pattern in recommendations_patterns:
            if re.search(pattern, query):
                return "recommendations"

        for pattern in statistics_patterns:
            if re.search(pattern, query):
                return "statistics"

        for pattern in iflow_details_patterns:
            if re.search(pattern, query):
                return "iflow_details"

        # Default to general
        return "general"

    def _extract_entities(self, query: str) -> Dict[str, Any]:
        """Extract entities from the query"""
        entities = {
            "iflow_name": None,
            "package_name": None,
            "category": None,
            "severity": None,
            "count": None
        }

        # Extract iFlow name
        iflow_match = re.search(r"iflow (?:named|called) ['\"]?([a-zA-Z0-9_\-. ]+)['\"]?", query)
        if iflow_match:
            entities["iflow_name"] = iflow_match.group(1).strip()

        # Extract package name
        package_match = re.search(r"package (?:named|called) ['\"]?([a-zA-Z0-9_\-. ]+)['\"]?", query)
        if package_match:
            entities["package_name"] = package_match.group(1).strip()

        # Extract category
        category_patterns = {
            "security": r"security",
            "error_handling": r"error handling",
            "performance": r"performance",
            "compliance": r"compliance",
            "adapter": r"adapter"
        }

        for category, pattern in category_patterns.items():
            if re.search(pattern, query):
                entities["category"] = category
                break

        # Extract severity
        severity_patterns = {
            "high": r"high|critical",
            "medium": r"medium|moderate",
            "low": r"low|minor"
        }

        for severity, pattern in severity_patterns.items():
            if re.search(pattern, query):
                entities["severity"] = severity
                break

        # Extract count
        count_match = re.search(r"top (\d+)", query)
        if count_match:
            entities["count"] = int(count_match.group(1))

        return entities

    def _handle_security_query(self, query: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle security related queries"""
        security_analysis = self.analysis_results.get("security_analysis", {})

        # Check for specific iFlow
        if entities.get("iflow_name"):
            return self._get_iflow_security_info(entities["iflow_name"])

        # Check for overall security rating
        if "rating" in query or "overall" in query:
            return {
                "response_type": "security_rating",
                "message": f"The overall security rating for your integration landscape is: {security_analysis.get('overall_rating', 'unknown')}.",
                "data": {
                    "rating": security_analysis.get("overall_rating", "unknown"),
                    "vulnerabilities_count": security_analysis.get("vulnerabilities_count", 0),
                    "vulnerabilities_by_severity": security_analysis.get("vulnerabilities_by_severity", {})
                }
            }

        # Check for vulnerabilities
        if "vulnerabilit" in query:
            return {
                "response_type": "security_vulnerabilities",
                "message": f"Found {security_analysis.get('vulnerabilities_count', 0)} security vulnerabilities across your integration landscape.",
                "data": {
                    "vulnerabilities_count": security_analysis.get("vulnerabilities_count", 0),
                    "vulnerabilities_by_severity": security_analysis.get("vulnerabilities_by_severity", {}),
                    "common_vulnerabilities": security_analysis.get("common_vulnerabilities", []),
                    "iflows_with_vulnerabilities": security_analysis.get("iflows_with_vulnerabilities", [])
                }
            }

        # Default security overview
        return {
            "response_type": "security_overview",
            "message": "Here's an overview of the security status in your integration landscape.",
            "data": security_analysis
        }

    def _handle_error_handling_query(self, query: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle error handling related queries"""
        error_handling_analysis = self.analysis_results.get("error_handling_analysis", {})

        # Check for specific iFlow
        if entities.get("iflow_name"):
            return self._get_iflow_error_handling_info(entities["iflow_name"])

        # Check for overall rating
        if "rating" in query or "overall" in query:
            return {
                "response_type": "error_handling_rating",
                "message": f"The overall error handling rating for your integration landscape is: {error_handling_analysis.get('overall_rating', 'unknown')}.",
                "data": {
                    "rating": error_handling_analysis.get("overall_rating", "unknown"),
                    "iflows_without_error_handling": len(error_handling_analysis.get("iflows_without_error_handling", []))
                }
            }

        # Check for iFlows without error handling
        if "without" in query or "missing" in query:
            return {
                "response_type": "missing_error_handling",
                "message": f"Found {len(error_handling_analysis.get('iflows_without_error_handling', []))} integration flows without proper error handling.",
                "data": {
                    "iflows_without_error_handling": error_handling_analysis.get("iflows_without_error_handling", [])
                }
            }

        # Default error handling overview
        return {
            "response_type": "error_handling_overview",
            "message": "Here's an overview of error handling in your integration landscape.",
            "data": error_handling_analysis
        }

    def _handle_performance_query(self, query: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle performance related queries"""
        performance_analysis = self.analysis_results.get("performance_analysis", {})

        # Check for specific iFlow
        if entities.get("iflow_name"):
            return self._get_iflow_performance_info(entities["iflow_name"])

        # Check for bottlenecks
        if "bottleneck" in query:
            return {
                "response_type": "performance_bottlenecks",
                "message": f"Found {len(performance_analysis.get('potential_bottlenecks', []))} integration flows with potential performance bottlenecks.",
                "data": {
                    "potential_bottlenecks": performance_analysis.get("potential_bottlenecks", [])
                }
            }

        # Check for message size concerns
        if "message size" in query:
            return {
                "response_type": "message_size_concerns",
                "message": f"Found {len(performance_analysis.get('message_size_concerns', []))} integration flows with message size concerns.",
                "data": {
                    "message_size_concerns": performance_analysis.get("message_size_concerns", [])
                }
            }

        # Check for processing time concerns
        if "processing time" in query:
            return {
                "response_type": "processing_time_concerns",
                "message": f"Found {len(performance_analysis.get('processing_time_concerns', []))} integration flows with processing time concerns.",
                "data": {
                    "processing_time_concerns": performance_analysis.get("processing_time_concerns", [])
                }
            }

        # Default performance overview
        return {
            "response_type": "performance_overview",
            "message": "Here's an overview of performance in your integration landscape.",
            "data": performance_analysis
        }

    def _handle_compliance_query(self, query: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle compliance related queries"""
        compliance_analysis = self.analysis_results.get("compliance_analysis", {})

        # Check for specific iFlow
        if entities.get("iflow_name"):
            return self._get_iflow_compliance_info(entities["iflow_name"])

        # Check for overall score
        if "score" in query or "overall" in query:
            return {
                "response_type": "compliance_score",
                "message": f"The overall compliance score for your integration landscape is: {compliance_analysis.get('overall_compliance_score', 0):.1f}%.",
                "data": {
                    "overall_compliance_score": compliance_analysis.get("overall_compliance_score", 0),
                    "compliance_by_category": compliance_analysis.get("compliance_by_category", {})
                }
            }

        # Check for non-compliant iFlows
        if "non-compliant" in query or "non compliant" in query:
            return {
                "response_type": "non_compliant_iflows",
                "message": f"Found {len(compliance_analysis.get('non_compliant_iflows', []))} non-compliant integration flows.",
                "data": {
                    "non_compliant_iflows": compliance_analysis.get("non_compliant_iflows", [])
                }
            }

        # Default compliance overview
        return {
            "response_type": "compliance_overview",
            "message": "Here's an overview of compliance in your integration landscape.",
            "data": compliance_analysis
        }

    def _handle_recommendations_query(self, query: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle recommendations related queries"""
        recommendations = self.analysis_results.get("recommendations", {})

        # Check for specific iFlow
        if entities.get("iflow_name"):
            return self._get_iflow_recommendations(entities["iflow_name"])

        # Check for high priority recommendations
        if "high" in query or "critical" in query:
            return {
                "response_type": "high_priority_recommendations",
                "message": f"Here are the {len(recommendations.get('high_priority', []))} high priority recommendations for your integration landscape.",
                "data": {
                    "high_priority_recommendations": recommendations.get("high_priority", [])
                }
            }

        # Check for medium priority recommendations
        if "medium" in query or "moderate" in query:
            return {
                "response_type": "medium_priority_recommendations",
                "message": f"Here are the {len(recommendations.get('medium_priority', []))} medium priority recommendations for your integration landscape.",
                "data": {
                    "medium_priority_recommendations": recommendations.get("medium_priority", [])
                }
            }

        # Check for low priority recommendations
        if "low" in query or "minor" in query:
            return {
                "response_type": "low_priority_recommendations",
                "message": f"Here are the {len(recommendations.get('low_priority', []))} low priority recommendations for your integration landscape.",
                "data": {
                    "low_priority_recommendations": recommendations.get("low_priority", [])
                }
            }

        # Default all recommendations
        return {
            "response_type": "all_recommendations",
            "message": "Here are all recommendations for your integration landscape.",
            "data": recommendations
        }

    def _handle_statistics_query(self, query: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle statistics related queries"""
        summary = self.analysis_results.get("summary", {})

        # Check for iFlow count
        if "how many iflow" in query or "number of iflow" in query:
            return {
                "response_type": "iflow_count",
                "message": f"There are {summary.get('iflows_count', 0)} integration flows in your landscape.",
                "data": {
                    "iflows_count": summary.get("iflows_count", 0)
                }
            }

        # Check for package count
        if "how many package" in query or "number of package" in query:
            return {
                "response_type": "package_count",
                "message": f"There are {summary.get('packages_count', 0)} packages in your landscape.",
                "data": {
                    "packages_count": summary.get("packages_count", 0)
                }
            }

        # Check for adapter distribution
        if "adapter" in query and ("distribution" in query or "breakdown" in query):
            adapter_analysis = self.analysis_results.get("adapter_analysis", {})
            return {
                "response_type": "adapter_distribution",
                "message": "Here's the distribution of adapters in your integration landscape.",
                "data": {
                    "sender_adapter_distribution": adapter_analysis.get("sender_adapter_distribution", {}),
                    "receiver_adapter_distribution": adapter_analysis.get("receiver_adapter_distribution", {})
                }
            }

        # Check for deployment model distribution
        if "deployment model" in query and ("distribution" in query or "breakdown" in query):
            deployment_analysis = self.analysis_results.get("deployment_model_analysis", {})
            return {
                "response_type": "deployment_model_distribution",
                "message": "Here's the distribution of deployment models in your integration landscape.",
                "data": {
                    "model_distribution": deployment_analysis.get("model_distribution", {})
                }
            }

        # Default statistics overview
        return {
            "response_type": "statistics_overview",
            "message": "Here are the key statistics for your integration landscape.",
            "data": summary
        }

    def _handle_iflow_details_query(self, query: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle iFlow details related queries"""
        # Check for specific iFlow
        if entities.get("iflow_name"):
            return self._get_iflow_details(entities["iflow_name"])

        # If no specific iFlow, return list of iFlows
        return {
            "response_type": "iflow_list",
            "message": f"There are {len(self.tenant_data.get('iflows', []))} integration flows in your landscape. Please specify which one you'd like details for.",
            "data": {
                "iflows": [{"id": iflow.get("id"), "name": iflow.get("name")} for iflow in self.tenant_data.get("iflows", [])]
            }
        }

    def _handle_general_query(self, query: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general queries"""
        summary = self.analysis_results.get("summary", {})

        # Check for overview or summary
        if "overview" in query or "summary" in query:
            return {
                "response_type": "landscape_overview",
                "message": "Here's an overview of your SAP Integration Suite landscape.",
                "data": summary
            }

        # Check for help
        if "help" in query or "what can you do" in query:
            return {
                "response_type": "help",
                "message": "I can provide insights about your SAP Integration Suite landscape. You can ask me about:",
                "data": {
                    "capabilities": [
                        "Security analysis and vulnerabilities",
                        "Error handling patterns and gaps",
                        "Performance bottlenecks and concerns",
                        "Compliance with best practices",
                        "Recommendations for improvement",
                        "Statistics and distributions",
                        "Details about specific integration flows"
                    ]
                }
            }

        # Default response
        return {
            "response_type": "general",
            "message": "I'm your SAP Integration Suite assistant. How can I help you analyze your integration landscape?",
            "data": None
        }

    def _get_iflow_security_info(self, iflow_name: str) -> Dict[str, Any]:
        """Get security information for a specific iFlow"""
        iflow = self._find_iflow_by_name(iflow_name)

        if not iflow:
            return {
                "response_type": "error",
                "message": f"Could not find an integration flow named '{iflow_name}'.",
                "data": None
            }

        security_data = iflow.get("analysis", {}).get("security", {})

        return {
            "response_type": "iflow_security",
            "message": f"Here's the security information for integration flow '{iflow_name}'.",
            "data": {
                "iflow_id": iflow.get("id"),
                "iflow_name": iflow.get("name"),
                "security": security_data
            }
        }

    def _get_iflow_error_handling_info(self, iflow_name: str) -> Dict[str, Any]:
        """Get error handling information for a specific iFlow"""
        iflow = self._find_iflow_by_name(iflow_name)

        if not iflow:
            return {
                "response_type": "error",
                "message": f"Could not find an integration flow named '{iflow_name}'.",
                "data": None
            }

        error_handling_data = iflow.get("analysis", {}).get("error_handling", {})

        return {
            "response_type": "iflow_error_handling",
            "message": f"Here's the error handling information for integration flow '{iflow_name}'.",
            "data": {
                "iflow_id": iflow.get("id"),
                "iflow_name": iflow.get("name"),
                "error_handling": error_handling_data
            }
        }

    def _get_iflow_performance_info(self, iflow_name: str) -> Dict[str, Any]:
        """Get performance information for a specific iFlow"""
        iflow = self._find_iflow_by_name(iflow_name)

        if not iflow:
            return {
                "response_type": "error",
                "message": f"Could not find an integration flow named '{iflow_name}'.",
                "data": None
            }

        # Extract performance data from analysis results
        performance_analysis = self.analysis_results.get("performance_analysis", {})

        iflow_bottlenecks = next((item for item in performance_analysis.get("potential_bottlenecks", [])
                                if item.get("iflow_id") == iflow.get("id")), None)

        iflow_message_size_concerns = next((item for item in performance_analysis.get("message_size_concerns", [])
                                        if item.get("iflow_id") == iflow.get("id")), None)

        iflow_processing_time_concerns = next((item for item in performance_analysis.get("processing_time_concerns", [])
                                            if item.get("iflow_id") == iflow.get("id")), None)

        return {
            "response_type": "iflow_performance",
            "message": f"Here's the performance information for integration flow '{iflow_name}'.",
            "data": {
                "iflow_id": iflow.get("id"),
                "iflow_name": iflow.get("name"),
                "bottlenecks": iflow_bottlenecks.get("bottlenecks", []) if iflow_bottlenecks else [],
                "message_size_concerns": iflow_message_size_concerns.get("concerns", []) if iflow_message_size_concerns else [],
                "processing_time_concerns": iflow_processing_time_concerns.get("concerns", []) if iflow_processing_time_concerns else []
            }
        }

    def _get_iflow_compliance_info(self, iflow_name: str) -> Dict[str, Any]:
        """Get compliance information for a specific iFlow"""
        iflow = self._find_iflow_by_name(iflow_name)

        if not iflow:
            return {
                "response_type": "error",
                "message": f"Could not find an integration flow named '{iflow_name}'.",
                "data": None
            }

        # Extract compliance data from analysis results
        compliance_analysis = self.analysis_results.get("compliance_analysis", {})

        iflow_compliance = next((item for item in compliance_analysis.get("non_compliant_iflows", [])
                                if item.get("iflow_id") == iflow.get("id")), None)

        if not iflow_compliance:
            # If not in non-compliant list, create a default compliance object
            iflow_compliance = {
                "iflow_id": iflow.get("id"),
                "name": iflow.get("name"),
                "compliance_percentage": 100,
                "issues": []
            }

        return {
            "response_type": "iflow_compliance",
            "message": f"Here's the compliance information for integration flow '{iflow_name}'.",
            "data": iflow_compliance
        }

    def _get_iflow_recommendations(self, iflow_name: str) -> Dict[str, Any]:
        """Get recommendations for a specific iFlow"""
        iflow = self._find_iflow_by_name(iflow_name)

        if not iflow:
            return {
                "response_type": "error",
                "message": f"Could not find an integration flow named '{iflow_name}'.",
                "data": None
            }

        # Extract recommendations for this iFlow
        iflow_recommendations = []

        # Check security recommendations
        security_data = iflow.get("analysis", {}).get("security", {})
        inbound_recommendations = security_data.get("inbound", {}).get("recommendations", [])
        outbound_recommendations = security_data.get("outbound", {}).get("recommendations", [])

        for rec in inbound_recommendations:
            iflow_recommendations.append({
                "category": "Security",
                "recommendation": rec,
                "priority": "High"
            })

        for rec in outbound_recommendations:
            iflow_recommendations.append({
                "category": "Security",
                "recommendation": rec,
                "priority": "High"
            })

        # Check error handling recommendations
        error_handling_data = iflow.get("analysis", {}).get("error_handling", {})
        error_handling_recommendations = error_handling_data.get("recommendations", [])

        for rec in error_handling_recommendations:
            iflow_recommendations.append({
                "category": "Error Handling",
                "recommendation": rec,
                "priority": "Medium"
            })

        # Check deployment model recommendations
        deployment_data = iflow.get("analysis", {}).get("deployment_model", {})
        deployment_recommendations = deployment_data.get("recommendations", [])

        for rec in deployment_recommendations:
            iflow_recommendations.append({
                "category": "Deployment",
                "recommendation": rec,
                "priority": "Medium"
            })

        # Check adapter recommendations
        adapter_data = iflow.get("analysis", {}).get("adapters", {})
        adapter_recommendations = adapter_data.get("recommendations", [])

        for rec in adapter_recommendations:
            iflow_recommendations.append({
                "category": "Adapters",
                "recommendation": rec,
                "priority": "Medium"
            })

        return {
            "response_type": "iflow_recommendations",
            "message": f"Here are {len(iflow_recommendations)} recommendations for integration flow '{iflow_name}'.",
            "data": {
                "iflow_id": iflow.get("id"),
                "iflow_name": iflow.get("name"),
                "recommendations": iflow_recommendations
            }
        }

    def _get_iflow_details(self, iflow_name: str) -> Dict[str, Any]:
        """Get comprehensive details for a specific iFlow"""
        iflow = self._find_iflow_by_name(iflow_name)

        if not iflow:
            return {
                "response_type": "error",
                "message": f"Could not find an integration flow named '{iflow_name}'.",
                "data": None
            }

        # Get package information
        package_id = iflow.get("package_id", "")
        package = next((p for p in self.tenant_data.get("packages", []) if p.get("id") == package_id), {})

        return {
            "response_type": "iflow_details",
            "message": f"Here are the details for integration flow '{iflow_name}'.",
            "data": {
                "iflow_id": iflow.get("id"),
                "iflow_name": iflow.get("name"),
                "description": iflow.get("description", ""),
                "version": iflow.get("version", ""),
                "deployed": iflow.get("deployed", False),
                "package": {
                    "id": package.get("id", ""),
                    "name": package.get("name", "")
                },
                "security": iflow.get("analysis", {}).get("security", {}),
                "error_handling": iflow.get("analysis", {}).get("error_handling", {}),
                "deployment_model": iflow.get("analysis", {}).get("deployment_model", {}),
                "adapters": iflow.get("analysis", {}).get("adapters", {})
            }
        }

    def _find_iflow_by_name(self, iflow_name: str) -> Optional[Dict[str, Any]]:
        """Find an iFlow by name"""
        normalized_name = iflow_name.lower()

        for iflow in self.tenant_data.get("iflows", []):
            if iflow.get("name", "").lower() == normalized_name:
                return iflow

        return None