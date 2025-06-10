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
        resourceTypes: JSON.parse(localStorage.getItem('resourceTypes') || '[]')
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
        if (data.projects) localStorage.setItem('projects', JSON.stringify(data.projects));
        if (data.valueStreams) localStorage.setItem('valueStreams', JSON.stringify(data.valueStreams));
        if (data.resourceTypes) localStorage.setItem('resourceTypes', JSON.stringify(data.resourceTypes));
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
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
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