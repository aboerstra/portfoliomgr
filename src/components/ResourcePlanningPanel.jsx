import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Users, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, Target } from 'lucide-react';
import { ResourceImpactCalculator } from '../utils/resourceCalculator.js';

const ResourcePlanningPanel = ({ projects, resourceTypes, selectedProject, onProjectUpdate }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(selectedProject?.id || projects[0]?.id);
  const [resourceSliders, setResourceSliders] = useState({});
  const [impactAnalysis, setImpactAnalysis] = useState(null);
  const [calculator] = useState(new ResourceImpactCalculator());

  const currentProject = projects.find(p => p.id === selectedProjectId);

  // Initialize sliders when project changes
  useEffect(() => {
    if (currentProject) {
      const sliders = {};
      Object.entries(currentProject.resources).forEach(([resourceTypeId, allocation]) => {
        sliders[resourceTypeId] = allocation.allocated;
      });
      setResourceSliders(sliders);
    }
  }, [currentProject]);

  // Calculate impact when sliders change
  useEffect(() => {
    if (currentProject && Object.keys(resourceSliders).length > 0) {
      const impact = calculator.calculateTimelineImpact(
        currentProject,
        resourceSliders,
        resourceTypes
      );
      setImpactAnalysis(impact);
    }
  }, [currentProject, resourceSliders, resourceTypes, calculator]);

  const handleSliderChange = (resourceTypeId, value) => {
    setResourceSliders(prev => ({
      ...prev,
      [resourceTypeId]: value[0]
    }));
  };

  const handleApplyChanges = () => {
    if (currentProject && impactAnalysis) {
      const updatedProject = {
        ...currentProject,
        resources: Object.fromEntries(
          Object.entries(currentProject.resources).map(([resourceTypeId, allocation]) => [
            resourceTypeId,
            {
              ...allocation,
              allocated: resourceSliders[resourceTypeId] || allocation.allocated
            }
          ])
        ),
        endDate: impactAnalysis.newEndDate
      };
      
      onProjectUpdate(updatedProject);
    }
  };

  const handleResetChanges = () => {
    if (currentProject) {
      const sliders = {};
      Object.entries(currentProject.resources).forEach(([resourceTypeId, allocation]) => {
        sliders[resourceTypeId] = allocation.allocated;
      });
      setResourceSliders(sliders);
    }
  };

  const getImpactColor = (change) => {
    if (change < -10) return 'text-green-600';
    if (change < 0) return 'text-green-500';
    if (change > 20) return 'text-red-600';
    if (change > 0) return 'text-red-500';
    return 'text-gray-600';
  };

  const getImpactIcon = (change) => {
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    return null;
  };

  if (!currentProject) {
    return (
      <div className="h-full">
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No projects available for resource planning.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Resource Planning</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Select Project:</label>
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 p-2 border rounded-md"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Sliders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Resource Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(currentProject.resources).map(([resourceTypeId, allocation]) => {
              const resourceType = resourceTypes.find(rt => rt.id === resourceTypeId);
              const currentValue = resourceSliders[resourceTypeId] || allocation.allocated;
              const maxCapacity = resourceType?.capacity || 20;
              
              return (
                <div key={resourceTypeId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: resourceType?.color || '#6B7280' }}
                      />
                      <span className="font-medium">{resourceType?.name || resourceTypeId}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentValue} / {maxCapacity} people
                    </div>
                  </div>
                  
                  <Slider
                    value={[currentValue]}
                    onValueChange={(value) => handleSliderChange(resourceTypeId, value)}
                    max={maxCapacity}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Required: {allocation.required}</span>
                    <span>Original: {allocation.allocated}</span>
                    <span>Available: {maxCapacity}</span>
                  </div>
                  
                  {currentValue > maxCapacity && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Over capacity!</span>
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={handleApplyChanges}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={!impactAnalysis}
              >
                Apply Changes
              </Button>
              <Button 
                onClick={handleResetChanges}
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Impact Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Timeline Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {impactAnalysis ? (
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="cost">Cost</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="timeline" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Original Duration</span>
                      <span className="font-semibold">{impactAnalysis.originalDuration} weeks</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">New Duration</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{impactAnalysis.newDuration} weeks</span>
                        <div className={`flex items-center space-x-1 ${getImpactColor(impactAnalysis.percentageChange)}`}>
                          {getImpactIcon(impactAnalysis.durationChange)}
                          <span className="text-sm font-medium">
                            {impactAnalysis.durationChange > 0 ? '+' : ''}{impactAnalysis.durationChange.toFixed(1)}w
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">New End Date</span>
                      <span className="font-semibold">
                        {new Date(impactAnalysis.newEndDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Timeline Change</span>
                      </div>
                      <div className={`text-lg font-bold ${getImpactColor(impactAnalysis.percentageChange)}`}>
                        {impactAnalysis.percentageChange > 0 ? '+' : ''}{impactAnalysis.percentageChange.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="cost" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Original Cost</span>
                      <span className="font-semibold">${impactAnalysis.costImpact.originalCost.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">New Cost</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">${impactAnalysis.costImpact.newCost.toLocaleString()}</span>
                        <div className={`flex items-center space-x-1 ${getImpactColor(impactAnalysis.costImpact.percentageChange)}`}>
                          {getImpactIcon(impactAnalysis.costImpact.costChange)}
                          <span className="text-sm font-medium">
                            {impactAnalysis.costImpact.costChange > 0 ? '+' : ''}${Math.abs(impactAnalysis.costImpact.costChange).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Cost Change</span>
                      </div>
                      <div className={`text-lg font-bold ${getImpactColor(impactAnalysis.costImpact.percentageChange)}`}>
                        {impactAnalysis.costImpact.percentageChange > 0 ? '+' : ''}{impactAnalysis.costImpact.percentageChange.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="risks" className="space-y-3 mt-4">
                  {impactAnalysis.riskFactors.length > 0 ? (
                    impactAnalysis.riskFactors.map((risk, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        risk.severity === 'critical' ? 'bg-red-50 border-red-500' :
                        risk.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                        risk.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-blue-50 border-blue-500'
                      }`}>
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                            risk.severity === 'critical' ? 'text-red-600' :
                            risk.severity === 'high' ? 'text-orange-600' :
                            risk.severity === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <div>
                            <Badge variant={
                              risk.severity === 'critical' ? 'destructive' :
                              risk.severity === 'high' ? 'destructive' :
                              'secondary'
                            } className="mb-1">
                              {risk.severity.toUpperCase()}
                            </Badge>
                            <p className="text-sm">{risk.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No risks identified with current allocation.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Adjust resources to see timeline impact.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResourcePlanningPanel;

