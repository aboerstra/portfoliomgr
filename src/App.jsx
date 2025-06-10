// Scenario management utilities
function loadScenario(name) {
  try {
    const data = JSON.parse(localStorage.getItem(`fayePortfolioScenario_${name}`));
    return data || null;
  } catch {
    return null;
  }
}

function saveScenario(name, state) {
  localStorage.setItem(`fayePortfolioScenario_${name}` , JSON.stringify(state));
}

function getSavedScenarioNames() {
  return Object.keys(localStorage)
    .filter(key => key.startsWith('fayePortfolioScenario_'))
    .map(key => key.replace('fayePortfolioScenario_', ''));
}

function loadLastScenarioName() {
  return localStorage.getItem('fayePortfolioLastScenarioName') || null;
}

function saveLastScenarioName(name) {
  localStorage.setItem('fayePortfolioLastScenarioName', name);
}

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, BarChart3, Users, Settings, Download, Upload, RotateCcw, Database, Save, ChevronLeft, ChevronRight, File } from 'lucide-react'
import fayeLogo from './assets/faye-logo-white.png'
import ValueStreamSidebar from './components/ValueStreamSidebar.jsx'
import GanttChart from './components/GanttChart.jsx'
import ProjectForm from './components/ProjectForm.jsx'
import ResourcePlanningPanel from './components/ResourcePlanningPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import './App.css'
import { projects as initialProjects, valueStreams as initialValueStreams, resourceTypes as initialResourceTypes } from './data/sampleData.js';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QuarterlyView from './components/QuarterlyView.jsx';

function parseAsanaTasks(asanaJson, valueStreamId) {
  if (!asanaJson || !Array.isArray(asanaJson.data)) {
    throw new Error("Invalid Asana JSON: missing 'data' array.");
  }

  // Helper to extract custom field value
  const getCustomField = (task, name) => {
    if (!Array.isArray(task.custom_fields)) return null;
    const field = task.custom_fields.find(f => f.name === name);
    if (!field) return null;
    
    if (field.type === 'date') {
      return field.date_value?.date || field.display_value?.split('T')[0] || null;
    }
    if (field.type === 'enum') {
      return field.enum_value?.name || field.display_value || null;
    }
    return field.display_value || null;
  };

  // First, find all milestone tasks
  const milestoneTasks = asanaJson.data.filter(task => {
    const taskType = getCustomField(task, 'Task Type');
    return taskType?.toLowerCase() === 'milestone';
  });

  // Then process all tasks, creating milestones and projects
  const importedProjects = asanaJson.data.map(task => {
    const taskType = getCustomField(task, 'Task Type');
    const isMilestone = taskType?.toLowerCase() === 'milestone';

    // Fallbacks for start/end dates
    const startDate = task.start_on || getCustomField(task, 'Start Date') || null;
    const endDate = task.due_on || null;

    // Map status with fallbacks
    let status = 'planned';
    if (task.completed) {
      status = 'completed';
    } else {
      const jiraStatus = getCustomField(task, 'Jira status');
      if (jiraStatus) {
        status = jiraStatus.toLowerCase();
      }
    }

    // Map priority with fallbacks
    let priority = 'medium';
    const jiraPriority = getCustomField(task, 'Jira priority');
    if (jiraPriority) {
      priority = jiraPriority.toLowerCase();
    }

    // Create the base project object
    const project = {
      id: `asana-${task.gid}`,
      name: task.name || 'Untitled',
      description: task.notes || '',
      valueStreamId,
      startDate,
      endDate,
      status,
      priority,
      progress: 0,
      resources: {},
      milestones: [],
      asanaUrl: task.permalink_url || '',
    };

    // If this is a milestone task, add it as a milestone to the project
    if (isMilestone) {
      project.milestones.push({
        id: `milestone-${task.gid}`,
        name: task.name || 'Untitled Milestone',
        date: endDate || startDate,
        description: task.notes || '',
        status: status,
      });
    }

    return project;
  });

  return importedProjects;
}

