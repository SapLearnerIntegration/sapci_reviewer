import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Rocket,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Clock,
  Server,
  Activity,
} from "lucide-react";

interface DeploymentItem {
  id: string;
  iflowId: string;
  iflowName: string;
  status: "pending" | "deploying" | "deployed" | "failed" | "starting";
  progress: number;
  deploymentTime?: string;
  runtimeStatus?: "started" | "stopped" | "error";
  errorMessage?: string;
  endpoint?: string;
}

interface Stage7Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage7Deploy: React.FC<Stage7Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [deploymentItems, setDeploymentItems] = useState<DeploymentItem[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentComplete, setDeploymentComplete] = useState(false);

  // Generate deployment items based on uploaded artifacts
  useEffect(() => {
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

    const items: DeploymentItem[] = selectedIFlows.map((iflowId: string) => ({
      id: `deploy-${iflowId}`,
      iflowId,
      iflowName: iflowNames[iflowId] || `iFlow ${iflowId}`,
      status: "pending",
      progress: 0,
      endpoint: `https://dev-integration.company.com/flows/${iflowId}`,
    }));

    setDeploymentItems(items);
  }, [data.selectedIFlows]);

  const startDeployment = async () => {
    setIsDeploying(true);

    for (let i = 0; i < deploymentItems.length; i++) {
      const item = deploymentItems[i];

      // Phase 1: Deploy to runtime
      setDeploymentItems((prev) =>
        prev.map((deployItem) =>
          deployItem.id === item.id
            ? { ...deployItem, status: "deploying", progress: 0 }
            : deployItem,
        ),
      );

      // Simulate deployment progress
      for (let progress = 0; progress <= 70; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setDeploymentItems((prev) =>
          prev.map((deployItem) =>
            deployItem.id === item.id
              ? { ...deployItem, progress }
              : deployItem,
          ),
        );
      }

      // Simulate deployment result
      const deploymentSuccess = Math.random() > 0.15; // 85% success rate

      if (deploymentSuccess) {
        setDeploymentItems((prev) =>
          prev.map((deployItem) =>
            deployItem.id === item.id
              ? {
                  ...deployItem,
                  status: "deployed",
                  progress: 70,
                  deploymentTime: new Date().toLocaleString(),
                }
              : deployItem,
          ),
        );

        // Phase 2: Start the runtime
        await new Promise((resolve) => setTimeout(resolve, 500));

        setDeploymentItems((prev) =>
          prev.map((deployItem) =>
            deployItem.id === item.id
              ? { ...deployItem, status: "starting", progress: 80 }
              : deployItem,
          ),
        );

        // Simulate startup
        for (let progress = 80; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          setDeploymentItems((prev) =>
            prev.map((deployItem) =>
              deployItem.id === item.id
                ? { ...deployItem, progress }
                : deployItem,
            ),
          );
        }

        // Final status
        const startupSuccess = Math.random() > 0.1; // 90% startup success

        setDeploymentItems((prev) =>
          prev.map((deployItem) =>
            deployItem.id === item.id
              ? {
                  ...deployItem,
                  progress: 100,
                  runtimeStatus: startupSuccess ? "started" : "error",
                  errorMessage: startupSuccess
                    ? undefined
                    : "Runtime startup failed - check configuration",
                }
              : deployItem,
          ),
        );
      } else {
        setDeploymentItems((prev) =>
          prev.map((deployItem) =>
            deployItem.id === item.id
              ? {
                  ...deployItem,
                  status: "failed",
                  progress: 100,
                  errorMessage: "Deployment failed - artifact validation error",
                }
              : deployItem,
          ),
        );
      }

      // Update overall progress
      setOverallProgress(Math.round(((i + 1) / deploymentItems.length) * 100));
    }

    setIsDeploying(false);
    setDeploymentComplete(true);
  };

  const retryFailedDeployments = async () => {
    const failedItems = deploymentItems.filter(
      (item) => item.status === "failed",
    );

    for (const item of failedItems) {
      setDeploymentItems((prev) =>
        prev.map((deployItem) =>
          deployItem.id === item.id
            ? { ...deployItem, status: "deploying", progress: 0 }
            : deployItem,
        ),
      );

      // Simulate retry deployment
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setDeploymentItems((prev) =>
          prev.map((deployItem) =>
            deployItem.id === item.id
              ? { ...deployItem, progress }
              : deployItem,
          ),
        );
      }

      // Retry usually succeeds
      const retrySuccess = Math.random() > 0.2;

      setDeploymentItems((prev) =>
        prev.map((deployItem) =>
          deployItem.id === item.id
            ? {
                ...deployItem,
                status: retrySuccess ? "deployed" : "failed",
                deploymentTime: retrySuccess
                  ? new Date().toLocaleString()
                  : undefined,
                runtimeStatus: retrySuccess ? "started" : undefined,
                errorMessage: retrySuccess
                  ? undefined
                  : "Retry failed - contact system administrator",
              }
            : deployItem,
        ),
      );
    }
  };

  const handleContinue = () => {
    const deploymentSummary = {
      totalDeployments: deploymentItems.length,
      successfulDeployments: deploymentItems.filter(
        (item) =>
          item.status === "deployed" && item.runtimeStatus === "started",
      ).length,
      failedDeployments: deploymentItems.filter(
        (item) => item.status === "failed" || item.runtimeStatus === "error",
      ).length,
      deployedIFlows: deploymentItems
        .filter((item) => item.status === "deployed")
        .map((item) => ({
          id: item.iflowId,
          name: item.iflowName,
          endpoint: item.endpoint,
          status: item.runtimeStatus,
        })),
      deploymentTime: new Date().toLocaleString(),
    };

    onComplete({ deploymentStatus: deploymentSummary });
    onNext();
  };

  const getStatusIcon = (item: DeploymentItem) => {
    if (item.status === "deploying" || item.status === "starting") {
      return (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    }

    if (item.status === "failed") {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }

    if (item.status === "deployed") {
      if (item.runtimeStatus === "started") {
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      }
      if (item.runtimeStatus === "error") {
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      }
      return <Activity className="w-4 h-4 text-blue-500" />;
    }

    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (item: DeploymentItem) => {
    if (item.status === "failed") {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }

    if (item.status === "deployed") {
      if (item.runtimeStatus === "started") {
        return <Badge className="bg-green-100 text-green-800">Running</Badge>;
      }
      if (item.runtimeStatus === "error") {
        return <Badge className="bg-yellow-100 text-yellow-800">Error</Badge>;
      }
      return <Badge className="bg-blue-100 text-blue-800">Deployed</Badge>;
    }

    if (item.status === "deploying") {
      return <Badge className="bg-blue-100 text-blue-800">Deploying</Badge>;
    }

    if (item.status === "starting") {
      return <Badge className="bg-purple-100 text-purple-800">Starting</Badge>;
    }

    return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
  };

  const getPhaseLabel = (item: DeploymentItem) => {
    if (item.status === "deploying") {
      return "Deploying to Runtime";
    }
    if (item.status === "starting") {
      return "Starting Runtime";
    }
    if (item.status === "deployed") {
      return "Deployment Complete";
    }
    if (item.status === "failed") {
      return "Deployment Failed";
    }
    return "Pending Deployment";
  };

  const deployedCount = deploymentItems.filter(
    (item) => item.status === "deployed" && item.runtimeStatus === "started",
  ).length;
  const failedCount = deploymentItems.filter(
    (item) => item.status === "failed" || item.runtimeStatus === "error",
  ).length;
  const pendingCount = deploymentItems.filter(
    (item) => item.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-yellow-50 to-green-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center space-x-3 mb-4">
          <Rocket className="w-6 h-6 text-yellow-600" />
          <h3 className="text-xl font-bold text-yellow-900">
            Deploy to Runtime Environment
          </h3>
        </div>
        <p className="text-yellow-700 mb-4">
          Deploy your iFlow artifacts from design-time to runtime environment
          and start the integration flows.
        </p>
        <div className="flex items-center space-x-4 text-sm text-yellow-600">
          <span>🚀 Total Deployments: {deploymentItems.length}</span>
          <span>✅ Running: {deployedCount}</span>
          <span>❌ Failed: {failedCount}</span>
          <span>⏳ Pending: {pendingCount}</span>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Rocket className="w-5 h-5 mr-2" />
              Deployment Progress
            </span>
            <Badge
              className={
                deploymentComplete
                  ? "bg-green-100 text-green-800"
                  : isDeploying
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }
            >
              {deploymentComplete
                ? "Complete"
                : isDeploying
                  ? "Deploying"
                  : "Ready"}
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
                  {deploymentItems.length}
                </div>
                <div className="text-sm text-gray-600">Total iFlows</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {deployedCount}
                </div>
                <div className="text-sm text-gray-600">Running</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {failedCount}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {pendingCount}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>

            {!isDeploying && !deploymentComplete && (
              <div className="flex justify-center">
                <Button
                  onClick={startDeployment}
                  className="flex items-center bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Deployment
                </Button>
              </div>
            )}

            {failedCount > 0 && deploymentComplete && (
              <div className="flex justify-center">
                <Button
                  onClick={retryFailedDeployments}
                  variant="outline"
                  className="flex items-center"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Retry Failed Deployments
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Items List */}
      <div className="space-y-4">
        {deploymentItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    <Server className="w-5 h-5 text-blue-500" />
                    {getStatusIcon(item)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {item.iflowName}
                      </h4>
                      {getStatusBadge(item)}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {getPhaseLabel(item)}
                      </div>
                      {item.endpoint && (
                        <div>
                          <span className="font-medium">Endpoint:</span>{" "}
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {item.endpoint}
                          </code>
                        </div>
                      )}
                      {item.deploymentTime && (
                        <div>
                          <span className="font-medium">Deployed:</span>{" "}
                          {item.deploymentTime}
                        </div>
                      )}
                    </div>

                    {(item.status === "deploying" ||
                      item.status === "starting") && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{getPhaseLabel(item)}</span>
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    )}

                    {item.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{item.errorMessage}</span>
                        </div>
                      </div>
                    )}

                    {item.status === "deployed" &&
                      item.runtimeStatus === "started" && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                          <div className="flex items-center space-x-2">
                            <Play className="w-4 h-4" />
                            <span>
                              iFlow is running successfully in runtime
                              environment
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deployment Summary */}
      {deploymentComplete && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Deployment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-yellow-700">
                Deployment process completed. {deployedCount} of{" "}
                {deploymentItems.length} iFlows are now running in the runtime
                environment.
              </div>

              {failedCount > 0 && (
                <div className="text-sm text-red-700">
                  ⚠️ {failedCount} deployments failed. Please retry or check
                  your configurations.
                </div>
              )}

              <div className="text-sm text-yellow-700">
                ✅ All successfully deployed iFlows are available at their
                runtime endpoints and ready for testing.
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
          Back to Upload
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!deploymentComplete || failedCount > 0}
          className="flex items-center"
        >
          Continue to Testing
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Stage7Deploy;
