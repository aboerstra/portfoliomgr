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
import { Calendar, BarChart3, Users, Settings, Download, Upload, RotateCcw, Database, Save, ChevronLeft, ChevronRight, File, Trash2, Pencil, HelpCircle } from 'lucide-react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import fayeLogo from './assets/faye-logo-white.png'
import ValueStreamSidebar from './components/ValueStreamSidebar.jsx'
import GanttChart from './components/GanttChart.jsx'
import ProjectForm from './components/ProjectForm.jsx'
import ResourcePlanningPanel from './components/ResourcePlanningPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import FilesPage from './pages/FilesPage.jsx'
import RocksPlanning from './components/RocksPlanning.jsx'
import ScenarioManager from './components/ScenarioManager.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import './App.css'
import { projects as initialProjects, valueStreams as initialValueStreams, resourceTypes as initialResourceTypes } from './data/sampleData.js';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { calculateResourceRequirementsForRange } from './utils/resourceCalculator';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import HelpPage from '@/components/HelpPage';

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
  const milestoneTasks = asanaJson.data.filter(task => 
    task.resource_subtype === 'milestone'
  );

  // Create a map of milestone tasks for quick lookup
  const milestoneMap = new Map(milestoneTasks.map(task => [task.gid, task]));

  // Then process all tasks, creating projects and adding milestones
  const importedProjects = asanaJson.data
    .filter(task => task.resource_subtype !== 'milestone')
    .map(task => {
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

      // Find any milestone tasks that are subtasks of this task
      const subtaskMilestones = asanaJson.data.filter(subtask => 
        subtask.resource_subtype === 'milestone' && 
        subtask.parent?.gid === task.gid
      );

      // Add milestones to the project
      subtaskMilestones.forEach(milestoneTask => {
        const milestoneDate = milestoneTask.due_on || 
                            getCustomField(milestoneTask, 'Start Date') || 
                            milestoneTask.start_on;
        
        project.milestones.push({
          id: `milestone-${milestoneTask.gid}`,
          name: milestoneTask.name || 'Untitled Milestone',
          date: milestoneDate,
          description: milestoneTask.notes || '',
          status: milestoneTask.completed ? 'completed' : 'planned',
          asanaUrl: milestoneTask.permalink_url || '',
        });
      });

      return project;
    });

  return importedProjects;
}

