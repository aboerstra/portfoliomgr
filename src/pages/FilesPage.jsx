import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Download, Upload, RotateCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FilesPage() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const data = {
        projects: JSON.parse(localStorage.getItem('projects') || '[]'),
        valueStreams: JSON.parse(localStorage.getItem('valueStreams') || '[]'),
        resourceTypes: JSON.parse(localStorage.getItem('resourceTypes') || '[]'),
        clientName: JSON.parse(localStorage.getItem('portfolioData') || '{}').clientName || 'Client Name',
        contractHours: parseInt(localStorage.getItem('contractHours') || '0', 10),
        rocks: JSON.parse(localStorage.getItem('rocks') || '[]'),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Validate the data structure
        if (!data.projects || !Array.isArray(data.projects)) {
          throw new Error('Invalid data format: projects array is required');
        }
        if (!data.valueStreams || !Array.isArray(data.valueStreams)) {
          throw new Error('Invalid data format: valueStreams array is required');
        }
        if (!data.resourceTypes || !Array.isArray(data.resourceTypes)) {
          throw new Error('Invalid data format: resourceTypes array is required');
        }
        if (data.rocks && !Array.isArray(data.rocks)) {
          throw new Error('Invalid data format: rocks must be an array if present');
        }

        // Clean and normalize the data
        const cleanData = {
          projects: data.projects.map(project => ({
            ...project,
            id: String(project.id || Math.random().toString(36).substr(2, 9)),
            name: String(project.name || ''),
            valueStreamId: String(project.valueStreamId || ''),
            startDate: String(project.startDate || ''),
            endDate: String(project.endDate || ''),
            status: String(project.status || 'planned'),
            priority: String(project.priority || 'medium'),
            description: String(project.description || ''),
            progress: Number(project.progress || 0),
            resources: Object.entries(project.resources || {}).reduce((acc, [key, value]) => ({
              ...acc,
              [key]: {
                allocated: Number(value.allocated || 0),
                required: Number(value.required || 0)
              }
            }), {}),
            milestones: (project.milestones || []).map(milestone => ({
              ...milestone,
              id: String(milestone.id || Math.random().toString(36).substr(2, 9)),
              name: String(milestone.name || ''),
              date: String(milestone.date || ''),
              status: String(milestone.status || 'planned')
            })),
            asanaUrl: String(project.asanaUrl || ''),
            resourceTypeId: project.resourceTypeId ? String(project.resourceTypeId) : null,
            pmAllocation: Number(project.pmAllocation || 20),
            autoPopulatePM: Boolean(project.autoPopulatePM),
            estimatedHours: Number(project.estimatedHours || 0),
            pmHours: Number(project.pmHours || 0),
            totalHours: project.simpleMode ? 
              Number(project.estimatedHours || 0) + Number(project.pmHours || 0) :
              Object.values(project.resources || {})
                .reduce((sum, resource) => sum + (Number(resource.hours) || 0), 0),
            hoursUsed: Number(project.hoursUsed || 0),
            simpleMode: Boolean(project.simpleMode)
          })),
          valueStreams: data.valueStreams.map(vs => ({
            ...vs,
            id: String(vs.id || Math.random().toString(36).substr(2, 9)),
            name: String(vs.name || ''),
            description: String(vs.description || ''),
            color: String(vs.color || '#3B82F6'),
            primaryStakeholder: String(vs.primaryStakeholder || ''),
            scorecardMetrics: String(vs.scorecardMetrics || '')
          })),
          resourceTypes: data.resourceTypes.map(rt => ({
            ...rt,
            id: String(rt.id || Math.random().toString(36).substr(2, 9)),
            name: String(rt.name || ''),
            hourlyRate: Number(rt.hourlyRate || 0),
            capacity: Number(rt.capacity || 1),
            color: String(rt.color || '#3B82F6')
          })),
          clientName: data.clientName || '',
          contractHours: Number(data.contractHours || 0),
          rocks: (data.rocks || []).map(rock => ({
            ...rock,
            id: String(rock.id || Math.random().toString(36).substr(2, 9)),
            valueStreamId: String(rock.valueStreamId || ''),
            quarter: Number(rock.quarter || 1),
            year: Number(rock.year || 2025),
            name: String(rock.name || ''),
            status: String(rock.status || 'not-started')
          }))
        };

        // Save to localStorage
        localStorage.setItem('portfolioData', JSON.stringify({
          projects: cleanData.projects,
          valueStreams: cleanData.valueStreams,
          resourceTypes: cleanData.resourceTypes,
          clientName: cleanData.clientName
        }));
        localStorage.setItem('rocks', JSON.stringify(cleanData.rocks));
        localStorage.setItem('contractHours', cleanData.contractHours.toString());

        // Show success message
        const message = [
          `Successfully imported:`,
          `- ${cleanData.projects.length} projects`,
          `- ${cleanData.valueStreams.length} value streams`,
          `- ${cleanData.resourceTypes.length} resource types`,
          data.rocks ? `- ${cleanData.rocks.length} rocks` : null,
          data.contractHours ? `- Contract hours: ${cleanData.contractHours}` : null,
          data.clientName ? `- Client name: ${cleanData.clientName}` : null
        ].filter(Boolean).join('\n');
        alert(message);

        window.location.reload();
      } catch (error) {
        console.error('Error importing data:', error);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setIsResetting(true);
    try {
      localStorage.removeItem('projects');
      localStorage.removeItem('valueStreams');
      localStorage.removeItem('resourceTypes');
      localStorage.removeItem('rocks');
      localStorage.removeItem('contractHours');
      const portfolioData = JSON.parse(localStorage.getItem('portfolioData') || '{}');
      delete portfolioData.clientName;
      localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
      window.location.reload();
    } catch (error) {
      console.error('Error resetting data:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold">Export Data</h3>
                  <p className="text-sm text-gray-500">Download your portfolio data as a JSON file</p>
                </div>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold">Import Data</h3>
                  <p className="text-sm text-gray-500">Upload a previously exported JSON file</p>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-file"
                  />
                  <Button
                    onClick={() => document.getElementById('import-file').click()}
                    disabled={isImporting}
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-100 focus:bg-purple-200 active:bg-purple-300 hover:text-purple-700 focus:text-purple-800 active:text-purple-900 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Import Data'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold">Reset Data</h3>
                  <p className="text-sm text-gray-500">Clear all portfolio data and start fresh</p>
                </div>
                <Button
                  onClick={handleReset}
                  disabled={isResetting}
                  variant="destructive"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isResetting ? 'Resetting...' : 'Reset Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 