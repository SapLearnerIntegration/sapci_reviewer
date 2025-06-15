import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Calendar, User, ArrowRight } from "lucide-react";

interface Package {
  id: string;
  name: string;
  description: string;
  version: string;
  lastModified: string;
  author: string;
  iflowCount: number;
  status: "active" | "draft" | "deprecated";
}

interface Stage1Props {
  data: any;
  onComplete: (data: any) => void;
  onNext: () => void;
}

const Stage1PackageList: React.FC<Stage1Props> = ({
  data,
  onComplete,
  onNext,
}) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>(
    data.selectedPackages || [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Mock data - in real app this would come from SAP Integration Suite API
  const mockPackages: Package[] = [
    {
      id: "pkg-001",
      name: "Customer Master Data Integration",
      description:
        "Synchronize customer data between SAP S/4HANA and external systems",
      version: "1.2.3",
      lastModified: "2024-01-18",
      author: "John Smith",
      iflowCount: 8,
      status: "active",
    },
    {
      id: "pkg-002",
      name: "Order Management Suite",
      description: "End-to-end order processing workflows and integrations",
      version: "2.1.0",
      lastModified: "2024-01-19",
      author: "Jane Doe",
      iflowCount: 12,
      status: "active",
    },
    {
      id: "pkg-003",
      name: "Financial Data Synchronization",
      description: "Real-time financial data sync between systems",
      version: "1.0.5",
      lastModified: "2024-01-17",
      author: "Mike Johnson",
      iflowCount: 6,
      status: "active",
    },
    {
      id: "pkg-004",
      name: "Product Information Management",
      description: "Manage and distribute product information across channels",
      version: "1.5.2",
      lastModified: "2024-01-16",
      author: "Sarah Wilson",
      iflowCount: 15,
      status: "active",
    },
    {
      id: "pkg-005",
      name: "Legacy System Bridge",
      description: "Connect legacy systems with modern SAP architecture",
      version: "0.8.1",
      lastModified: "2024-01-15",
      author: "Robert Chen",
      iflowCount: 4,
      status: "draft",
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPackages(mockPackages);
      setFilteredPackages(mockPackages);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const filtered = packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.author.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredPackages(filtered);
  }, [searchTerm, packages]);

  const handlePackageSelect = (packageId: string, checked: boolean) => {
    if (checked) {
      setSelectedPackages((prev) => [...prev, packageId]);
    } else {
      setSelectedPackages((prev) => prev.filter((id) => id !== packageId));
    }
  };

  const handleContinue = () => {
    onComplete({ selectedPackages });
    onNext();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      draft: "secondary",
      deprecated: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search packages by name, description, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredPackages.length} of {packages.length} packages
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sap-blue"></div>
          <span className="ml-3">Loading packages...</span>
        </div>
      ) : (
        <>
          {/* Package List */}
          <div className="grid gap-4">
            {filteredPackages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedPackages.includes(pkg.id)}
                      onCheckedChange={(checked) =>
                        handlePackageSelect(pkg.id, checked as boolean)
                      }
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Package className="w-5 h-5 text-sap-blue" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {pkg.name}
                            </h3>
                            {getStatusBadge(pkg.status)}
                          </div>

                          <p className="text-gray-600 mb-3">
                            {pkg.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-gray-500">
                              <span className="font-medium mr-1">Version:</span>
                              {pkg.version}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {pkg.lastModified}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <User className="w-4 h-4 mr-1" />
                              {pkg.author}
                            </div>
                            <div className="flex items-center text-gray-500">
                              <span className="font-medium mr-1">iFlows:</span>
                              {pkg.iflowCount}
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

          {/* Selected Summary */}
          {selectedPackages.length > 0 && (
            <Card className="border-sap-blue bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sap-blue">
                  Selected Packages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {selectedPackages.length} package(s) selected for
                      deployment
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total iFlows:{" "}
                      {selectedPackages.reduce((total, id) => {
                        const pkg = packages.find((p) => p.id === id);
                        return total + (pkg?.iflowCount || 0);
                      }, 0)}
                    </p>
                  </div>
                  <Button
                    onClick={handleContinue}
                    disabled={selectedPackages.length === 0}
                  >
                    Continue to iFlow Selection
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Stage1PackageList;
