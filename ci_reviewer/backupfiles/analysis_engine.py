# New file: src/api/analysis_engine.py

import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from collections import Counter

logger = logging.getLogger(__name__)

class IntegrationAnalysisEngine:
    """Engine for analyzing SAP Integration Suite artifacts"""

    def __init__(self, tenant_data: Dict[str, Any]):
        """
        Initialize with tenant data

        Args:
            tenant_data: Dict containing all integration artifacts data
        """
        self.tenant_data = tenant_data
        self.iflows = tenant_data.get("iflows", [])
        self.packages = tenant_data.get("packages", [])
        self.value_mappings = tenant_data.get("valueMappings", [])
        self.results = {}

    def run_comprehensive_analysis(self) -> Dict[str, Any]:
        """
        Run comprehensive analysis on all integration artifacts

        Returns:
            Dict with analysis results
        """
        self.results = {
            "tenant_id": self.tenant_data.get("id", "unknown"),
            "tenant_name": self.tenant_data.get("name", "unknown"),
            "analysis_timestamp": datetime.now().isoformat(),
            "summary": {},
            "security_analysis": self._analyze_security(),
            "error_handling_analysis": self._analyze_error_handling(),
            "deployment_model_analysis": self._analyze_deployment_models(),
            "adapter_analysis": self._analyze_adapters(),
            "performance_analysis": self._analyze_performance(),
            "compliance_analysis": self._analyze_compliance(),
            "recommendations": self._generate_recommendations()
        }

        # Generate summary
        self._generate_summary()

        return self.results

    def _analyze_security(self) -> Dict[str, Any]:
        """Analyze security across all iFlows"""
        security_analysis = {
            "overall_rating": "unknown",
            "vulnerabilities_count": 0,
            "vulnerabilities_by_severity": {"high": 0, "medium": 0, "low": 0},
            "iflows_with_vulnerabilities": [],
            "common_vulnerabilities": [],
            "security_mechanisms_distribution": {}
        }

        # Collect all security mechanisms and vulnerabilities
        all_mechanisms = []
        all_vulnerabilities = []

        for iflow in self.iflows:
            iflow_id = iflow.get("id")
            security_data = iflow.get("analysis", {}).get("security", {})

            # Skip if no security analysis available
            if not security_data:
                continue

            # Collect inbound security data
            inbound = security_data.get("inbound", {})
            mechanisms = inbound.get("mechanisms", [])
            vulnerabilities = inbound.get("vulnerabilities", [])

            all_mechanisms.extend(mechanisms)

            # Assess vulnerability severity and count
            for vuln in vulnerabilities:
                severity = self._assess_vulnerability_severity(vuln)
                all_vulnerabilities.append({"iflow_id": iflow_id, "vulnerability": vuln, "severity": severity})
                security_analysis["vulnerabilities_by_severity"][severity] += 1

            # Collect outbound security data
            outbound = security_data.get("outbound", {})
            mechanisms = outbound.get("mechanisms", [])
            vulnerabilities = outbound.get("vulnerabilities", [])

            all_mechanisms.extend(mechanisms)

            # Assess vulnerability severity and count
            for vuln in vulnerabilities:
                severity = self._assess_vulnerability_severity(vuln)
                all_vulnerabilities.append({"iflow_id": iflow_id, "vulnerability": vuln, "severity": severity})
                security_analysis["vulnerabilities_by_severity"][severity] += 1

            # Track iFlows with vulnerabilities
            if vulnerabilities:
                security_analysis["iflows_with_vulnerabilities"].append({
                    "iflow_id": iflow_id,
                    "name": iflow.get("name", "Unknown"),
                    "vulnerabilities_count": len(vulnerabilities)
                })

        # Calculate total vulnerabilities
        security_analysis["vulnerabilities_count"] = len(all_vulnerabilities)

        # Find common vulnerabilities
        vuln_counter = Counter([v["vulnerability"] for v in all_vulnerabilities])
        security_analysis["common_vulnerabilities"] = [
            {"vulnerability": vuln, "count": count}
            for vuln, count in vuln_counter.most_common(5)
        ]

        # Calculate security mechanisms distribution
        mechanism_counter = Counter(all_mechanisms)
        security_analysis["security_mechanisms_distribution"] = {
            mechanism: count for mechanism, count in mechanism_counter.items()
        }

        # Assess overall security rating
        security_analysis["overall_rating"] = self._assess_overall_security(security_analysis)

        return security_analysis

    def _assess_vulnerability_severity(self, vulnerability: str) -> str:
        """Assess the severity of a vulnerability"""
        # Keywords indicating high severity
        high_severity_keywords = ["unsecured", "no authentication", "plaintext", "weak encryption"]

        # Keywords indicating medium severity
        medium_severity_keywords = ["basic authentication", "password grant", "deprecated"]

        # Check for high severity
        if any(keyword in vulnerability.lower() for keyword in high_severity_keywords):
            return "high"

        # Check for medium severity
        if any(keyword in vulnerability.lower() for keyword in medium_severity_keywords):
            return "medium"

        # Default to low severity
        return "low"

    def _assess_overall_security(self, security_analysis: Dict[str, Any]) -> str:
        """Assess overall security rating"""
        high_count = security_analysis["vulnerabilities_by_severity"]["high"]
        medium_count = security_analysis["vulnerabilities_by_severity"]["medium"]

        if high_count > 0:
            return "critical" if high_count > 5 else "poor"
        elif medium_count > 5:
            return "fair"
        elif medium_count > 0:
            return "good"
        else:
            return "excellent"

    def _analyze_error_handling(self) -> Dict[str, Any]:
        """Analyze error handling across all iFlows"""
        error_handling_analysis = {
            "overall_rating": "unknown",
            "iflows_without_error_handling": [],
            "error_handling_mechanisms_distribution": {},
            "common_gaps": []
        }

        # Collect all error handling mechanisms and gaps
        all_mechanisms = []
        all_gaps = []
        iflows_without_error_handling = []

        for iflow in self.iflows:
            iflow_id = iflow.get("id")
            error_handling_data = iflow.get("analysis", {}).get("error_handling", {})

            # Skip if no error handling analysis available
            if not error_handling_data:
                continue

            mechanisms = error_handling_data.get("mechanisms", [])
            gaps = error_handling_data.get("gaps", [])
            completeness = error_handling_data.get("completeness", "unknown")

            all_mechanisms.extend(mechanisms)
            all_gaps.extend(gaps)

            # Track iFlows without proper error handling
            if completeness in ["minimal", "unknown"] or not mechanisms:
                iflows_without_error_handling.append({
                    "iflow_id": iflow_id,
                    "name": iflow.get("name", "Unknown"),
                    "gaps": gaps
                })

        error_handling_analysis["iflows_without_error_handling"] = iflows_without_error_handling

        # Calculate error handling mechanisms distribution
        mechanism_counter = Counter(all_mechanisms)
        error_handling_analysis["error_handling_mechanisms_distribution"] = {
            mechanism: count for mechanism, count in mechanism_counter.items()
        }

        # Find common gaps
        gap_counter = Counter(all_gaps)
        error_handling_analysis["common_gaps"] = [
            {"gap": gap, "count": count}
            for gap, count in gap_counter.most_common(5)
        ]

        # Assess overall error handling rating
        error_handling_analysis["overall_rating"] = self._assess_overall_error_handling(
            len(iflows_without_error_handling), len(self.iflows)
        )

        return error_handling_analysis

    def _assess_overall_error_handling(self, iflows_without_error_handling: int, total_iflows: int) -> str:
        """Assess overall error handling rating"""
        if total_iflows == 0:
            return "unknown"

        percentage = (iflows_without_error_handling / total_iflows) * 100

        if percentage > 50:
            return "poor"
        elif percentage > 20:
            return "fair"
        elif percentage > 5:
            return "good"
        else:
            return "excellent"

    def _analyze_deployment_models(self) -> Dict[str, Any]:
        """Analyze deployment models across all iFlows"""
        deployment_analysis = {
            "model_distribution": {},
            "cloud_connector_usage": 0,
            "systems_composition": {
                "SAP2SAP": 0,
                "SAP2NONSAP": 0,
                "NONSAP2NONSAP": 0,
                "unknown": 0
            }
        }

        # Collect deployment model data
        model_counter = Counter()
        cloud_connector_count = 0

        for iflow in self.iflows:
            deployment_data = iflow.get("analysis", {}).get("deployment_model", {})

            # Skip if no deployment model analysis available
            if not deployment_data:
                continue

            # Count deployment models
            model = deployment_data.get("model", "unknown")
            model_counter[model] += 1

            # Count cloud connector usage
            if deployment_data.get("cloud_connector_used", False):
                cloud_connector_count += 1

            # Determine systems composition
            systems = deployment_data.get("systems", {})
            sender = systems.get("sender", {})
            receivers = systems.get("receivers", [])

            composition = self._determine_systems_composition(sender, receivers)
            deployment_analysis["systems_composition"][composition] += 1

        # Set model distribution
        deployment_analysis["model_distribution"] = dict(model_counter)

        # Set cloud connector usage
        deployment_analysis["cloud_connector_usage"] = cloud_connector_count

        return deployment_analysis

    def _determine_systems_composition(self, sender: Dict, receivers: List[Dict]) -> str:
        """Determine systems composition based on sender and receivers"""
        if not sender or not receivers:
            return "unknown"

        sender_is_sap = self._is_sap_system(sender)
        receivers_are_sap = [self._is_sap_system(r) for r in receivers]

        if sender_is_sap and all(receivers_are_sap):
            return "SAP2SAP"
        elif sender_is_sap and not all(receivers_are_sap):
            return "SAP2NONSAP"
        elif not sender_is_sap and any(receivers_are_sap):
            return "NONSAP2SAP"
        else:
            return "NONSAP2NONSAP"

    def _is_sap_system(self, system: Dict) -> bool:
        """Determine if a system is an SAP system"""
        # Implementation depends on system data structure
        system_type = system.get("type", "").lower()
        system_name = system.get("name", "").lower()
        system_address = system.get("address", "").lower()

        sap_indicators = ["sap", "s4", "ecc", "bw", "crm", "srm", "scm", "successfactors", "ariba", "concur"]

        return any(indicator in system_type or indicator in system_name or indicator in system_address
                  for indicator in sap_indicators)

    def _analyze_adapters(self) -> Dict[str, Any]:
        """Analyze adapters across all iFlows"""
        adapter_analysis = {
            "sender_adapter_distribution": {},
            "receiver_adapter_distribution": {},
            "protocol_distribution": {},
            "authentication_distribution": {},
            "common_issues": []
        }

        # Collect adapter data
        sender_adapter_counter = Counter()
        receiver_adapter_counter = Counter()
        protocol_counter = Counter()
        auth_counter = Counter()
        all_issues = []

        for iflow in self.iflows:
            adapter_data = iflow.get("analysis", {}).get("adapters", {})

            # Skip if no adapter analysis available
            if not adapter_data:
                continue

            # Collect sender adapter data
            sender = adapter_data.get("sender", {})
            sender_type = sender.get("type", "unknown")
            sender_protocol = sender.get("protocol", "unknown")
            sender_auth = sender.get("authentication", "unknown")
            sender_issues = sender.get("issues", [])

            sender_adapter_counter[sender_type] += 1
            protocol_counter[sender_protocol] += 1
            auth_counter[sender_auth] += 1

            for issue in sender_issues:
                all_issues.append({"iflow_id": iflow.get("id"), "adapter_type": sender_type, "issue": issue})

            # Collect receiver adapter data
            receivers = adapter_data.get("receivers", [])
            for receiver in receivers:
                receiver_type = receiver.get("type", "unknown")
                receiver_protocol = receiver.get("protocol", "unknown")
                receiver_auth = receiver.get("authentication", "unknown")
                receiver_issues = receiver.get("issues", [])

                receiver_adapter_counter[receiver_type] += 1
                protocol_counter[receiver_protocol] += 1
                auth_counter[receiver_auth] += 1

                for issue in receiver_issues:
                    all_issues.append({"iflow_id": iflow.get("id"), "adapter_type": receiver_type, "issue": issue})

        # Set adapter distributions
        adapter_analysis["sender_adapter_distribution"] = dict(sender_adapter_counter)
        adapter_analysis["receiver_adapter_distribution"] = dict(receiver_adapter_counter)
        adapter_analysis["protocol_distribution"] = dict(protocol_counter)
        adapter_analysis["authentication_distribution"] = dict(auth_counter)

        # Find common issues
        issue_counter = Counter([i["issue"] for i in all_issues])
        adapter_analysis["common_issues"] = [
            {"issue": issue, "count": count}
            for issue, count in issue_counter.most_common(5)
        ]

        return adapter_analysis

    def _analyze_performance(self) -> Dict[str, Any]:
        """Analyze performance aspects across all iFlows"""
        performance_analysis = {
            "potential_bottlenecks": [],
            "message_size_concerns": [],
            "processing_time_concerns": []
        }

        # This would typically use runtime data, but we can identify potential issues from design
        for iflow in self.iflows:
            iflow_id = iflow.get("id")
            iflow_name = iflow.get("name", "Unknown")

            # Check for potential bottlenecks in design
            bottlenecks = self._identify_potential_bottlenecks(iflow)
            if bottlenecks:
                performance_analysis["potential_bottlenecks"].append({
                    "iflow_id": iflow_id,
                    "name": iflow_name,
                    "bottlenecks": bottlenecks
                })

            # Check for message size concerns
            message_size_concerns = self._identify_message_size_concerns(iflow)
            if message_size_concerns:
                performance_analysis["message_size_concerns"].append({
                    "iflow_id": iflow_id,
                    "name": iflow_name,
                    "concerns": message_size_concerns
                })

            # Check for processing time concerns
            processing_time_concerns = self._identify_processing_time_concerns(iflow)
            if processing_time_concerns:
                performance_analysis["processing_time_concerns"].append({
                    "iflow_id": iflow_id,
                    "name": iflow_name,
                    "concerns": processing_time_concerns
                })

        return performance_analysis

    def _identify_potential_bottlenecks(self, iflow: Dict) -> List[str]:
        """Identify potential bottlenecks in iFlow design"""
        bottlenecks = []

        # Check for complex mappings
        if self._has_complex_mappings(iflow):
            bottlenecks.append("Complex data mappings may impact performance")

        # Check for multiple database operations
        if self._has_multiple_database_operations(iflow):
            bottlenecks.append("Multiple database operations may cause bottlenecks")

        # Check for large message processing
        if self._processes_large_messages(iflow):
            bottlenecks.append("Processing of large messages may impact performance")

        return bottlenecks

    def _has_complex_mappings(self, iflow: Dict) -> bool:
        """Check if iFlow has complex mappings"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return False

    def _has_multiple_database_operations(self, iflow: Dict) -> bool:
        """Check if iFlow has multiple database operations"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return False

    def _processes_large_messages(self, iflow: Dict) -> bool:
        """Check if iFlow processes large messages"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return False

    def _identify_message_size_concerns(self, iflow: Dict) -> List[str]:
        """Identify message size concerns in iFlow design"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return []

    def _identify_processing_time_concerns(self, iflow: Dict) -> List[str]:
        """Identify processing time concerns in iFlow design"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return []

    def _analyze_compliance(self) -> Dict[str, Any]:
        """Analyze compliance with best practices across all iFlows"""
        compliance_analysis = {
            "overall_compliance_score": 0,
            "compliance_by_category": {},
            "non_compliant_iflows": []
        }

        # Define compliance categories and checks
        compliance_categories = {
            "naming_conventions": self._check_naming_conventions,
            "documentation": self._check_documentation,
            "error_handling": self._check_error_handling_compliance,
            "security": self._check_security_compliance,
            "monitoring": self._check_monitoring_compliance
        }

        # Initialize compliance scores by category
        category_scores = {category: {"score": 0, "max_score": 0} for category in compliance_categories}

        # Check compliance for each iFlow
        non_compliant_iflows = []

        for iflow in self.iflows:
            iflow_id = iflow.get("id")
            iflow_name = iflow.get("name", "Unknown")

            iflow_compliance = {
                "iflow_id": iflow_id,
                "name": iflow_name,
                "score": 0,
                "max_score": 0,
                "issues": []
            }

            # Check compliance for each category
            for category, check_func in compliance_categories.items():
                score, max_score, issues = check_func(iflow)

                category_scores[category]["score"] += score
                category_scores[category]["max_score"] += max_score

                iflow_compliance["score"] += score
                iflow_compliance["max_score"] += max_score

                if issues:
                    iflow_compliance["issues"].extend([f"{category}: {issue}" for issue in issues])

            # Calculate compliance percentage
            if iflow_compliance["max_score"] > 0:
                iflow_compliance["compliance_percentage"] = (iflow_compliance["score"] / iflow_compliance["max_score"]) * 100
            else:
                iflow_compliance["compliance_percentage"] = 0

            # Add to non-compliant iFlows if below threshold
            if iflow_compliance["compliance_percentage"] < 80:
                non_compliant_iflows.append(iflow_compliance)

        # Calculate overall compliance score
        total_score = sum(category["score"] for category in category_scores.values())
        total_max_score = sum(category["max_score"] for category in category_scores.values())

        if total_max_score > 0:
            compliance_analysis["overall_compliance_score"] = (total_score / total_max_score) * 100

        # Calculate compliance by category
        for category, scores in category_scores.items():
            if scores["max_score"] > 0:
                compliance_analysis["compliance_by_category"][category] = (scores["score"] / scores["max_score"]) * 100
            else:
                compliance_analysis["compliance_by_category"][category] = 0

        # Sort non-compliant iFlows by compliance percentage
        non_compliant_iflows.sort(key=lambda x: x["compliance_percentage"])
        compliance_analysis["non_compliant_iflows"] = non_compliant_iflows

        return compliance_analysis

    def _check_naming_conventions(self, iflow: Dict) -> Tuple[int, int, List[str]]:
        """Check compliance with naming conventions"""
        score = 0
        max_score = 3
        issues = []

        # Check iFlow name format
        name = iflow.get("name", "")
        if not name:
            issues.append("Missing iFlow name")
        elif not self._is_valid_iflow_name(name):
            issues.append("iFlow name does not follow convention")
        else:
            score += 1

        # Check package name format
        package_id = iflow.get("package_id", "")
        package = next((p for p in self.packages if p.get("id") == package_id), {})
        package_name = package.get("name", "")

        if not package_name:
            issues.append("Missing package name")
        elif not self._is_valid_package_name(package_name):
            issues.append("Package name does not follow convention")
        else:
            score += 1

        # Check for description
        description = iflow.get("description", "")
        if not description:
            issues.append("Missing iFlow description")
        elif len(description) < 10:
            issues.append("iFlow description is too short")
        else:
            score += 1

        return score, max_score, issues

    def _is_valid_iflow_name(self, name: str) -> bool:
        """Check if iFlow name follows convention"""
        # Implementation depends on naming convention
        # This is a placeholder for the actual implementation
        return True

    def _is_valid_package_name(self, name: str) -> bool:
        """Check if package name follows convention"""
        # Implementation depends on naming convention
        # This is a placeholder for the actual implementation
        return True

    def _check_documentation(self, iflow: Dict) -> Tuple[int, int, List[str]]:
        """Check compliance with documentation requirements"""
        score = 0
        max_score = 3
        issues = []

        # Check for description
        description = iflow.get("description", "")
        if not description:
            issues.append("Missing iFlow description")
        elif len(description) < 10:
            issues.append("iFlow description is too short")
        else:
            score += 1

        # Check for version comments
        version_comments = iflow.get("version_comments", "")
        if not version_comments:
            issues.append("Missing version comments")
        else:
            score += 1

        # Check for documentation of interfaces
        if not self._has_interface_documentation(iflow):
            issues.append("Missing interface documentation")
        else:
            score += 1

        return score, max_score, issues

    def _has_interface_documentation(self, iflow: Dict) -> bool:
        """Check if iFlow has interface documentation"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return True

    def _check_error_handling_compliance(self, iflow: Dict) -> Tuple[int, int, List[str]]:
        """Check compliance with error handling requirements"""
        score = 0
        max_score = 4
        issues = []

        error_handling_data = iflow.get("analysis", {}).get("error_handling", {})

        # Skip if no error handling analysis available
        if not error_handling_data:
            return 0, max_score, ["Missing error handling analysis"]

        mechanisms = error_handling_data.get("mechanisms", [])
        completeness = error_handling_data.get("completeness", "unknown")

        # Check for exception handling
        if "Exception Handling" in mechanisms:
            score += 1
        else:
            issues.append("Missing exception handling")

        # Check for logging
        if "Logging" in mechanisms:
            score += 1
        else:
            issues.append("Missing error logging")

        # Check for retry mechanism
        if "Retry Mechanism" in mechanisms:
            score += 1
        else:
            issues.append("Missing retry mechanism")

        # Check for notification
        if any("Notification" in m for m in mechanisms):
            score += 1
        else:
            issues.append("Missing error notification")

        return score, max_score, issues

    def _check_security_compliance(self, iflow: Dict) -> Tuple[int, int, List[str]]:
        """Check compliance with security requirements"""
        score = 0
        max_score = 4
        issues = []

        security_data = iflow.get("analysis", {}).get("security", {})

        # Skip if no security analysis available
        if not security_data:
            return 0, max_score, ["Missing security analysis"]

        inbound = security_data.get("inbound", {})
        outbound = security_data.get("outbound", {})

        # Check inbound security
        inbound_mechanisms = inbound.get("mechanisms", [])
        inbound_strength = inbound.get("strength", "unknown")

        if inbound_strength in ["strong", "moderate"]:
            score += 1
        else:
            issues.append("Weak inbound security")

        # Check for HTTPS
        if "HTTPS" in inbound_mechanisms:
            score += 1
        else:
            issues.append("Not using HTTPS for inbound communication")

        # Check outbound security
        outbound_mechanisms = outbound.get("mechanisms", [])
        outbound_strength = outbound.get("strength", "unknown")

        if outbound_strength in ["strong", "moderate"]:
            score += 1
        else:
            issues.append("Weak outbound security")

        # Check for authentication
        if any(auth in outbound_mechanisms for auth in ["OAuth 2.0", "Client Certificate", "Basic Authentication"]):
            score += 1
        else:
            issues.append("Missing outbound authentication")

        return score, max_score, issues

    def _check_monitoring_compliance(self, iflow: Dict) -> Tuple[int, int, List[str]]:
        """Check compliance with monitoring requirements"""
        score = 0
        max_score = 3
        issues = []

        # Check for logging
        if self._has_logging_enabled(iflow):
            score += 1
        else:
            issues.append("Logging not enabled")

        # Check for monitoring
        if self._has_monitoring_enabled(iflow):
            score += 1
        else:
            issues.append("Monitoring not enabled")

        # Check for alerting
        if self._has_alerting_configured(iflow):
            score += 1
        else:
            issues.append("Alerting not configured")

        return score, max_score, issues

    def _has_logging_enabled(self, iflow: Dict) -> bool:
        """Check if iFlow has logging enabled"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return True

    def _has_monitoring_enabled(self, iflow: Dict) -> bool:
        """Check if iFlow has monitoring enabled"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return True

    def _has_alerting_configured(self, iflow: Dict) -> bool:
        """Check if iFlow has alerting configured"""
        # Implementation depends on iFlow data structure
        # This is a placeholder for the actual implementation
        return True

    def _generate_recommendations(self) -> Dict[str, Any]:
        """Generate recommendations based on analysis results"""
        recommendations = {
            "high_priority": [],
            "medium_priority": [],
            "low_priority": []
        }

        # Security recommendations
        security_analysis = self.results.get("security_analysis", {})
        security_rating = security_analysis.get("overall_rating", "unknown")

        if security_rating in ["critical", "poor"]:
            recommendations["high_priority"].append({
                "category": "Security",
                "recommendation": "Address critical security vulnerabilities in integration flows",
                "impact": "High",
                "effort": "Medium"
            })

        # Error handling recommendations
        error_handling_analysis = self.results.get("error_handling_analysis", {})
        error_handling_rating = error_handling_analysis.get("overall_rating", "unknown")

        if error_handling_rating in ["poor", "fair"]:
            recommendations["medium_priority"].append({
                "category": "Error Handling",
                "recommendation": "Implement comprehensive error handling in integration flows",
                "impact": "Medium",
                "effort": "Medium"
            })

        # Compliance recommendations
        compliance_analysis = self.results.get("compliance_analysis", {})
        compliance_score = compliance_analysis.get("overall_compliance_score", 0)

        if compliance_score < 70:
            recommendations["medium_priority"].append({
                "category": "Compliance",
                "recommendation": "Improve compliance with integration best practices",
                "impact": "Medium",
                "effort": "High"
            })

        # Performance recommendations
        performance_analysis = self.results.get("performance_analysis", {})
        bottlenecks = performance_analysis.get("potential_bottlenecks", [])

        if bottlenecks:
            recommendations["medium_priority"].append({
                "category": "Performance",
                "recommendation": "Address potential performance bottlenecks in integration flows",
                "impact": "Medium",
                "effort": "High"
            })

        # Add more recommendations based on analysis results

        return recommendations

    def _generate_summary(self) -> None:
        """Generate summary of analysis results"""
        self.results["summary"] = {
            "iflows_count": len(self.iflows),
            "packages_count": len(self.packages),
            "security_rating": self.results.get("security_analysis", {}).get("overall_rating", "unknown"),
            "error_handling_rating": self.results.get("error_handling_analysis", {}).get("overall_rating", "unknown"),
            "compliance_score": self.results.get("compliance_analysis", {}).get("overall_compliance_score", 0),
            "high_priority_recommendations": len(self.results.get("recommendations", {}).get("high_priority", [])),
            "medium_priority_recommendations": len(self.results.get("recommendations", {}).get("medium_priority", [])),
            "low_priority_recommendations": len(self.results.get("recommendations", {}).get("low_priority", []))
        }