function App() {
  // Load last scenario only once on mount
  const initialLoadRef = useRef(false);
  const lastScenarioName = loadLastScenarioName();
  const lastScenario = lastScenarioName ? loadScenario(lastScenarioName) : null;

  // Scenario state
  const [scenarioName, setScenarioName] = useState(lastScenarioName || 'Default');
  const [projects, setProjects] = useState(lastScenario?.projects || initialProjects);
  const [valueStreams, setValueStreams] = useState(lastScenario?.valueStreams || initialValueStreams);
  const [resourceTypes, setResourceTypes] = useState(lastScenario?.resourceTypes || initialResourceTypes);
  const [selectedValueStream, setSelectedValueStream] = useState(null)
  const [currentView, setCurrentView] = useState('portfolio')
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false)
  const [selectedValueStreamForForm, setSelectedValueStreamForForm] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [sidebarWidth, setSidebarWidth] = useState(320) // Default width
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef(null)
  const [newScenarioName, setNewScenarioName] = useState('');
  const [showAsanaImport, setShowAsanaImport] = useState(false);
  const [asanaImportValueStream, setAsanaImportValueStream] = useState(valueStreams[0]?.id || '');
  const [contractHours, setContractHours] = useState(() => {
    const saved = localStorage.getItem('contractHours');
    return saved ? parseInt(saved, 10) : 0;
  });
  const ganttChartRef = useRef();

  // On first mount, ensure state is loaded from last scenario
  useEffect(() => {
    if (!initialLoadRef.current && lastScenario) {
      setProjects(lastScenario.projects || initialProjects);
      setValueStreams(lastScenario.valueStreams || initialValueStreams);
      setResourceTypes(lastScenario.resourceTypes || initialResourceTypes);
      setScenarioName(lastScenarioName || 'Default');
      initialLoadRef.current = true;
    }
  }, []);

  // Save scenario on change
  useEffect(() => {
    saveScenario(scenarioName, { projects, valueStreams, resourceTypes });
    saveLastScenarioName(scenarioName);
  }, [projects, valueStreams, resourceTypes, scenarioName]);

  // Save contract hours when changed
  useEffect(() => {
    localStorage.setItem('contractHours', contractHours.toString());
  }, [contractHours]);

  // Handle sidebar resize
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return
      
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 500) { // Min and max width constraints
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleValueStreamSelect = (valueStreamId) => {
    setSelectedValueStream(selectedValueStream === valueStreamId ? null : valueStreamId)
  }

  const handleAddProject = (valueStreamId = null, projectToEdit = null) => {
    setSelectedValueStreamForForm(valueStreamId)
    setIsProjectFormOpen(true)
    if (projectToEdit) {
      setEditingProject(projectToEdit)
    }
  }

  const handleSaveProject = (newProject) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === newProject.id ? newProject : p))
      setEditingProject(null)
    } else {
      setProjects(prev => [...prev, newProject])
    }
  }

  const handleUpdateProject = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p))
  }

  const handleCloseProjectForm = () => {
    setIsProjectFormOpen(false)
    setSelectedValueStreamForForm(null)
    setEditingProject(null)
  }

  const handleUpdateValueStreams = (newValueStreams) => {
    setValueStreams(newValueStreams)
  }

  const handleUpdateResourceTypes = (newResourceTypes) => {
    setResourceTypes(newResourceTypes)
  }

  // Export/Import functionality
  const exportData = () => {
    const exportData = {
      projects,
      valueStreams,
      resourceTypes,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `faye-portfolio-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result)
        
        // Validate the imported data structure
        if (importedData.projects && importedData.valueStreams && importedData.resourceTypes) {
          setProjects(importedData.projects)
          setValueStreams(importedData.valueStreams)
          setResourceTypes(importedData.resourceTypes)
          
          // Reset selections
          setSelectedValueStream(null)
          setCurrentView('portfolio')
          
          alert(`Successfully imported ${importedData.projects.length} projects and ${importedData.valueStreams.length} value streams!`)
        } else {
          alert('Invalid file format. Please select a valid Faye Portfolio export file.')
        }
      } catch (error) {
        alert('Error reading file. Please ensure it\'s a valid JSON file.')
        console.error('Import error:', error)
      }
    }
    reader.readAsText(file)
    
    // Reset the input so the same file can be imported again
    event.target.value = ''
  }

  const triggerImport = () => {
    document.getElementById('file-import').click()
  }

  const resetData = () => {
    if (confirm('Are you sure you want to reset all data? This will remove all projects, value streams, and resource types. This action cannot be undone.')) {
      setProjects([])
      setValueStreams([])
      setResourceTypes([])
      setSelectedValueStream(null)
      setCurrentView('portfolio')
      alert('All data has been reset. You can now start fresh or load demo data.')
    }
  }

  const loadDemoData = () => {
    if (confirm('Load demo data? This will replace all current data with the sample portfolio data.')) {
      setProjects(initialProjects)
      setValueStreams(initialValueStreams)
      setResourceTypes(initialResourceTypes)
      setSelectedValueStream(null)
      setCurrentView('portfolio')
      alert(`Demo data loaded successfully! Added ${initialProjects.length} sample projects and ${initialValueStreams.length} value streams.`)
    }
  }

  const handleAsanaImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (!text || text.trim() === '') {
        alert('The selected file is empty. Please select a valid Asana JSON export.');
        return;
      }
      try {
        const asanaData = JSON.parse(text);
        const importedProjects = parseAsanaTasks(asanaData, asanaImportValueStream);
        
        if (importedProjects.length === 0) {
          alert('No valid tasks found in the Asana export.');
          return;
        }

        // Add imported projects to existing projects
        setProjects(prev => [...prev, ...importedProjects]);
        
        // Show success message
        alert(`Successfully imported ${importedProjects.length} tasks from Asana!`);
        
        // Close the import modal
        setShowAsanaImport(false);
      } catch (error) {
        console.error('Asana import error:', error);
        alert('Error importing Asana data: The file is not valid JSON. Please check your Asana export.');
      }
    };

    reader.onerror = () => {
      alert('Error reading the Asana export file. Please try again.');
    };

    reader.readAsText(file);
    
    // Reset the input so the same file can be imported again
    event.target.value = '';
  };

  const handleDeleteProject = (projectToDelete) => {
    setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    setIsProjectFormOpen(false);
    setEditingProject(null);
  };

  const handleReorderProjects = (valueStreamId, newOrder) => {
    setProjects(prev => {
      // Remove all projects for this value stream from prev
      const others = prev.filter(p => p.valueStreamId !== valueStreamId);
      // Add the reordered projects for this value stream
      return [...others, ...newOrder];
    });
  };

  // Calculate average hours per month for visible projects
  let visibleProjects = projects;
  let timelineStart = null;
  let timelineEnd = null;
  if (currentView === 'portfolio') {
    // Try to match GanttChart's logic for timeline
    const now = new Date();
    let startDate, endDate;
    if (ganttChartRef.current && ganttChartRef.current.timelineData) {
      startDate = ganttChartRef.current.timelineData.startDate;
      endDate = ganttChartRef.current.timelineData.endDate;
    } else {
      // Fallback: use current month and timeRange
      const timeRange = 'quarter'; // Default to quarter for now
      if (timeRange === 'quarter') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 12, 0);
      }
    }
    timelineStart = startDate;
    timelineEnd = endDate;
    visibleProjects = projects.filter(p => {
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      return pEnd >= timelineStart && pStart <= timelineEnd;
    });
  }
  // Sum all resource hours for visible projects
  let totalHours = 0;
  let minStart = null, maxEnd = null;
  visibleProjects.forEach(p => {
    Object.values(p.resources || {}).forEach(r => {
      if (typeof r.hours === 'number') totalHours += r.hours;
    });
    const pStart = new Date(p.startDate);
    const pEnd = new Date(p.endDate);
    if (!minStart || pStart < minStart) minStart = pStart;
    if (!maxEnd || pEnd > maxEnd) maxEnd = pEnd;
  });
  // Calculate number of months in visible range
  let months = 1;
  if (minStart && maxEnd) {
    months = (maxEnd.getFullYear() - minStart.getFullYear()) * 12 + (maxEnd.getMonth() - minStart.getMonth()) + 1;
  }
  const avgHoursPerMonth = months > 0 ? Math.round(totalHours / months) : 0;

  // Export to PDF handler
  const handleExportPDF = async () => {
    if (!ganttChartRef.current) return;
    const chartNode = ganttChartRef.current;
    const canvas = await html2canvas(chartNode, { 
      backgroundColor: '#fff', 
      scale: 2,
      onclone: (clonedDoc) => {
        const clonedNode = clonedDoc.querySelector('.gantt-export');
        if (clonedNode) {
          clonedNode.style.backgroundColor = '#fff';
          // Force expanded state for all value streams
          const valueStreams = clonedDoc.querySelectorAll('[data-value-stream]');
          valueStreams.forEach(stream => {
            stream.style.height = 'auto';
            stream.style.opacity = '1';
          });
        }
      }
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('gantt-chart.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={fayeLogo} alt="Faye" className="h-8" />
              <h1 className="text-2xl font-bold">Portfolio Manager</h1>
            </div>
            {/* Main Navigation Tabs */}
            <nav className="flex items-center space-x-2 bg-white/10 rounded-lg px-2 py-1">
              <Button 
                variant={currentView === 'portfolio' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('portfolio')}
                className="text-white hover:text-purple-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Portfolio View
              </Button>
              <Button 
                variant={currentView === 'resources' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('resources')}
                className="text-white hover:text-purple-200"
              >
                <Users className="h-4 w-4 mr-2" />
                Resource Planning
              </Button>
              <Button 
                variant={currentView === 'quarterly' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('quarterly')}
                className="text-white hover:text-purple-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Quarterly View
              </Button>
              <Button 
                variant={currentView === 'settings' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('settings')}
                className="text-white hover:text-purple-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              {/* Files Dropdown: combines Scenarios and Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-white border-white bg-white/10 hover:bg-white/20">
                    <File className="h-4 w-4 mr-2" /> Files
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Switch Scenario</DropdownMenuLabel>
                  <select
                    className="w-full rounded bg-white px-2 py-1 text-gray-800 text-sm focus:outline-none border border-purple-200 mb-2"
                    value={scenarioName}
                    onChange={e => {
                      const name = e.target.value;
                      setScenarioName(name);
                      const loaded = loadScenario(name);
                      if (loaded) {
                        setProjects(loaded.projects || []);
                        setValueStreams(loaded.valueStreams || []);
                        setResourceTypes(loaded.resourceTypes || []);
                      }
                    }}
                  >
                    {getSavedScenarioNames().map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    {!getSavedScenarioNames().includes(scenarioName) && (
                      <option value={scenarioName}>{scenarioName}</option>
                    )}
                  </select>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>New Scenario</DropdownMenuLabel>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 rounded bg-white px-2 py-1 text-gray-800 text-sm border border-purple-200"
                      placeholder="New scenario name"
                      value={newScenarioName || ''}
                      onChange={e => setNewScenarioName(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        if (newScenarioName && newScenarioName.trim()) {
                          setScenarioName(newScenarioName.trim());
                          saveScenario(newScenarioName.trim(), { projects, valueStreams, resourceTypes });
                          saveLastScenarioName(newScenarioName.trim());
                          setNewScenarioName('');
                        }
                      }}
                    >
                      Save As
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportData}><Download className="h-4 w-4 mr-2" />Export</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" />Export to PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={triggerImport}><Upload className="h-4 w-4 mr-2" />Import</DropdownMenuItem>
                  <DropdownMenuItem onClick={loadDemoData}><Database className="h-4 w-4 mr-2" />Demo Data</DropdownMenuItem>
                  <DropdownMenuItem onClick={resetData} variant="destructive"><RotateCcw className="h-4 w-4 mr-2" />Reset</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAsanaImport(true)}>Import from Asana</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Value Streams (only show for portfolio view) */}
        {currentView === 'portfolio' && (
          <div 
            className={`relative flex flex-col transition-all duration-200 ease-in-out ${
              isSidebarCollapsed ? 'w-0' : ''
            }`}
            style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
            ref={sidebarRef}
          >
            <ValueStreamSidebar 
              projects={projects}
              valueStreams={valueStreams}
              selectedValueStream={selectedValueStream}
              onValueStreamSelect={handleValueStreamSelect}
            />
            
            {/* Resize handle */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-500 ${
                isResizing ? 'bg-purple-500' : 'bg-gray-200'
              }`}
              onMouseDown={handleMouseDown}
            />
            
            {/* Toggle button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-4 top-4 bg-white rounded-full p-1 shadow-md hover:bg-gray-50 z-10"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 p-6 ${currentView === 'portfolio' ? '' : 'max-w-full'}`}>
          {currentView === 'portfolio' && (
            <div className="h-full">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Project Portfolio</h2>
                    <p className="text-gray-600">
                      {selectedValueStream 
                        ? `Showing projects for ${valueStreams.find(s => s.id === selectedValueStream)?.name}`
                        : 'Showing all projects across value streams'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Monthly Contract Limit:</span>
                        <input
                          type="number"
                          value={contractHours}
                          onChange={(e) => setContractHours(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-24 px-2 py-1 border rounded text-right font-mono"
                          min="0"
                        />
                        <span className="text-sm text-gray-500">hours</span>
                      </div>
                      <div className="h-6 w-px bg-gray-300"></div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Required Hours:</span>
                        <span className={`font-mono text-lg font-semibold ${
                          avgHoursPerMonth > contractHours ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {avgHoursPerMonth.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">hours/month</span>
                      </div>
                      {contractHours > 0 && (
                        <>
                          <div className="h-6 w-px bg-gray-300"></div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge variant="outline" className={
                              avgHoursPerMonth > contractHours 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-green-50 text-green-700 border-green-200'
                            }>
                              {avgHoursPerMonth > contractHours 
                                ? `Over by ${(avgHoursPerMonth - contractHours).toLocaleString()} hours`
                                : `Under by ${(contractHours - avgHoursPerMonth).toLocaleString()} hours`
                              }
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {projects.filter(p => p.status === 'in-progress').length} Active
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {projects.filter(p => p.status === 'planned').length} Planned
                      </Badge>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        {projects.length} Total
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <GanttChart 
                projects={projects}
                valueStreams={valueStreams}
                selectedValueStream={selectedValueStream}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onReorderProjects={handleReorderProjects}
                avgHoursPerMonth={avgHoursPerMonth}
                chartRef={ganttChartRef}
              />
            </div>
          )}

          {currentView === 'resources' && (
            <ResourcePlanningPanel
              projects={projects}
              resourceTypes={resourceTypes}
              onProjectUpdate={handleUpdateProject}
            />
          )}

          {currentView === 'quarterly' && (
            <QuarterlyView valueStreams={valueStreams} projects={projects} resourceTypes={resourceTypes} />
          )}

          {currentView === 'settings' && (
            <SettingsPanel
              valueStreams={valueStreams}
              resourceTypes={resourceTypes}
              onUpdateValueStreams={handleUpdateValueStreams}
              onUpdateResourceTypes={handleUpdateResourceTypes}
            />
          )}
        </div>
      </div>

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={handleCloseProjectForm}
        onSave={handleSaveProject}
        valueStreamId={selectedValueStreamForForm}
        resourceTypes={resourceTypes}
        valueStreams={valueStreams}
        editingProject={editingProject}
        onDelete={handleDeleteProject}
      />
      
      {/* Hidden file input for import */}
      <input
        id="file-import"
        type="file"
        accept=".json"
        onChange={importData}
        style={{ display: 'none' }}
      />

      {showAsanaImport && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
            <h2 className="text-lg font-bold mb-2">Import from Asana</h2>
            <label className="block mb-2 text-sm font-medium">Select Value Stream:</label>
            <select
              className="w-full mb-4 p-2 border rounded"
              value={asanaImportValueStream}
              onChange={e => setAsanaImportValueStream(e.target.value)}
            >
              {valueStreams.map(vs => (
                <option key={vs.id} value={vs.id}>{vs.name}</option>
              ))}
            </select>
            <label className="block mb-2 text-sm font-medium">Select Asana JSON file:</label>
            <input type="file" accept=".json" onChange={handleAsanaImportFile} className="mb-4" />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAsanaImport(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

