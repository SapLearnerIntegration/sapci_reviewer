import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  List,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react";

interface IFlow {
  id: string;
  name: string;
  description: string;
  packageId: string;
  packageName: string;
  status: "deployed" | "draft" | "error";
  lastRun: string;
  complexity: "low" | "medium" | "high";
  version: string;
  author: string;
}

interface Stage2Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Stage2IFlowList: React.FC<Stage2Props> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [selectedIFlows, setSelectedIFlows] = useState<string[]>(
    data.selectedIFlows || [],
  );
  const [iFlows, setIFlows] = useState<IFlow[]>([]);
  const [filteredIFlows, setFilteredIFlows] = useState<IFlow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Mock iFlows based on selected packages
  const mockIFlows: IFlow[] = [
    {
      id: "iflow-001",
      name: "Customer Master Data Sync",
      description: "Synchronize customer master data between S/4HANA and CRM",
      packageId: "pkg-001",
      packageName: "Customer Master Data Integration",
      status: "deployed",
      lastRun: "2024-01-20 14:30",
      complexity: "medium",
      version: "1.2.1",
      author: "John Smith",
    },
    {
      id: "iflow-002",
      name: "Customer Address Validation",
      description: "Validate and standardize customer addresses",
      packageId: "pkg-001",
      packageName: "Customer Master Data Integration",
      status: "deployed",
      lastRun: "2024-01-20 13:45",
      complexity: "low",
      version: "1.1.0",
      author: "John Smith",
    },
    {
      id: "iflow-003",
      name: "Order Processing Workflow",
      description: "Process sales orders from multiple channels",
      packageId: "pkg-002",
      packageName: "Order Management Suite",
      status: "deployed",
      lastRun: "2024-01-20 15:20",
      complexity: "high",
      version: "2.0.3",
      author: "Jane Doe",
    },
    {
      id: "iflow-004",
      name: "Order Status Updates",
      description: "Send order status notifications to customers",
      packageId: "pkg-002",
      packageName: "Order Management Suite",
      status: "deployed",
      lastRun: "2024-01-20 15:18",
      complexity: "medium",
      version: "1.5.2",
      author: "Jane Doe",
    },
    {
      id: "iflow-005",
      name: "Inventory Sync",
      description: "Synchronize inventory levels across systems",
      packageId: "pkg-002",
      packageName: "Order Management Suite",
      status: "draft",
      lastRun: "2024-01-19 16:30",
      complexity: "medium",
      version: "1.0.0",
      author: "Jane Doe",
    },
    {
      id: "iflow-006",
      name: "Financial Data Export",
      description: "Export financial data to external reporting systems",
      packageId: "pkg-003",
      packageName: "Financial Data Synchronization",
      status: "deployed",
      lastRun: "2024-01-20 12:00",
      complexity: "high",
      version: "1.3.1",
      author: "Mike Johnson",
    },
    {
      id: "iflow-007",
      name: "GL Account Mapping",
      description: "Map GL accounts between different systems",
      packageId: "pkg-003",
      packageName: "Financial Data Synchronization",
      status: "error",
      lastRun: "2024-01-20 10:15",
      complexity: "low",
      version: "1.0.5",
      author: "Mike Johnson",
    },
  ];

  useEffect(() => {
    // Simulate API call - filter iFlows based on selected packages
    setTimeout(() => {
      const selectedPackages = data.selectedPackages || [];
      const filteredByPackage =
        selectedPackages.length > 0
          ? mockIFlows.filter((iflow) =>
              selectedPackages.includes(iflow.packageId),
            )
          : mockIFlows;

      setIFlows(filteredByPackage);
      setFilteredIFlows(filteredByPackage);
      setLoading(false);
    }, 1000);
  }, [data.selectedPackages]);

  useEffect(() => {
    const filtered = iFlows.filter(
      (iflow) =>
        iflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iflow.packageName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredIFlows(filtered);
  }, [searchTerm, iFlows]);

  const handleIFlowSelect = (iflowId: string, checked: boolean) => {
    if (checked) {
      setSelectedIFlows((prev) => [...prev, iflowId]);
    } else {
      setSelectedIFlows((prev) => prev.filter((id) => id !== iflowId));
    }
  };

  const handleContinue = () => {
    onComplete({ selectedIFlows });
    onNext();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "draft":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      deployed: "default",
      draft: "secondary",
      error: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getComplexityBadge = (complexity: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[complexity] || "bg-gray-100 text-gray-800"}>
        {complexity}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading iFlows...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center space-x-3 mb-4">
          <List className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-indigo-900">
            Select Integration Flows
          </h3>
        </div>
        <p className="text-indigo-700 mb-4">
          Choose specific iFlows from your selected packages to include in the
          deployment pipeline.
        </p>
        <div className="flex items-center space-x-4 text-sm text-indigo-600">
          <span>
            📦 Packages Selected: {data.selectedPackages?.length || 0}
          </span>
          <span>🔄 Available iFlows: {filteredIFlows.length}</span>
          <span>✅ Selected iFlows: {selectedIFlows.length}</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search iFlows by name, description, or package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredIFlows.length} iFlow(s) available
        </Badge>
      </div>

      {/* iFlow List */}
      <div className="grid gap-4">
        {filteredIFlows.map((iflow) => (
          <Card
            key={iflow.id}
            className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-indigo-500"
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Checkbox
                  checked={selectedIFlows.includes(iflow.id)}
                  onCheckedChange={(checked) =>
                    handleIFlowSelect(iflow.id, checked as boolean)
                  }
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Play className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-lg font-semibold text-gray-900">
                          {iflow.name}
                        </h4>
                        {getStatusBadge(iflow.status)}
                        {getComplexityBadge(iflow.complexity)}
                      </div>

                      <p className="text-gray-600 mb-3">{iflow.description}</p>

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="text-sm text-gray-600">
                          <strong>Package:</strong> {iflow.packageName}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-500">
                          <span className="font-medium mr-1">Version:</span>
                          {iflow.version}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {iflow.lastRun}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <span className="font-medium mr-1">Author:</span>
                          {iflow.author}
                        </div>
                        <div className="flex items-center text-gray-500">
                          {getStatusIcon(iflow.status)}
                          <span className="ml-1 capitalize">
                            {iflow.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIFlows.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No iFlows found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your search criteria or ensure packages are selected
            </p>
          </CardContent>
        </Card>
      )}

      {/* Selected Summary */}
      {selectedIFlows.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-indigo-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Selected iFlows Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {selectedIFlows.length}
                </div>
                <div className="text-sm text-indigo-700">iFlows Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    selectedIFlows.filter((id) => {
                      const iflow = iFlows.find((i) => i.id === id);
                      return iflow?.status === "deployed";
                    }).length
                  }
                </div>
                <div className="text-sm text-green-700">Ready to Deploy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    selectedIFlows.filter((id) => {
                      const iflow = iFlows.find((i) => i.id === id);
                      return iflow?.complexity === "high";
                    }).length
                  }
                </div>
                <div className="text-sm text-yellow-700">High Complexity</div>
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
          Back to Packages
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedIFlows.length === 0}
          className="flex items-center"
        >
          Continue to Configuration
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Stage2IFlowList;
