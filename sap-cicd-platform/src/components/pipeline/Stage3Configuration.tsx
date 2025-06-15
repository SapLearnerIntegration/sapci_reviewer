import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Settings,
  Server,
  Key,
  Database,
  Eye,
  EyeOff,
} from "lucide-react";

interface ConfigItem {
  id: string;
  iflowId: string;
  iflowName: string;
  parameter: string;
  type: "string" | "number" | "boolean" | "credential" | "url";
  currentValue: string;
  description: string;
  required: boolean;
  environment: string;
}

interface Stage3Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage3Configuration: React.FC<Stage3Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [configurations, setConfigurations] = useState<Record<string, string>>(
    {},
  );
  const [selectedEnvironment, setSelectedEnvironment] = useState("development");
  const [showCredentials, setShowCredentials] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);

  // Mock configuration data based on selected iFlows
  const mockConfigurations: ConfigItem[] = [
    // Customer Master Data Sync configurations
    {
      id: "config-001",
      iflowId: "iflow-001",
      iflowName: "Customer Master Data Sync",
      parameter: "S4HANA_BASE_URL",
      type: "url",
      currentValue: "https://dev-s4hana.company.com",
      description: "Base URL for S/4HANA system",
      required: true,
      environment: "development",
    },
    {
      id: "config-002",
      iflowId: "iflow-001",
      iflowName: "Customer Master Data Sync",
      parameter: "S4HANA_USERNAME",
      type: "credential",
      currentValue: "sync_user_dev",
      description: "Username for S/4HANA authentication",
      required: true,
      environment: "development",
    },
    {
      id: "config-003",
      iflowId: "iflow-001",
      iflowName: "Customer Master Data Sync",
      parameter: "BATCH_SIZE",
      type: "number",
      currentValue: "100",
      description: "Number of records to process in each batch",
      required: true,
      environment: "development",
    },
    {
      id: "config-004",
      iflowId: "iflow-001",
      iflowName: "Customer Master Data Sync",
      parameter: "ENABLE_LOGGING",
      type: "boolean",
      currentValue: "true",
      description: "Enable detailed logging for debugging",
      required: false,
      environment: "development",
    },
    // Order Processing configurations
    {
      id: "config-005",
      iflowId: "iflow-003",
      iflowName: "Order Processing Workflow",
      parameter: "ORDER_API_ENDPOINT",
      type: "url",
      currentValue: "https://dev-api.company.com/orders",
      description: "API endpoint for order processing",
      required: true,
      environment: "development",
    },
    {
      id: "config-006",
      iflowId: "iflow-003",
      iflowName: "Order Processing Workflow",
      parameter: "API_KEY",
      type: "credential",
      currentValue: "dev_api_key_12345",
      description: "API key for order service authentication",
      required: true,
      environment: "development",
    },
    {
      id: "config-007",
      iflowId: "iflow-003",
      iflowName: "Order Processing Workflow",
      parameter: "TIMEOUT_SECONDS",
      type: "number",
      currentValue: "30",
      description: "Request timeout in seconds",
      required: true,
      environment: "development",
    },
    // Financial Data Export configurations
    {
      id: "config-008",
      iflowId: "iflow-006",
      iflowName: "Financial Data Export",
      parameter: "DB_CONNECTION_STRING",
      type: "credential",
      currentValue: "Server=dev-db;Database=Finance;",
      description: "Database connection string",
      required: true,
      environment: "development",
    },
    {
      id: "config-009",
      iflowId: "iflow-006",
      iflowName: "Financial Data Export",
      parameter: "EXPORT_FORMAT",
      type: "string",
      currentValue: "CSV",
      description: "Export file format",
      required: true,
      environment: "development",
    },
  ];

  const environments = [
    {
      id: "development",
      name: "Development",
      color: "bg-blue-100 text-blue-800",
    },
    { id: "testing", name: "Testing", color: "bg-yellow-100 text-yellow-800" },
    {
      id: "production",
      name: "Production",
      color: "bg-green-100 text-green-800",
    },
  ];

  useEffect(() => {
    // Simulate loading environment-specific configurations
    setTimeout(() => {
      const selectedIFlows = data.selectedIFlows || [];
      const relevantConfigs = mockConfigurations.filter((config) =>
        selectedIFlows.includes(config.iflowId),
      );

      // Initialize configurations with current values
      const initialConfigs: Record<string, string> = {};
      relevantConfigs.forEach((config) => {
        initialConfigs[config.id] = config.currentValue;
      });

      setConfigurations(initialConfigs);
      setLoading(false);
    }, 1000);
  }, [data.selectedIFlows, selectedEnvironment]);

  const handleConfigChange = (configId: string, value: string) => {
    setConfigurations((prev) => ({
      ...prev,
      [configId]: value,
    }));
  };

  const toggleCredentialVisibility = (configId: string) => {
    setShowCredentials((prev) => ({
      ...prev,
      [configId]: !prev[configId],
    }));
  };

  const getRelevantConfigurations = () => {
    const selectedIFlows = data.selectedIFlows || [];
    return mockConfigurations.filter((config) =>
      selectedIFlows.includes(config.iflowId),
    );
  };

  const groupedConfigurations = getRelevantConfigurations().reduce(
    (acc, config) => {
      if (!acc[config.iflowId]) {
        acc[config.iflowId] = {
          iflowName: config.iflowName,
          configs: [],
        };
      }
      acc[config.iflowId].configs.push(config);
      return acc;
    },
    {} as Record<string, { iflowName: string; configs: ConfigItem[] }>,
  );

  const handleContinue = () => {
    onComplete({
      configurations,
      selectedEnvironment,
      configuredIFlows: Object.keys(groupedConfigurations).length,
    });
    onNext();
  };

  const renderConfigInput = (config: ConfigItem) => {
    const value = configurations[config.id] || config.currentValue;

    switch (config.type) {
      case "boolean":
        return (
          <Select
            value={value}
            onValueChange={(newValue) =>
              handleConfigChange(config.id, newValue)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );

      case "credential":
        return (
          <div className="relative">
            <Input
              type={showCredentials[config.id] ? "text" : "password"}
              value={value}
              onChange={(e) => handleConfigChange(config.id, e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => toggleCredentialVisibility(config.id)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCredentials[config.id] ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        );

      default:
        return (
          <Input
            type={config.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            placeholder={`Enter ${config.parameter}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3">Loading configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-purple-900">
            Environment Configuration
          </h3>
        </div>
        <p className="text-purple-700 mb-4">
          Configure environment-specific settings for your selected iFlows.
          These settings will be applied during deployment.
        </p>
        <div className="flex items-center space-x-4 text-sm text-purple-600">
          <span>
            🔄 iFlows to Configure: {Object.keys(groupedConfigurations).length}
          </span>
          <span>⚙️ Total Parameters: {getRelevantConfigurations().length}</span>
        </div>
      </div>

      {/* Environment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="w-5 h-5 mr-2" />
            Target Environment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => setSelectedEnvironment(env.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  selectedEnvironment === env.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <Badge className={env.color}>{env.name}</Badge>
                  <div className="text-sm text-gray-600 mt-2">
                    {env.id === "development" && "dev-*.company.com"}
                    {env.id === "testing" && "test-*.company.com"}
                    {env.id === "production" && "prod-*.company.com"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs by iFlow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            iFlow Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={Object.keys(groupedConfigurations)[0]}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(groupedConfigurations).map(([iflowId, group]) => (
                <TabsTrigger key={iflowId} value={iflowId} className="text-xs">
                  {group.iflowName}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(groupedConfigurations).map(([iflowId, group]) => (
              <TabsContent key={iflowId} value={iflowId} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {group.iflowName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Configure the parameters for this integration flow in the{" "}
                    {selectedEnvironment} environment.
                  </p>
                </div>

                <div className="grid gap-6">
                  {group.configs.map((config) => (
                    <div key={config.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={config.id}
                          className="flex items-center space-x-2"
                        >
                          <span className="font-medium">
                            {config.parameter}
                          </span>
                          {config.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                          {config.type === "credential" && (
                            <Key className="w-3 h-3 text-amber-500" />
                          )}
                          {config.type === "url" && (
                            <Database className="w-3 h-3 text-blue-500" />
                          )}
                        </Label>
                      </div>

                      {renderConfigInput(config)}

                      <p className="text-xs text-gray-500">
                        {config.description}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">
            Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {selectedEnvironment}
              </div>
              <div className="text-sm text-purple-700">Target Environment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(groupedConfigurations).length}
              </div>
              <div className="text-sm text-blue-700">iFlows Configured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getRelevantConfigurations().filter((c) => c.required).length}
              </div>
              <div className="text-sm text-green-700">Required Parameters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {
                  getRelevantConfigurations().filter(
                    (c) => c.type === "credential",
                  ).length
                }
              </div>
              <div className="text-sm text-amber-700">Secure Credentials</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to iFlows
        </Button>
        <Button onClick={handleContinue} className="flex items-center">
          Continue to Validation
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Stage3Configuration;
