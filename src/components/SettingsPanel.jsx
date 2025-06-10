import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Plus, Edit, Trash2, Palette, Users, Settings } from 'lucide-react';
import ValueStreamForm from './ValueStreamForm.jsx';
import ResourceTypeForm from './ResourceTypeForm.jsx';

const SettingsPanel = ({ 
  valueStreams, 
  resourceTypes, 
  onUpdateValueStreams, 
  onUpdateResourceTypes 
}) => {
  const [isValueStreamFormOpen, setIsValueStreamFormOpen] = useState(false);
  const [isResourceTypeFormOpen, setIsResourceTypeFormOpen] = useState(false);
  const [editingValueStream, setEditingValueStream] = useState(null);
  const [editingResourceType, setEditingResourceType] = useState(null);

  const handleSaveValueStream = (valueStream) => {
    if (editingValueStream) {
      // Update existing
      const updated = valueStreams.map(vs => 
        vs.id === valueStream.id ? valueStream : vs
      );
      onUpdateValueStreams(updated);
    } else {
      // Add new
      onUpdateValueStreams([...valueStreams, valueStream]);
    }
    setEditingValueStream(null);
  };

  const handleEditValueStream = (valueStream) => {
    setEditingValueStream(valueStream);
    setIsValueStreamFormOpen(true);
  };

  const handleDeleteValueStream = (valueStreamId) => {
    if (confirm('Are you sure you want to delete this value stream? This action cannot be undone.')) {
      const updated = valueStreams.filter(vs => vs.id !== valueStreamId);
      onUpdateValueStreams(updated);
    }
  };

  const handleSaveResourceType = (resourceType) => {
    if (editingResourceType) {
      // Update existing
      const updated = resourceTypes.map(rt => 
        rt.id === resourceType.id ? resourceType : rt
      );
      onUpdateResourceTypes(updated);
    } else {
      // Add new
      onUpdateResourceTypes([...resourceTypes, resourceType]);
    }
    setEditingResourceType(null);
  };

  const handleEditResourceType = (resourceType) => {
    setEditingResourceType(resourceType);
    setIsResourceTypeFormOpen(true);
  };

  const handleDeleteResourceType = (resourceTypeId) => {
    if (confirm('Are you sure you want to delete this resource type? This action cannot be undone.')) {
      const updated = resourceTypes.filter(rt => rt.id !== resourceTypeId);
      onUpdateResourceTypes(updated);
    }
  };

  const handleCloseValueStreamForm = () => {
    setIsValueStreamFormOpen(false);
    setEditingValueStream(null);
  };

  const handleCloseResourceTypeForm = () => {
    setIsResourceTypeFormOpen(false);
    setEditingResourceType(null);
  };

  return (
    <div className="h-full">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Portfolio Settings</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="value-streams" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="value-streams" className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>Value Streams</span>
              </TabsTrigger>
              <TabsTrigger value="resource-types" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Resource Types</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="value-streams" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage Value Streams</h3>
                <Button 
                  onClick={() => setIsValueStreamFormOpen(true)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Value Stream
                </Button>
              </div>
              
              <div className="space-y-3">
                {valueStreams.map((valueStream) => (
                  <Card key={valueStream.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: valueStream.color }}
                        />
                        <div>
                          <div className="font-medium">{valueStream.name}</div>
                          {valueStream.description && (
                            <div className="text-sm text-gray-600">{valueStream.description}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleEditValueStream(valueStream)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteValueStream(valueStream.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {valueStreams.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No value streams created yet.</p>
                    <p className="text-sm">Add your first value stream to get started.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="resource-types" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage Resource Types</h3>
                <Button 
                  onClick={() => setIsResourceTypeFormOpen(true)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource Type
                </Button>
              </div>
              
              <div className="space-y-3">
                {resourceTypes.map((resourceType) => (
                  <Card key={resourceType.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: resourceType.color }}
                        />
                        <div>
                          <div className="font-medium">{resourceType.name}</div>
                          <div className="text-sm text-gray-600">
                            ${resourceType.hourlyRate}/hr • {resourceType.capacity} people available
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleEditResourceType(resourceType)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteResourceType(resourceType.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {resourceTypes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No resource types created yet.</p>
                    <p className="text-sm">Add your first resource type to get started.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Forms */}
      <ValueStreamForm
        isOpen={isValueStreamFormOpen}
        onClose={handleCloseValueStreamForm}
        onSave={handleSaveValueStream}
        editingValueStream={editingValueStream}
      />
      
      <ResourceTypeForm
        isOpen={isResourceTypeFormOpen}
        onClose={handleCloseResourceTypeForm}
        onSave={handleSaveResourceType}
        editingResourceType={editingResourceType}
      />
    </div>
  );
};

export default SettingsPanel;

