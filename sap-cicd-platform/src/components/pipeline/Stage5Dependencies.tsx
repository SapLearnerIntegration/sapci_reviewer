import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Link as LinkIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  GitBranch,
  Database,
  Globe,
} from "lucide-react";

interface Dependency {
  id: string;
  iflowId: string;
  iflowName: string;
  dependencyType: "system" | "service" | "iflow" | "data";
  dependencyName: string;
  description: string;
  status: "available" | "unavailable" | "warning";
  version: string;
  endpoint?: string;
  lastChecked: string;
}

interface DependencyGroup {
  type: string;
  icon: React.ComponentType<any>;
  dependencies: Dependency[];
  color: string;
}

interface Stage5Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage5Dependencies: React.FC<Stage5Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingDependency, setTestingDependency] = useState<string | null>(
    null,
  );

  // Mock dependencies data
  const mockDependencies: Dependency[] = [
    // System Dependencies
    {
      id: "dep-001",
      iflowId: "iflow-001",
      iflowName: "Customer Master Data Sync",
      dependencyType: "system",
      dependencyName: "SAP S/4HANA Cloud",
      description: "Source system for customer master data",
      status: "available",
      version: "2024.1",
      endpoint: "https://dev-s4hana.company.com",
      lastChecked: "2024-01-20 16:30",
    },
    {
      id: "dep-002",
      iflowId: "iflow-001",
      iflowName: "Customer Master Data Sync",
      dependencyType: "system",
      dependencyName: "CRM System",
      description: "Target system for customer data synchronization",
      status: "available",
      version: "12.5",
      endpoint: "https://dev-crm.company.com",
      lastChecked: "2024-01-20 16:28",
    },
    {
      id: "dep-003",
      iflowId: "iflow-003",
      iflowName: "Order Processing Workflow",
      dependencyType: "service",
      dependencyName: "Payment Gateway API",
      description: "External payment processing service",
      status: "warning",
      version: "v2.1",
      endpoint: "https://api.payment-provider.com",
      lastChecked: "2024-01-20 16:25",
    },
    {
      id: "dep-004",
      iflowId: "iflow-003",
      iflowName: "Order Processing Workflow",
      dependencyType: "service",
      dependencyName: "Shipping Calculator API",
      description: "Calculate shipping costs and delivery times",
      status: "available",
      version: "v1.8",
      endpoint: "https://api.shipping.company.com",
      lastChecked: "2024-01-20 16:30",
    },
    {
      id: "dep-005",
      iflowId: "iflow-003",
      iflowName: "Order Processing Workflow",
      dependencyType: "iflow",
      dependencyName: "Inventory Check Flow",
      description: "Validates product availability before order processing",
      status: "available",
      version: "1.3.2",
      lastChecked: "2024-01-20 16:29",
    },
    {
      id: "dep-006",
      iflowId: "iflow-006",
      iflowName: "Financial Data Export",
      dependencyType: "data",
      dependencyName: "Financial Database",
      description: "Source database for financial reporting data",
      status: "available",
      version: "PostgreSQL 14",
      endpoint: "postgres://dev-finance-db.company.com:5432",
      lastChecked: "2024-01-20 16:31",
    },
    {
      id: "dep-007",
      iflowId: "iflow-006",
      iflowName: "Financial Data Export",
      dependencyType: "service",
      dependencyName: "Data Warehouse API",
      description: "Target data warehouse for financial data",
      status: "unavailable",
      version: "v3.0",
      endpoint: "https://api.datawarehouse.company.com",
      lastChecked: "2024-01-20 16:20",
    },
    {
      id: "dep-008",
      iflowId: "iflow-007",
      iflowName: "GL Account Mapping",
      dependencyType: "data",
      dependencyName: "Chart of Accounts",
      description: "Master data for GL account mappings",
      status: "warning",
      version: "2024.Q1",
      lastChecked: "2024-01-20 16:15",
    },
  ];

  useEffect(() => {
    // Simulate dependency validation
    setTimeout(() => {
      const selectedIFlows = data.selectedIFlows || [];
      const relevantDependencies = mockDependencies.filter((dep) =>
        selectedIFlows.includes(dep.iflowId),
      );

      setDependencies(relevantDependencies);
      setLoading(false);
    }, 1500);
  }, [data.selectedIFlows]);

  const testDependency = async (dependencyId: string) => {
    setTestingDependency(dependencyId);

    // Simulate dependency test
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update dependency status (simulate result)
    setDependencies((prev) =>
      prev.map((dep) =>
        dep.id === dependencyId
          ? {
              ...dep,
              status: Math.random() > 0.2 ? "available" : "warning",
              lastChecked: new Date().toLocaleString(),
            }
          : dep,
      ),
    );

    setTestingDependency(null);
  };

  const groupedDependencies: DependencyGroup[] = [
    {
      type: "External Systems",
      icon: Database,
      dependencies: dependencies.filter((d) => d.dependencyType === "system"),
      color: "border-blue-500 bg-blue-50",
    },
    {
      type: "External Services",
      icon: Globe,
      dependencies: dependencies.filter((d) => d.dependencyType === "service"),
      color: "border-green-500 bg-green-50",
    },
    {
      type: "Integration Flows",
      icon: GitBranch,
      dependencies: dependencies.filter((d) => d.dependencyType === "iflow"),
      color: "border-purple-500 bg-purple-50",
    },
    {
      type: "Data Sources",
      icon: Database,
      dependencies: dependencies.filter((d) => d.dependencyType === "data"),
      color: "border-orange-500 bg-orange-50",
    },
  ].filter((group) => group.dependencies.length > 0);

  const handleContinue = () => {
    const dependencySummary = {
      totalDependencies: dependencies.length,
      availableDependencies: dependencies.filter(
        (d) => d.status === "available",
      ).length,
      warningDependencies: dependencies.filter((d) => d.status === "warning")
        .length,
      unavailableDependencies: dependencies.filter(
        (d) => d.status === "unavailable",
      ).length,
      dependencyGroups: groupedDependencies.map((group) => ({
        type: group.type,
        count: group.dependencies.length,
        status: group.dependencies.every((d) => d.status === "available")
          ? "healthy"
          : "issues",
      })),
    };

    onComplete({ dependencies: dependencySummary });
    onNext();
  };

  const getStatusIcon = (status: string, isLoading = false) => {
    if (isLoading) {
      return (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    }

    switch (status) {
      case "available":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "unavailable":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      available: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      unavailable: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center space-x-3 mb-4">
            <LinkIcon className="w-6 h-6 text-red-600 animate-pulse" />
            <h3 className="text-xl font-bold text-red-900">
              Dependency Validation
            </h3>
          </div>
          <p className="text-red-700 mb-4">
            Validating interface dependencies and external system
            connectivity...
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Checking dependencies...</p>
            <p className="text-sm text-gray-500 mt-2">
              Testing connectivity and availability
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCount = dependencies.filter(
    (d) => d.status === "available",
  ).length;
  const warningCount = dependencies.filter(
    (d) => d.status === "warning",
  ).length;
  const unavailableCount = dependencies.filter(
    (d) => d.status === "unavailable",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center space-x-3 mb-4">
          <LinkIcon className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-bold text-red-900">
            Dependency Validation
          </h3>
        </div>
        <p className="text-red-700 mb-4">
          Validation results for interface dependencies and external system
          connectivity.
        </p>
        <div className="flex items-center space-x-4 text-sm text-red-600">
          <span>🔗 Total Dependencies: {dependencies.length}</span>
          <span>✅ Available: {availableCount}</span>
          <span>⚠️ Warnings: {warningCount}</span>
          <span>❌ Unavailable: {unavailableCount}</span>
        </div>
      </div>

      {/* Overall Summary */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LinkIcon className="w-5 h-5 mr-2" />
            Dependency Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {dependencies.length}
              </div>
              <div className="text-sm text-gray-600">Total Dependencies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {availableCount}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {warningCount}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {unavailableCount}
              </div>
              <div className="text-sm text-gray-600">Unavailable</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Dependencies */}
      {groupedDependencies.map((group) => {
        const Icon = group.icon;
        return (
          <Card key={group.type} className={`border-l-4 ${group.color}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon className="w-5 h-5 mr-2" />
                {group.type}
                <Badge variant="outline" className="ml-2">
                  {group.dependencies.length} dependencies
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.dependencies.map((dependency) => (
                  <div
                    key={dependency.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(
                          dependency.status,
                          testingDependency === dependency.id,
                        )}
                        <h4 className="font-semibold text-gray-900">
                          {dependency.dependencyName}
                        </h4>
                        {getStatusBadge(dependency.status)}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {dependency.description}
                      </p>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Version: {dependency.version}</div>
                        {dependency.endpoint && (
                          <div>Endpoint: {dependency.endpoint}</div>
                        )}
                        <div>Last checked: {dependency.lastChecked}</div>
                        <div>Used by: {dependency.iflowName}</div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testDependency(dependency.id)}
                        disabled={testingDependency === dependency.id}
                      >
                        {testingDependency === dependency.id
                          ? "Testing..."
                          : "Test"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Critical Dependencies Warning */}
      {unavailableCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900 mb-2">
                  Critical Dependencies Unavailable
                </h3>
                <p className="text-sm text-red-700">
                  {unavailableCount} critical dependencies are currently
                  unavailable. These must be resolved before proceeding with
                  deployment to prevent integration failures.
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
          Back to Validation
        </Button>
        <Button
          onClick={handleContinue}
          className="flex items-center"
          disabled={unavailableCount > 0}
        >
          Continue to Upload
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Stage5Dependencies;
