import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TestTube,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Clock,
  FileText,
  BarChart,
} from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: "functional" | "integration" | "performance" | "security";
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  duration?: number;
  errorMessage?: string;
}

interface TestSuite {
  id: string;
  iflowId: string;
  iflowName: string;
  testCases: TestCase[];
  status: "pending" | "running" | "completed";
  passedTests: number;
  failedTests: number;
  totalTests: number;
  duration: number;
}

interface Stage8Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage8Testing: React.FC<Stage8Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [testingComplete, setTestingComplete] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  // Generate test suites based on deployed iFlows
  useEffect(() => {
    const deployedIFlows = data.deploymentStatus?.deployedIFlows || [];
    const iflowNames = {
      "iflow-001": "Customer Master Data Sync",
      "iflow-002": "Customer Address Validation",
      "iflow-003": "Order Processing Workflow",
      "iflow-004": "Order Status Updates",
      "iflow-005": "Inventory Sync",
      "iflow-006": "Financial Data Export",
      "iflow-007": "GL Account Mapping",
    };

    const testCaseTemplates = [
      {
        name: "Basic Connectivity Test",
        description: "Verify endpoint accessibility and authentication",
        category: "functional" as const,
      },
      {
        name: "Data Validation Test",
        description: "Validate input/output data formats and schemas",
        category: "functional" as const,
      },
      {
        name: "Error Handling Test",
        description: "Test error scenarios and exception handling",
        category: "functional" as const,
      },
      {
        name: "Integration Flow Test",
        description: "End-to-end integration flow validation",
        category: "integration" as const,
      },
      {
        name: "Performance Load Test",
        description: "Test performance under normal load conditions",
        category: "performance" as const,
      },
      {
        name: "Security Authentication Test",
        description: "Validate security and authentication mechanisms",
        category: "security" as const,
      },
      {
        name: "Stress Test",
        description: "Test behavior under high load conditions",
        category: "performance" as const,
      },
      {
        name: "Data Integrity Test",
        description: "Verify data consistency and integrity",
        category: "integration" as const,
      },
    ];

    const suites: TestSuite[] = deployedIFlows.map((iflow: any) => {
      // Generate relevant test cases for each iFlow
      const relevantTests = testCaseTemplates
        .filter(() => Math.random() > 0.3) // Randomly include ~70% of tests
        .map((template, index) => ({
          id: `test-${iflow.id}-${index}`,
          name: template.name,
          description: template.description,
          category: template.category,
          status: "pending" as const,
        }));

      return {
        id: `suite-${iflow.id}`,
        iflowId: iflow.id,
        iflowName: iflow.name,
        testCases: relevantTests,
        status: "pending",
        passedTests: 0,
        failedTests: 0,
        totalTests: relevantTests.length,
        duration: 0,
      };
    });

    setTestSuites(suites);
  }, [data.deploymentStatus]);

  const runAllTests = async () => {
    setIsTesting(true);
    const startTime = Date.now();

    for (let suiteIndex = 0; suiteIndex < testSuites.length; suiteIndex++) {
      const suite = testSuites[suiteIndex];

      // Update suite status to running
      setTestSuites((prev) =>
        prev.map((s) => (s.id === suite.id ? { ...s, status: "running" } : s)),
      );

      let passedCount = 0;
      let failedCount = 0;
      const suiteStartTime = Date.now();

      // Run each test case in the suite
      for (let testIndex = 0; testIndex < suite.testCases.length; testIndex++) {
        const testCase = suite.testCases[testIndex];

        // Update test case status to running
        setTestSuites((prev) =>
          prev.map((s) =>
            s.id === suite.id
              ? {
                  ...s,
                  testCases: s.testCases.map((tc) =>
                    tc.id === testCase.id ? { ...tc, status: "running" } : tc,
                  ),
                }
              : s,
          ),
        );

        // Simulate test execution time
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 2000 + 500),
        );

        // Simulate test result (85% pass rate)
        const testPassed = Math.random() > 0.15;
        const testDuration = Math.floor(Math.random() * 5000 + 1000);

        if (testPassed) {
          passedCount++;
        } else {
          failedCount++;
        }

        // Update test case with result
        setTestSuites((prev) =>
          prev.map((s) =>
            s.id === suite.id
              ? {
                  ...s,
                  testCases: s.testCases.map((tc) =>
                    tc.id === testCase.id
                      ? {
                          ...tc,
                          status: testPassed ? "passed" : "failed",
                          duration: testDuration,
                          errorMessage: testPassed
                            ? undefined
                            : "Test assertion failed - expected response not received",
                        }
                      : tc,
                  ),
                }
              : s,
          ),
        );
      }

      // Update suite completion
      const suiteDuration = Date.now() - suiteStartTime;
      setTestSuites((prev) =>
        prev.map((s) =>
          s.id === suite.id
            ? {
                ...s,
                status: "completed",
                passedTests: passedCount,
                failedTests: failedCount,
                duration: suiteDuration,
              }
            : s,
        ),
      );

      // Update overall progress
      setOverallProgress(
        Math.round(((suiteIndex + 1) / testSuites.length) * 100),
      );
    }

    setIsTesting(false);
    setTestingComplete(true);
  };

  const retryFailedTests = async () => {
    const suitesWithFailures = testSuites.filter((s) => s.failedTests > 0);

    for (const suite of suitesWithFailures) {
      const failedTests = suite.testCases.filter(
        (tc) => tc.status === "failed",
      );

      for (const testCase of failedTests) {
        // Update test case status to running
        setTestSuites((prev) =>
          prev.map((s) =>
            s.id === suite.id
              ? {
                  ...s,
                  testCases: s.testCases.map((tc) =>
                    tc.id === testCase.id ? { ...tc, status: "running" } : tc,
                  ),
                }
              : s,
          ),
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Retry usually has better success rate
        const retryPassed = Math.random() > 0.3;
        const testDuration = Math.floor(Math.random() * 3000 + 500);

        setTestSuites((prev) =>
          prev.map((s) =>
            s.id === suite.id
              ? {
                  ...s,
                  testCases: s.testCases.map((tc) =>
                    tc.id === testCase.id
                      ? {
                          ...tc,
                          status: retryPassed ? "passed" : "failed",
                          duration: testDuration,
                          errorMessage: retryPassed
                            ? undefined
                            : "Retry failed - persistent system issue detected",
                        }
                      : tc,
                  ),
                  passedTests: retryPassed ? s.passedTests + 1 : s.passedTests,
                  failedTests: retryPassed ? s.failedTests - 1 : s.failedTests,
                }
              : s,
          ),
        );
      }
    }
  };

  const generateReport = () => {
    const report = {
      executionSummary: {
        totalSuites: testSuites.length,
        totalTests: testSuites.reduce(
          (acc, suite) => acc + suite.totalTests,
          0,
        ),
        passedTests: testSuites.reduce(
          (acc, suite) => acc + suite.passedTests,
          0,
        ),
        failedTests: testSuites.reduce(
          (acc, suite) => acc + suite.failedTests,
          0,
        ),
        totalDuration: testSuites.reduce(
          (acc, suite) => acc + suite.duration,
          0,
        ),
        successRate: Math.round(
          (testSuites.reduce((acc, suite) => acc + suite.passedTests, 0) /
            testSuites.reduce((acc, suite) => acc + suite.totalTests, 0)) *
            100,
        ),
      },
      testSuites,
      generatedAt: new Date().toLocaleString(),
    };

    // Simulate download
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    const testResults = {
      totalSuites: testSuites.length,
      totalTests: testSuites.reduce((acc, suite) => acc + suite.totalTests, 0),
      passedTests: testSuites.reduce(
        (acc, suite) => acc + suite.passedTests,
        0,
      ),
      failedTests: testSuites.reduce(
        (acc, suite) => acc + suite.failedTests,
        0,
      ),
      successRate: Math.round(
        (testSuites.reduce((acc, suite) => acc + suite.passedTests, 0) /
          testSuites.reduce((acc, suite) => acc + suite.totalTests, 0)) *
          100,
      ),
      testDuration: testSuites.reduce((acc, suite) => acc + suite.duration, 0),
      completedAt: new Date().toLocaleString(),
    };

    onComplete({ testResults });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case "skipped":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-gray-100 text-gray-800",
      running: "bg-blue-100 text-blue-800",
      passed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      skipped: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "functional":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "integration":
        return <BarChart className="w-4 h-4 text-purple-500" />;
      case "performance":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "security":
        return <TestTube className="w-4 h-4 text-red-500" />;
      default:
        return <TestTube className="w-4 h-4 text-gray-500" />;
    }
  };

  const totalTests = testSuites.reduce(
    (acc, suite) => acc + suite.totalTests,
    0,
  );
  const passedTests = testSuites.reduce(
    (acc, suite) => acc + suite.passedTests,
    0,
  );
  const failedTests = testSuites.reduce(
    (acc, suite) => acc + suite.failedTests,
    0,
  );
  const successRate =
    totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center space-x-3 mb-4">
          <TestTube className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-green-900">
            Test Suite Execution
          </h3>
        </div>
        <p className="text-green-700 mb-4">
          Execute comprehensive test suites for all deployed iFlows and generate
          detailed reports.
        </p>
        <div className="flex items-center space-x-4 text-sm text-green-600">
          <span>🧪 Test Suites: {testSuites.length}</span>
          <span>📊 Total Tests: {totalTests}</span>
          <span>✅ Passed: {passedTests}</span>
          <span>❌ Failed: {failedTests}</span>
          <span>📈 Success Rate: {successRate}%</span>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <TestTube className="w-5 h-5 mr-2" />
              Testing Progress
            </span>
            <Badge
              className={
                testingComplete
                  ? "bg-green-100 text-green-800"
                  : isTesting
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
              }
            >
              {testingComplete ? "Complete" : isTesting ? "Testing" : "Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-bold text-gray-900">
                {overallProgress}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalTests}
                </div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {passedTests}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {failedTests}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {successRate}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>

            {!isTesting && !testingComplete && testSuites.length > 0 && (
              <div className="flex justify-center">
                <Button
                  onClick={runAllTests}
                  className="flex items-center bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </Button>
              </div>
            )}

            {failedTests > 0 && testingComplete && (
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={retryFailedTests}
                  variant="outline"
                  className="flex items-center"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Retry Failed Tests
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Suites */}
      <div className="space-y-4">
        {testSuites.map((suite) => (
          <Card key={suite.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <TestTube className="w-5 h-5 mr-2" />
                  {suite.iflowName}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(suite.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedSuite(
                        selectedSuite === suite.id ? null : suite.id,
                      )
                    }
                  >
                    {selectedSuite === suite.id ? "Hide" : "Details"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{suite.passedTests} Passed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>{suite.failedTests} Failed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>
                      {suite.duration > 0
                        ? `${Math.round(suite.duration / 1000)}s`
                        : "0s"}
                    </span>
                  </div>
                </div>

                {suite.status === "running" && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Running tests...</span>
                      <span>
                        {suite.passedTests + suite.failedTests} /{" "}
                        {suite.totalTests}
                      </span>
                    </div>
                    <Progress
                      value={
                        ((suite.passedTests + suite.failedTests) /
                          suite.totalTests) *
                        100
                      }
                    />
                  </div>
                )}

                {selectedSuite === suite.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-gray-900">Test Cases</h4>
                    {suite.testCases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          testCase.status === "passed"
                            ? "border-l-green-500 bg-green-50"
                            : testCase.status === "failed"
                              ? "border-l-red-500 bg-red-50"
                              : testCase.status === "running"
                                ? "border-l-blue-500 bg-blue-50"
                                : "border-l-gray-300 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getCategoryIcon(testCase.category)}
                              <span className="font-medium">
                                {testCase.name}
                              </span>
                              {getStatusBadge(testCase.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {testCase.description}
                            </p>
                            {testCase.duration && (
                              <p className="text-xs text-gray-500">
                                Duration: {testCase.duration}ms
                              </p>
                            )}
                            {testCase.errorMessage && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {testCase.errorMessage}
                              </p>
                            )}
                          </div>
                          <div className="ml-3">
                            {getStatusIcon(testCase.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Summary and Actions */}
      {testingComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Testing Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-green-700">
                All test suites have been executed. {passedTests} of{" "}
                {totalTests} tests passed ({successRate}% success rate).
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={generateReport}
                  variant="outline"
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() =>
                    alert("Email functionality would be implemented here")
                  }
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Report
                </Button>
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
          <FileText className="w-4 h-4 mr-2" />
          Back to Deploy
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!testingComplete}
          className="flex items-center bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Pipeline
        </Button>
      </div>
    </div>
  );
};

export default Stage8Testing;