function PortfolioView() {
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
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState('currentQuarter');
  const [clientName, setClientName] = useState(() => {
    const savedData = localStorage.getItem('portfolioData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        return data.clientName || 'Client Name';
      } catch (e) {
        return 'Client Name';
      }
    }
    return 'Client Name';
  });
  const [isEditingClient, setIsEditingClient] = useState(false);

  // Helper function to save data
  const saveData = () => {
    try {
      const data = {
        projects,
        valueStreams,
        resourceTypes,
        clientName,
      };
      localStorage.setItem('portfolioData', JSON.stringify(data));
      console.log('Data saved successfully:', { clientName });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Helper function to load data
  const loadData = () => {
    try {
      console.log('Attempting to load from localStorage...');
      const savedData = localStorage.getItem('portfolioData');
      if (savedData) {
        console.log('Data found in localStorage');
        return JSON.parse(savedData);
      }
      
      console.log('Attempting to load from sessionStorage...');
      const sessionData = sessionStorage.getItem('portfolioData');
      if (sessionData) {
        console.log('Data found in sessionStorage');
        return JSON.parse(sessionData);
      }
      
      console.log('No data found in either storage');
      return null;
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  };

  // On first mount, ensure state is loaded from last scenario
  useEffect(() => {
    try {
      // Check if storage is available
      const testKey = 'test_storage';
      try {
        console.log('Testing storage availability...');
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        sessionStorage.setItem(testKey, 'test');
        sessionStorage.removeItem(testKey);
        console.log('Storage is available');
      } catch (e) {
        console.error('Storage is not available:', e);
        alert('Warning: Your browser settings are preventing data from being saved. Please check your privacy settings and allow storage for this site.');
        return;
      }

      // Load data using the helper function
      const data = loadData();
      
      if (data) {
        console.log('Loading saved data:', {
          projects: data.projects.length,
          valueStreams: data.valueStreams.length,
          resourceTypes: data.resourceTypes.length
        });
        
        setProjects(data.projects);
        setValueStreams(data.valueStreams);
        setResourceTypes(data.resourceTypes);
        console.log('State updated with saved data');
      } else {
        console.log('No saved data found, using demo data');
        setProjects(initialProjects);
        setValueStreams(initialValueStreams);
        setResourceTypes(initialResourceTypes);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      setProjects(initialProjects);
      setValueStreams(initialValueStreams);
      setResourceTypes(initialResourceTypes);
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

  const handleImportData = async (file) => {
    try {
      setIsImporting(true);
      setError(null);
      console.log('Starting import process...');
      
      if (!file) {
        throw new Error('No file selected');
      }
      
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(buffer);
      console.log('File read successfully:', text.substring(0, 100) + '...');
      
      let data;
      try {
        data = JSON.parse(text);
        console.log('JSON parsed successfully. Keys:', Object.keys(data));
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON format. Please ensure the file is properly formatted JSON.');
      }
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data: Root must be an object');
      }
      
      // Check for required keys
      const requiredKeys = ['projects', 'valueStreams', 'resourceTypes'];
      const missingKeys = requiredKeys.filter(key => !(key in data));
      if (missingKeys.length > 0) {
        throw new Error(`Missing required keys: ${missingKeys.join(', ')}`);
      }
      
      // Validate each array
      if (!Array.isArray(data.projects)) {
        throw new Error('Projects must be an array');
      }
      if (!Array.isArray(data.valueStreams)) {
        throw new Error('Value Streams must be an array');
      }
      if (!Array.isArray(data.resourceTypes)) {
        throw new Error('Resource Types must be an array');
      }
      
      // Clean and normalize the data
      console.log('Cleaning and normalizing data...');
      const cleanData = {
        projects: data.projects.map(project => ({
          ...project,
          id: String(project.id || Math.random().toString(36).substr(2, 9)),
          name: String(project.name || ''),
          description: String(project.description || ''),
          startDate: project.startDate ? new Date(project.startDate).toISOString() : null,
          endDate: project.endDate ? new Date(project.endDate).toISOString() : null,
          valueStreamId: project.valueStreamId ? String(project.valueStreamId) : null,
          resourceTypeId: project.resourceTypeId ? String(project.resourceTypeId) : null,
          status: String(project.status || 'Not Started'),
          priority: String(project.priority || 'Medium'),
          progress: Number(project.progress || 0),
          resources: project.resources || {},
          milestones: Array.isArray(project.milestones) ? project.milestones.map(milestone => ({
            ...milestone,
            id: String(milestone.id || Math.random().toString(36).substr(2, 9)),
            name: String(milestone.name || ''),
            date: milestone.date ? new Date(milestone.date).toISOString() : null,
            status: String(milestone.status || 'planned')
          })) : [],
          asanaUrl: String(project.asanaUrl || '')
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
        }))
      };
      
      console.log('Data cleaned and normalized. Proceeding with save...');
      
      // Save data using the helper function
      const saveSuccess = saveData(cleanData);
      if (!saveSuccess) {
        throw new Error('Failed to save data to any storage. Please check your browser settings.');
      }
      
      // Update state with imported data
      console.log('Updating application state...');
      setProjects(cleanData.projects);
      setValueStreams(cleanData.valueStreams);
      setResourceTypes(cleanData.resourceTypes);
      console.log('State updated with imported data');
      
      // Show success message
      alert(`Successfully imported ${cleanData.projects.length} projects, ${cleanData.valueStreams.length} value streams, and ${cleanData.resourceTypes.length} resource types!`);
      
      // No need to reload the page anymore
      console.log('Import completed successfully');
    } catch (err) {
      console.error('Import failed:', err);
      setError(err.message);
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const triggerImport = () => {
    document.getElementById('import-file').click()
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

        // Check for duplicates
        const duplicateIds = importedProjects
          .map(p => p.id)
          .filter(id => projects.some(p => p.id === id));

        if (duplicateIds.length > 0) {
          const shouldReplace = window.confirm(
            `Found ${duplicateIds.length} existing tasks with the same IDs. Would you like to replace them? (Click OK to replace, Cancel to skip duplicates)`
          );

          if (shouldReplace) {
            // Replace existing projects and add new ones
            setProjects(prev => {
              const filtered = prev.filter(p => !duplicateIds.includes(p.id));
              return [...filtered, ...importedProjects];
            });
          } else {
            // Skip duplicates and only add new projects
            setProjects(prev => {
              const newProjects = importedProjects.filter(p => !duplicateIds.includes(p.id));
              return [...prev, ...newProjects];
            });
          }
        } else {
          // No duplicates, just add all projects
          setProjects(prev => [...prev, ...importedProjects]);
        }
        
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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log('File selected:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file');
    
    if (file) {
      console.log('Starting file import...');
      handleImportData(file);
    }
  };

  const resourceData = calculateResourceRequirementsForRange(projects, selectedRange);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#59168B] text-white p-4">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={fayeLogo} alt="Faye Logo" className="h-8" />
              <div className="flex flex-col">
                <span className="text-sm text-purple-200">Portfolio Planner, prepared for</span>
                <div className="flex items-center space-x-2">
                  {isEditingClient ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="h-8 w-64 bg-purple-800 text-white border-purple-700"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setIsEditingClient(false);
                            saveData();
                          }
                        }}
                        onBlur={() => {
                          setIsEditingClient(false);
                          saveData();
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div 
                      className="flex items-center space-x-2 cursor-pointer hover:text-purple-200"
                      onClick={() => setIsEditingClient(true)}
                    >
                      <h1 className="text-xl font-bold">{clientName}</h1>
                      <Pencil className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
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
                variant={currentView === 'resource-planning' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('resource-planning')}
                className="text-white hover:text-purple-200"
              >
                <Users className="h-4 w-4 mr-2" />
                Resource Planning
              </Button>
              <Button 
                variant={currentView === 'rocks-planning' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('rocks-planning')}
                className="text-white hover:text-purple-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Rocks Planning
              </Button>
              <Button 
                variant={currentView === 'settings' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('settings')}
                className="text-white hover:text-purple-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant={currentView === 'files' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('files')}
                className="text-white hover:text-purple-200"
              >
                <File className="h-4 w-4 mr-2" />
                Files
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={currentView === 'help' ? 'secondary' : 'ghost'}
                    onClick={() => setCurrentView('help')}
                    className="text-white"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View help documentation</p>
                </TooltipContent>
              </Tooltip>
            </nav>
            {/* Import/Export Buttons */}
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                id="fileInput"
                style={{ display: 'none' }}
              />
              <Button
                variant="ghost"
                onClick={() => setShowAsanaImport(true)}
                className="text-white hover:text-purple-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import from Asana
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById('fileInput').click()}
                className="text-white hover:text-purple-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import JSON
              </Button>
              <Button
                variant="ghost"
                onClick={exportData}
                className="text-white hover:text-purple-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                onClick={resetData}
                className="text-white hover:text-red-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:text-purple-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Scenarios
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Scenario Management</DialogTitle>
                  </DialogHeader>
                  <ScenarioManager
                    currentData={{ projects, valueStreams, resourceTypes }}
                    onLoadScenario={(data) => {
                      setProjects(data.projects);
                      setValueStreams(data.valueStreams);
                      setResourceTypes(data.resourceTypes);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
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
                        <span>{resourceData.avgHoursPerMonth} hours/month</span>
                        <select
                          value={selectedRange}
                          onChange={(e) => setSelectedRange(e.target.value)}
                          className="border rounded p-1"
                        >
                          <option value="lastYear">Last Year</option>
                          <option value="lastQuarter">Last Quarter</option>
                          <option value="lastMonth">Last Month</option>
                          <option value="currentMonth">Current Month</option>
                          <option value="currentQuarter">Current Quarter</option>
                          <option value="currentYear">Current Year</option>
                          <option value="nextMonth">Next Month</option>
                          <option value="nextQuarter">Next Quarter</option>
                          <option value="nextYear">Next Year</option>
                        </select>
                      </div>
                      {contractHours > 0 && (
                        <>
                          <div className="h-6 w-px bg-gray-300"></div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge variant="outline" className={
                              resourceData.avgHoursPerMonth > contractHours ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-green-50 text-green-700 border-green-200'
                            }>
                              {resourceData.avgHoursPerMonth > contractHours 
                                ? `Over by ${(resourceData.avgHoursPerMonth - contractHours).toLocaleString()} hours`
                                : `Under by ${(contractHours - resourceData.avgHoursPerMonth).toLocaleString()} hours`
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
                avgHoursPerMonth={resourceData.avgHoursPerMonth}
                chartRef={ganttChartRef}
              />
            </div>
          )}

          {currentView === 'resource-planning' && (
            <ResourcePlanningPanel
              projects={projects}
              resourceTypes={resourceTypes}
              onProjectUpdate={handleUpdateProject}
            />
          )}

          {currentView === 'rocks-planning' && (
            <RocksPlanning
              valueStreams={valueStreams}
              projects={projects}
              resourceTypes={resourceTypes}
              onUpdateProjects={setProjects}
            />
          )}

          {currentView === 'settings' && (
            <SettingsPanel
              valueStreams={valueStreams}
              resourceTypes={resourceTypes}
              onUpdateValueStreams={handleUpdateValueStreams}
              onUpdateResourceTypes={handleUpdateResourceTypes}
            />
          )}

          {currentView === 'files' && (
            <FilesPage
              onExport={exportData}
              onImport={handleImportData}
              onReset={resetData}
              isExporting={false}
              isImporting={isImporting}
              isResetting={false}
              error={error}
              fileInputRef={null}
            />
          )}

          {currentView === 'help' && (
            <div className="p-6">
              <HelpPage />
            </div>
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
        id="import-file"
        ref={null}
        type="file"
        accept=".json"
        onChange={handleFileChange}
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PortfolioView />} />
      </Routes>
    </Router>
  );
}

