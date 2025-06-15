import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Eye,
} from "lucide-react";

interface ValidationRule {
  id: string;
  category: string;
  rule: string;
  description: string;
  severity: "error" | "warning" | "info";
  weight: number;
}

interface ValidationResult {
  iflowId: string;
  iflowName: string;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  warningRules: number;
  complianceScore: number;
  results: {
    ruleId: string;
    status: "pass" | "fail" | "warning";
    message: string;
  }[];
}

interface Stage4Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage4Validation: React.FC<Stage4Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedIFlow, setSelectedIFlow] = useState<string | null>(null);

  // Mock validation rules
  const mockValidationRules: ValidationRule[] = [
    {
      id: "rule-001",
      category: "Security",
      rule: "Credential Storage",
      description: "All credentials must be stored in secure parameter store",
      severity: "error",
      weight: 10,
    },
    {
      id: "rule-002",
      category: "Security",
      rule: "HTTPS Usage",
      description: "All external communications must use HTTPS",
      severity: "error",
      weight: 8,
    },
    {
      id: "rule-003",
      category: "Performance",
      rule: "Batch Size Limit",
      description: "Batch size should not exceed 1000 records",
      severity: "warning",
      weight: 5,
    },
    {
      id: "rule-004",
      category: "Error Handling",
      rule: "Exception Handling",
      description: "All flows must have proper exception handling",
      severity: "error",
      weight: 9,
    },
    {
      id: "rule-005",
      category: "Monitoring",
      rule: "Logging Standards",
      description: "Adequate logging must be implemented",
      severity: "warning",
      weight: 6,
    },
    {
      id: "rule-006",
      category: "Documentation",
      rule: "Flow Documentation",
      description: "Flow must have proper documentation",
      severity: "info",
      weight: 3,
    },
    {
      id: "rule-007",
      category: "Performance",
      rule: "Timeout Configuration",
      description: "Timeouts must be configured for external calls",
      severity: "warning",
      weight: 7,
    },
    {
      id: "rule-008",
      category: "Security",
      rule: "Input Validation",
      description: "All inputs must be validated",
      severity: "error",
      weight: 8,
    },
  ];

  useEffect(() => {
    // Simulate validation process
    setTimeout(() => {
      const selectedIFlows = data.selectedIFlows || [];
      const iflowNames = {
        "iflow-001": "Customer Master Data Sync",
        "iflow-002": "Customer Address Validation",
        "iflow-003": "Order Processing Workflow",
        "iflow-004": "Order Status Updates",
        "iflow-005": "Inventory Sync",
        "iflow-006": "Financial Data Export",
        "iflow-007": "GL Account Mapping",
      };

      const results: ValidationResult[] = selectedIFlows.map(
        (iflowId: string) => {
          const ruleResults = mockValidationRules.map((rule) => {
            // Simulate random validation results
            const rand = Math.random();
            let status: "pass" | "fail" | "warning";
            let message: string;

            if (rule.severity === "error") {
              status = rand > 0.15 ? "pass" : "fail";
              message =
                status === "pass"
                  ? `${rule.rule} validation passed`
                  : `${rule.rule} validation failed - requires immediate attention`;
            } else if (rule.severity === "warning") {
              status = rand > 0.3 ? "pass" : "warning";
              message =
                status === "pass"
                  ? `${rule.rule} validation passed`
                  : `${rule.rule} validation warning - consider optimization`;
            } else {
              status = rand > 0.5 ? "pass" : "warning";
              message =
                status === "pass"
                  ? `${rule.rule} validation passed`
                  : `${rule.rule} - documentation could be improved`;
            }

            return {
              ruleId: rule.id,
              status,
              message,
            };
          });

          const passedRules = ruleResults.filter(
            (r) => r.status === "pass",
          ).length;
          const failedRules = ruleResults.filter(
            (r) => r.status === "fail",
          ).length;
          const warningRules = ruleResults.filter(
            (r) => r.status === "warning",
          ).length;

          // Calculate compliance score based on rule weights
          let totalWeight = 0;
          let achievedWeight = 0;

          mockValidationRules.forEach((rule) => {
            const result = ruleResults.find((r) => r.ruleId === rule.id);
            totalWeight += rule.weight;
            if (result?.status === "pass") {
              achievedWeight += rule.weight;
            } else if (result?.status === "warning") {
              achievedWeight += rule.weight * 0.5; // Half credit for warnings
            }
          });

          const complianceScore = Math.round(
            (achievedWeight / totalWeight) * 100,
          );

          return {
            iflowId,
            iflowName: iflowNames[iflowId] || `iFlow ${iflowId}`,
            totalRules: mockValidationRules.length,
            passedRules,
            failedRules,
            warningRules,
            complianceScore,
            results: ruleResults,
          };
        },
      );

      setValidationResults(results);
      setLoading(false);
    }, 2000);
  }, [data.selectedIFlows]);

  const handleContinue = () => {
    const overallCompliance =
      validationResults.reduce(
        (acc, result) => acc + result.complianceScore,
        0,
      ) / validationResults.length;

    onComplete({
      validationResults,
      overallCompliance: Math.round(overallCompliance),
      totalIFlows: validationResults.length,
      criticalIssues: validationResults.reduce(
        (acc, result) => acc + result.failedRules,
        0,
      ),
    });
    onNext();
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90)
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70)
      return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-6 border border-pink-200">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-pink-600 animate-pulse" />
            <h3 className="text-xl font-bold text-pink-900">
              Design Guidelines Validation
            </h3>
          </div>
          <p className="text-pink-700 mb-4">
            Validating your iFlows against enterprise design guidelines and best
            practices...
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">
              Running validation checks...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallCompliance =
    validationResults.reduce((acc, result) => acc + result.complianceScore, 0) /
    validationResults.length;

  const totalCriticalIssues = validationResults.reduce(
    (acc, result) => acc + result.failedRules,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-6 border border-pink-200">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-pink-600" />
          <h3 className="text-xl font-bold text-pink-900">
            Design Guidelines Validation
          </h3>
        </div>
        <p className="text-pink-700 mb-4">
          Validation results for your iFlows against enterprise design
          guidelines and security standards.
        </p>
        <div className="flex items-center space-x-4 text-sm text-pink-600">
          <span>🔍 iFlows Validated: {validationResults.length}</span>
          <span>📊 Overall Compliance: {Math.round(overallCompliance)}%</span>
          <span>🚨 Critical Issues: {totalCriticalIssues}</span>
        </div>
      </div>

      {/* Overall Summary */}
      <Card className="border-l-4 border-l-pink-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Validation Summary
            </span>
            {getComplianceBadge(overallCompliance)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${getComplianceColor(overallCompliance)}`}
              >
                {Math.round(overallCompliance)}%
              </div>
              <div className="text-sm text-gray-600">Overall Compliance</div>
              <Progress value={overallCompliance} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {validationResults.reduce(
                  (acc, result) => acc + result.passedRules,
                  0,
                )}
              </div>
              <div className="text-sm text-gray-600">Rules Passed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {validationResults.reduce(
                  (acc, result) => acc + result.warningRules,
                  0,
                )}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {totalCriticalIssues}
              </div>
              <div className="text-sm text-gray-600">Critical Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual iFlow Results */}
      <div className="grid gap-4">
        {validationResults.map((result) => (
          <Card
            key={result.iflowId}
            className="hover:shadow-lg transition-all duration-300"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  {result.iflowName}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {getComplianceBadge(result.complianceScore)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedIFlow(
                        selectedIFlow === result.iflowId
                          ? null
                          : result.iflowId,
                      )
                    }
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {selectedIFlow === result.iflowId ? "Hide" : "Details"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Compliance Score
                  </span>
                  <span
                    className={`text-lg font-bold ${getComplianceColor(result.complianceScore)}`}
                  >
                    {result.complianceScore}%
                  </span>
                </div>
                <Progress value={result.complianceScore} />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{result.passedRules} Passed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span>{result.warningRules} Warnings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>{result.failedRules} Failed</span>
                  </div>
                </div>

                {selectedIFlow === result.iflowId && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-gray-900">
                      Detailed Results
                    </h4>
                    {result.results.map((ruleResult, index) => {
                      const rule = mockValidationRules.find(
                        (r) => r.ruleId === ruleResult.ruleId,
                      );
                      return (
                        <div
                          key={ruleResult.ruleId}
                          className={`p-3 rounded-lg border-l-4 ${
                            ruleResult.status === "pass"
                              ? "border-l-green-500 bg-green-50"
                              : ruleResult.status === "warning"
                                ? "border-l-yellow-500 bg-yellow-50"
                                : "border-l-red-500 bg-red-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {rule?.category}
                                </Badge>
                                <span className="font-medium">
                                  {rule?.rule}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {ruleResult.message}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {ruleResult.status === "pass" && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                              {ruleResult.status === "warning" && (
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                              )}
                              {ruleResult.status === "fail" && (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Warning */}
      {overallCompliance < 70 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900 mb-2">
                  Compliance Below Threshold
                </h3>
                <p className="text-sm text-red-700">
                  The overall compliance score is{" "}
                  {Math.round(overallCompliance)}%, which is below the
                  recommended 70% threshold. Please review and address the
                  critical issues before proceeding to deployment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to Configuration
        </Button>
        <Button
          onClick={handleContinue}
          className="flex items-center"
          disabled={totalCriticalIssues > 0}
        >
          Continue to Dependencies
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Stage4Validation;
