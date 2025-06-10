import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { 
  saveScenario, 
  loadScenario, 
  deleteScenario, 
  listScenarios,
  saveLastViewedState 
} from '@/utils/scenarioManager.js';

export default function ScenarioManager({ 
  currentData, 
  onLoadScenario,
  className = ''
}) {
  const [scenarios, setScenarios] = useState([]);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load scenarios on mount
    setScenarios(listScenarios());
  }, []);

  const handleSaveScenario = () => {
    if (!newScenarioName.trim()) {
      alert('Please enter a scenario name');
      return;
    }

    setIsSaving(true);
    try {
      const scenario = saveScenario(newScenarioName, currentData);
      setScenarios(listScenarios());
      setNewScenarioName('');
      alert(`Scenario "${newScenarioName}" saved successfully!`);
    } catch (error) {
      alert('Error saving scenario: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadScenario = (scenarioName) => {
    const scenario = loadScenario(scenarioName);
    if (scenario) {
      onLoadScenario(scenario.data);
      saveLastViewedState(scenario.data);
      alert(`Loaded scenario "${scenarioName}"`);
    }
  };

  const handleDeleteScenario = (scenarioName) => {
    if (confirm(`Are you sure you want to delete scenario "${scenarioName}"?`)) {
      deleteScenario(scenarioName);
      setScenarios(listScenarios());
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Scenario Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Save new scenario */}
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Label htmlFor="scenario-name">New Scenario Name</Label>
              <Input
                id="scenario-name"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="Enter scenario name"
              />
            </div>
            <Button 
              onClick={handleSaveScenario}
              disabled={isSaving || !newScenarioName.trim()}
            >
              Save Current State
            </Button>
          </div>

          {/* List of saved scenarios */}
          <div className="space-y-2">
            <Label>Saved Scenarios</Label>
            {scenarios.length === 0 ? (
              <p className="text-sm text-gray-500">No saved scenarios yet</p>
            ) : (
              <div className="space-y-2">
                {scenarios.map((scenario) => (
                  <div 
                    key={scenario.name}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{scenario.name}</p>
                      <p className="text-sm text-gray-500">
                        Last modified: {new Date(scenario.lastModified).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadScenario(scenario.name)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteScenario(scenario.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 