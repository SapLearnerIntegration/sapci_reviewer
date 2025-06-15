import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Settings,
  Shield,
  Link as LinkIcon,
  Upload,
  Rocket,
  TestTube,
  ArrowRight,
  History,
  Sparkles,
  ChevronRight,
  List,
} from "lucide-react";

import Stage1PackageList from "@/components/pipeline/Stage1PackageList";
import Stage2IFlowList from "@/components/pipeline/Stage2IFlowList";
import Stage3Configuration from "@/components/pipeline/Stage3Configuration";
import Stage4Validation from "@/components/pipeline/Stage4Validation";
import Stage5Dependencies from "@/components/pipeline/Stage5Dependencies";
import Stage6Upload from "@/components/pipeline/Stage6Upload";
import Stage7Deploy from "@/components/pipeline/Stage7Deploy";
import Stage8Testing from "@/components/pipeline/Stage8Testing";

const CICDPipeline = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [pipelineData, setPipelineData] = useState({
    selectedPackages: [],
    selectedIFlows: [],
    configurations: {},
    validationResults: {},
    dependencies: {},
    uploadStatus: {},
    deploymentStatus: {},
    testResults: {},
  });

  const stages = [
    {
      id: 1,
      title: "Package Selection",
      shortTitle: "Packages",
      description: "Select integration packages from sandbox tenant",
      icon: Package,
      component: Stage1PackageList,
      color: "from-blue-500 to-blue-600",
      lightColor: "from-blue-50 to-blue-100",
    },
    {
      id: 2,
      title: "iFlow Selection",
      shortTitle: "iFlows",
      description: "Choose specific iFlows for deployment",
      icon: List,
      component: Stage2IFlowList,
      color: "from-indigo-500 to-indigo-600",
      lightColor: "from-indigo-50 to-indigo-100",
    },
    {
      id: 3,
      title: "Configuration",
      shortTitle: "Config",
      description: "Configure environment-specific settings",
      icon: Settings,
      component: Stage3Configuration,
      color: "from-purple-500 to-purple-600",
      lightColor: "from-purple-50 to-purple-100",
    },
    {
      id: 4,
      title: "Design Validation",
      shortTitle: "Validation",
      description: "Validate against design guidelines",
      icon: Shield,
      component: Stage4Validation,
      color: "from-pink-500 to-pink-600",
      lightColor: "from-pink-50 to-pink-100",
    },
    {
      id: 5,
      title: "Dependencies",
      shortTitle: "Dependencies",
      description: "Validate interface dependencies",
      icon: LinkIcon,
      component: Stage5Dependencies,
      color: "from-red-500 to-red-600",
      lightColor: "from-red-50 to-red-100",
    },
    {
      id: 6,
      title: "Upload Artifacts",
      shortTitle: "Upload",
      description: "Upload to SAP Integration Suite",
      icon: Upload,
      component: Stage6Upload,
      color: "from-orange-500 to-orange-600",
      lightColor: "from-orange-50 to-orange-100",
    },
    {
      id: 7,
      title: "Deploy",
      shortTitle: "Deploy",
      description: "Deploy from design-time to runtime",
      icon: Rocket,
      component: Stage7Deploy,
      color: "from-yellow-500 to-yellow-600",
      lightColor: "from-yellow-50 to-yellow-100",
    },
    {
      id: 8,
      title: "Testing",
      shortTitle: "Testing",
      description: "Execute test suite and generate report",
      icon: TestTube,
      component: Stage8Testing,
      color: "from-green-500 to-green-600",
      lightColor: "from-green-50 to-green-100",
    },
  ];

  const getStageStatus = (stageId: number) => {
    if (completedStages.includes(stageId)) return "completed";
    if (stageId === currentStage) return "active";
    if (stageId < currentStage) return "completed";
    return "pending";
  };

  const progressPercentage = (completedStages.length / stages.length) * 100;

  const handleStageComplete = (stageId: number, data: any) => {
    setCompletedStages((prev) => [...prev, stageId]);
    setPipelineData((prev) => ({ ...prev, ...data }));
    if (stageId < stages.length) {
      setCurrentStage(stageId + 1);
    }
  };

  const handleStageNavigation = (stageId: number) => {
    if (stageId <= currentStage || completedStages.includes(stageId)) {
      setCurrentStage(stageId);
    }
  };

  const CurrentStageComponent = stages[currentStage - 1]?.component;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Rocket className="w-8 h-8" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Enterprise Pipeline
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3">
              CI/CD Pipeline Automation
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl">
              Automate SAP Integration Suite artifact deployment with our
              8-stage intelligent pipeline
            </p>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <History className="w-4 h-4 mr-2" />
              Pipeline History
            </Button>
            <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold shadow-xl">
              <Play className="w-4 h-4 mr-2" />
              Start New Pipeline
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
        <CardHeader className="bg-gradient-to-r from-gray-50/50 to-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Pipeline Progress
              </CardTitle>
              <CardDescription className="text-lg">
                Stage {currentStage} of {stages.length} -{" "}
                {stages[currentStage - 1]?.title}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant={
                  completedStages.length === stages.length
                    ? "default"
                    : "secondary"
                }
                className="text-lg px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              >
                {Math.round(progressPercentage)}% Complete
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-gray-900">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="relative">
              <Progress
                value={progressPercentage}
                className="h-3 bg-gray-200"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full opacity-90"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Single Row Stage Navigation */}
          <div className="relative">
            <div className="flex space-x-1 overflow-x-auto pb-4 scrollbar-hide">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const status = getStageStatus(stage.id);
                const isLast = index === stages.length - 1;

                return (
                  <div
                    key={stage.id}
                    className="flex items-center flex-shrink-0"
                  >
                    <button
                      onClick={() => handleStageNavigation(stage.id)}
                      className={cn(
                        "relative flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-500 min-w-[90px] w-[90px] group transform hover:scale-105",
                        status === "completed" &&
                          "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 text-green-800 shadow-lg shadow-green-500/20",
                        status === "active" &&
                          `border-blue-300 bg-gradient-to-br ${stage.lightColor} text-blue-800 shadow-xl shadow-blue-500/30`,
                        status === "pending" &&
                          "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 hover:border-gray-300 hover:shadow-md",
                        (status === "active" || status === "completed") &&
                          "cursor-pointer",
                      )}
                      disabled={status === "pending"}
                    >
                      {/* Glow effect for active/completed */}
                      {(status === "active" || status === "completed") && (
                        <div
                          className={cn(
                            "absolute inset-0 rounded-xl blur-lg opacity-15",
                            status === "completed"
                              ? "bg-green-500"
                              : `bg-gradient-to-br ${stage.color}`,
                          )}
                        ></div>
                      )}

                      {/* Stage number badge */}
                      <div
                        className={cn(
                          "absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-white",
                          status === "completed" &&
                            "border-green-500 text-green-600 bg-green-50",
                          status === "active" &&
                            "border-blue-500 text-blue-600 bg-blue-50",
                          status === "pending" &&
                            "border-gray-300 text-gray-500",
                        )}
                      >
                        {stage.id}
                      </div>

                      <div className="relative flex items-center justify-center mb-2">
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            status === "completed" &&
                              "bg-gradient-to-br from-green-500 to-emerald-500 text-white",
                            status === "active" &&
                              `bg-gradient-to-br ${stage.color} text-white`,
                            status === "pending" && "bg-gray-200 text-gray-400",
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {status === "completed" && (
                          <div className="absolute -top-0.5 -right-0.5">
                            <CheckCircle className="w-3 h-3 text-green-600 bg-white rounded-full" />
                          </div>
                        )}
                        {status === "active" && (
                          <div className="absolute -top-0.5 -right-0.5">
                            <Clock className="w-3 h-3 text-blue-600 bg-white rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="text-center px-1">
                        <div className="text-xs font-bold mb-1 leading-tight">
                          {stage.shortTitle}
                        </div>
                        <div className="text-xs opacity-75 leading-tight">
                          {stage.description.length > 20
                            ? stage.description.substring(0, 18) + "..."
                            : stage.description}
                        </div>
                      </div>

                      {/* Progress indicator */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-b-xl overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000",
                            status === "completed" &&
                              "bg-gradient-to-r from-green-500 to-emerald-500 w-full",
                            status === "active" &&
                              `bg-gradient-to-r ${stage.color} w-3/4 animate-pulse`,
                            status === "pending" && "bg-gray-300 w-0",
                          )}
                        ></div>
                      </div>
                    </button>

                    {/* Connector arrow */}
                    {!isLast && (
                      <div className="flex-shrink-0 mx-1">
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 transition-colors duration-300",
                            status === "completed"
                              ? "text-green-500"
                              : status === "active"
                                ? "text-blue-500"
                                : "text-gray-300",
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Stage Content */}
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
        <div
          className={`h-2 bg-gradient-to-r ${stages[currentStage - 1]?.color}`}
        ></div>
        <CardHeader className="bg-gradient-to-r from-gray-50/50 to-blue-50/50">
          <div className="flex items-center space-x-4">
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br ${stages[currentStage - 1]?.color} shadow-lg`}
            >
              {React.createElement(stages[currentStage - 1]?.icon, {
                className: "w-8 h-8 text-white",
              })}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Stage {currentStage}: {stages[currentStage - 1]?.title}
              </CardTitle>
              <CardDescription className="text-lg">
                {stages[currentStage - 1]?.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {CurrentStageComponent && (
            <CurrentStageComponent
              data={pipelineData}
              onComplete={(data: any) =>
                handleStageComplete(currentStage, data)
              }
              onNext={() =>
                setCurrentStage(Math.min(currentStage + 1, stages.length))
              }
              onPrevious={() => setCurrentStage(Math.max(currentStage - 1, 1))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CICDPipeline;
