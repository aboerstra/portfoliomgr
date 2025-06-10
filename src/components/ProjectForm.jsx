import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Calendar, Plus, X, ExternalLink, Minus, Pencil, Check, X as CloseIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
import { cn } from '@/lib/utils.js';
import { Switch } from '@/components/ui/switch.jsx';

// Add resource types definition
const resourceTypes = [
  { id: 'rt-1', name: 'Project Manager', color: '#8B5CF6' },
  { id: 'rt-2', name: 'Developer', color: '#3B82F6' },
  { id: 'rt-3', name: 'Designer', color: '#10B981' },
  { id: 'rt-4', name: 'QA Engineer', color: '#F59E0B' },
  { id: 'rt-5', name: 'Business Analyst', color: '#EC4899' }
];

const ProjectForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  valueStreamId = null,
  resourceTypes = [],
  valueStreams = [],
  editingProject = null,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'planned',
    progress: 0,
    valueStreamId: valueStreamId || '',
    resources: {},
    milestones: [],
    asanaUrl: '',
    pmAllocation: 20,
    autoPopulatePM: false,
    hoursUsed: 0,
    totalHours: 0,
    simpleMode: false,
    estimatedHours: 0,
    pmHours: 0
  });

  const [newMilestone, setNewMilestone] = useState({
    name: '',
    date: '',
    status: 'planned'
  });

  // Add a state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Add states for the date pickers
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  // Add state for editing milestone
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState({ name: '', date: '', status: 'planned' });

  // Reset form when opening/closing or when editingProject changes
  useEffect(() => {
    if (isOpen) {
      setIsStartDatePickerOpen(false);
      setIsEndDatePickerOpen(false);
      if (editingProject) {
        // Calculate PM hours based on auto-populate setting
        const pmHours = editingProject.autoPopulatePM ? 
          Math.ceil(editingProject.estimatedHours * (editingProject.pmAllocation / 100)) : 
          (editingProject.resources?.['rt-1']?.hours || 0);

        setFormData({
          ...editingProject,
          startDate: editingProject.startDate,
          endDate: editingProject.endDate,
          milestones: editingProject.milestones || [],
          asanaUrl: editingProject.asanaUrl || '',
          pmAllocation: editingProject.pmAllocation || 20,
          autoPopulatePM: editingProject.autoPopulatePM || false,
          estimatedHours: editingProject.estimatedHours || 0,
          pmHours: pmHours,
          totalHours: editingProject.simpleMode ? 
            (editingProject.estimatedHours || 0) + pmHours :
            Object.values(editingProject.resources || {})
              .filter(resource => resource.id !== 'rt-1')
              .reduce((sum, resource) => sum + (resource.hours || 0), 0) + pmHours
        });
        setStartDate(editingProject.startDate ? new Date(editingProject.startDate) : null);
        setEndDate(editingProject.endDate ? new Date(editingProject.endDate) : null);
      } else {
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          priority: 'medium',
          status: 'planned',
          progress: 0,
          valueStreamId: valueStreamId || '',
          resources: {},
          milestones: [],
          asanaUrl: '',
          pmAllocation: 20,
          autoPopulatePM: false,
          hoursUsed: 0,
          totalHours: 0,
          simpleMode: false,
          estimatedHours: 0,
          pmHours: 0
        });
        setStartDate(null);
        setEndDate(null);
      }
    }
  }, [isOpen, editingProject, valueStreamId]);

  // When dates change, update formData
  useEffect(() => {
    setFormData(prev => {
      const newData = {
        ...prev,
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        endDate: endDate ? endDate.toISOString().split('T')[0] : ''
      };

      // Calculate PM hours if auto-populate is checked and we have both dates
      if (newData.autoPopulatePM && newData.startDate && newData.endDate) {
        const startDate = new Date(newData.startDate);
        const endDate = new Date(newData.endDate);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const pmHours = Math.ceil(daysDiff * 8 * (newData.pmAllocation / 100)); // Convert percentage to decimal
        
        newData.resources = {
          ...newData.resources,
          'rt-1': { // Project Manager resource type
            required: 1,
            allocated: 1,
            hours: pmHours
          }
        };
      }

      return newData;
    });
  }, [startDate, endDate]);

  // Add click outside handlers for date pickers
  useEffect(() => {
    const handleClickOutside = (event) => {
      const startButton = document.getElementById('startDateButton');
      const startCalendar = document.getElementById('startDateCalendar');
      const endButton = document.getElementById('endDateButton');
      const endCalendar = document.getElementById('endDateCalendar');
      
      if (isStartDatePickerOpen && 
          startButton && 
          !startButton.contains(event.target) && 
          startCalendar && 
          !startCalendar.contains(event.target)) {
        setIsStartDatePickerOpen(false);
      }
      
      if (isEndDatePickerOpen && 
          endButton && 
          !endButton.contains(event.target) && 
          endCalendar && 
          !endCalendar.contains(event.target)) {
        setIsEndDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStartDatePickerOpen, isEndDatePickerOpen]);

  // Add a useEffect to recalculate total hours whenever dependencies change
  useEffect(() => {
    if (formData.simpleMode) {
      const pmHours = formData.autoPopulatePM ? 
        Math.ceil(formData.estimatedHours * (formData.pmAllocation / 100)) : 
        formData.pmHours;
      
      setFormData(prev => ({
        ...prev,
        totalHours: formData.estimatedHours + pmHours
      }));
    } else {
      const pmHours = Math.ceil(formData.estimatedHours * (formData.pmAllocation / 100));
      const resourceHours = Object.values(formData.resources || {})
        .filter(resource => resource.id !== 'rt-1')
        .reduce((sum, resource) => sum + (resource.hours || 0), 0);
      
      setFormData(prev => ({
        ...prev,
        totalHours: resourceHours + pmHours
      }));
    }
  }, [formData.simpleMode, formData.estimatedHours, formData.pmHours, formData.pmAllocation, formData.autoPopulatePM, formData.resources]);

  const calculatePMHours = (resources, pmAllocation) => {
    // Sum up all non-PM resource hours
    const totalNonPMHours = Object.entries(resources || {})
      .filter(([type]) => type !== 'rt-1') // Exclude PM hours
      .reduce((sum, [_, { hours }]) => sum + (hours || 0), 0);
    
    // Calculate PM hours as percentage of total non-PM hours
    return Math.ceil(totalNonPMHours * (pmAllocation / 100));
  };

  const handleInputChange = (field, value) => {
    if (field === 'simpleMode') {
      setFormData(prev => ({
        ...prev,
        simpleMode: value
      }));
      return;
    }

    if (field === 'estimatedHours') {
      const estimatedHours = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        estimatedHours,
        pmHours: prev.autoPopulatePM ? 
          Math.ceil(estimatedHours * (prev.pmAllocation / 100)) : 
          prev.pmHours
      }));
      return;
    }

    if (field === 'pmAllocation') {
      setFormData(prev => ({
        ...prev,
        pmAllocation: value,
        pmHours: prev.autoPopulatePM ? 
          Math.ceil(prev.estimatedHours * (value / 100)) : 
          prev.pmHours
      }));
      return;
    }

    if (field === 'pmHours') {
      const pmHours = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        pmHours
      }));
      return;
    }

    if (field === 'autoPopulatePM') {
      const pmHours = value ? 
        Math.ceil(formData.estimatedHours * (formData.pmAllocation / 100)) : 
        formData.pmHours;
      
      setFormData(prev => ({
        ...prev,
        autoPopulatePM: value,
        pmHours
      }));
      return;
    }

    if (field === 'totalHours') {
      // Total hours should never be directly editable
      return;
    }

    if (field === 'resources' && formData.autoPopulatePM) {
      // Recalculate PM hours when other resource hours change and auto-populate is checked
      const pmHours = calculatePMHours(value, formData.pmAllocation);
      
      setFormData(prev => ({
        ...prev,
        resources: {
          ...value,
          'rt-1': { // Project Manager resource type
            required: 1,
            allocated: 1,
            hours: pmHours
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleResourceChange = (resourceType, field, value) => {
    setFormData(prev => {
      const newResources = {
        ...prev.resources,
        [resourceType]: {
          ...prev.resources[resourceType],
          [field]: field === 'hours' ? parseFloat(value) || 0 : parseInt(value) || 0
        }
      };

      // Calculate total hours from resources + PM hours
      const pmHours = Math.ceil(prev.estimatedHours * (prev.pmAllocation / 100));
      const totalHours = Object.values(newResources)
        .filter(resource => resource.id !== 'rt-1')
        .reduce((sum, resource) => sum + (resource.hours || 0), 0) + pmHours;

      return {
        ...prev,
        resources: newResources,
        totalHours: !prev.simpleMode ? totalHours : prev.totalHours
      };
    });
  };

  const addMilestone = () => {
    if (newMilestone.name && newMilestone.date) {
      const milestone = {
        id: `ms-${Date.now()}`,
        ...newMilestone
      };
      
      setFormData(prev => ({
        ...prev,
        milestones: [...prev.milestones, milestone]
      }));
      
      setNewMilestone({
        name: '',
        date: '',
        status: 'planned'
      });
    }
  };

  const removeMilestone = (milestoneId) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== milestoneId)
    }));
  };

  const startEditMilestone = (milestone) => {
    setEditingMilestoneId(milestone.id);
    setEditingMilestone({ name: milestone.name, date: milestone.date, status: milestone.status });
  };

  const cancelEditMilestone = () => {
    setEditingMilestoneId(null);
    setEditingMilestone({ name: '', date: '', status: 'planned' });
  };

  const saveEditMilestone = (id) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => m.id === id ? { ...m, ...editingMilestone } : m)
    }));
    setEditingMilestoneId(null);
    setEditingMilestone({ name: '', date: '', status: 'planned' });
  };

  const handleSave = () => {
    if (formData.name && formData.valueStreamId && formData.startDate && formData.endDate) {
      let project = {
        ...formData,
        id: editingProject ? editingProject.id : `proj-${Date.now()}`,
        progress: formData.totalHours > 0 ? Math.round((formData.hoursUsed / formData.totalHours) * 100) : 0
      };
      
      // Calculate PM hours if auto-populate is checked
      if (formData.autoPopulatePM) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const pmHours = Math.ceil((daysDiff * 8 * formData.pmAllocation) / 100); // 8 hours per day
        
        project.resources = {
          ...project.resources,
          'rt-1': { // Project Manager resource type
            required: 1,
            allocated: 1,
            hours: pmHours
          }
        };
      }
      
      onSave(project);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        valueStreamId: valueStreamId || '',
        startDate: '',
        endDate: '',
        priority: 'medium',
        status: 'planned',
        resources: {},
        milestones: [],
        asanaUrl: '',
        pmAllocation: 20,
        autoPopulatePM: false,
        hoursUsed: 0,
        totalHours: 0
      });
      
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
          <DialogDescription>
            {editingProject ? 'Update the details of your project.' : 'Fill out the details to add a new project.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Project Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter project name"
                />
                {/* Asana Link Icon */}
                {(formData.asanaUrl || (editingProject && editingProject.asanaUrl)) && (
                  <a
                    href={formData.asanaUrl || editingProject.asanaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in Asana"
                    className="inline-flex items-center mt-1 text-purple-700 hover:text-purple-900 text-xs"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in Asana
                  </a>
                )}
              </div>
              
              <div>
                <Label htmlFor="valueStreamId">Value Stream *</Label>
                <Select value={formData.valueStreamId} onValueChange={(value) => handleInputChange('valueStreamId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a value stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {valueStreams.map((stream) => (
                      <SelectItem key={stream.id} value={stream.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stream.color }}
                          />
                          <span>{stream.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Project Dates *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Button
                      id="startDateButton"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !startDate && "text-muted-foreground"
                      )}
                      onClick={() => setIsStartDatePickerOpen(!isStartDatePickerOpen)}
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0" />
                      <span>
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </span>
                    </Button>
                    {isStartDatePickerOpen && (
                      <div id="startDateCalendar" className="absolute z-50 mt-2">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            setIsStartDatePickerOpen(false);
                          }}
                          initialFocus
                          className="bg-white rounded-md border shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Button
                      id="endDateButton"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !endDate && "text-muted-foreground"
                      )}
                      onClick={() => setIsEndDatePickerOpen(!isEndDatePickerOpen)}
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0" />
                      <span>
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </span>
                    </Button>
                    {isEndDatePickerOpen && (
                      <div id="endDateCalendar" className="absolute z-50 mt-2">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            setIsEndDatePickerOpen(false);
                          }}
                          initialFocus
                          className="bg-white rounded-md border shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asanaUrl">Asana URL</Label>
                <Input
                  id="asanaUrl"
                  value={formData.asanaUrl}
                  onChange={(e) => handleInputChange('asanaUrl', e.target.value)}
                  placeholder="Enter Asana project URL"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
          </div>

          {/* Hours Tracking */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hours Tracking</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Resource Management</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="simpleMode"
                    checked={formData.simpleMode}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        simpleMode: checked,
                        // Reset hours when switching modes
                        estimatedHours: checked ? prev.estimatedHours : 0,
                        pmHours: checked ? prev.pmHours : 0,
                        totalHours: checked ? (prev.estimatedHours || 0) + (prev.pmHours || 0) : 0
                      }));
                    }}
                  />
                  <Label htmlFor="simpleMode" className="text-sm">Simple Mode</Label>
                </div>
              </div>

              {formData.simpleMode ? (
                // Simple Mode: Just show total hours and PM allocation
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        min="0"
                        value={formData.estimatedHours || ''}
                        onChange={(e) => {
                          const hours = parseInt(e.target.value) || 0;
                          setFormData(prev => ({
                            ...prev,
                            estimatedHours: hours,
                            totalHours: hours + (prev.pmHours || 0)
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pmAllocation">PM Allocation (%)</Label>
                      <Input
                        id="pmAllocation"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.pmAllocation || ''}
                        onChange={(e) => {
                          const allocation = parseInt(e.target.value) || 0;
                          const pmHours = Math.ceil((formData.estimatedHours || 0) * (allocation / 100));
                          setFormData(prev => ({
                            ...prev,
                            pmAllocation: allocation,
                            pmHours: pmHours,
                            totalHours: (prev.estimatedHours || 0) + pmHours
                          }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoPopulatePM"
                      checked={formData.autoPopulatePM}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          autoPopulatePM: e.target.checked,
                          pmHours: e.target.checked ? 
                            Math.ceil((prev.estimatedHours || 0) * (prev.pmAllocation / 100)) : 
                            prev.pmHours
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <Label htmlFor="autoPopulatePM" className="text-sm text-gray-700">
                      Auto-populate PM hours based on allocation
                    </Label>
                  </div>
                </div>
              ) : (
                // Detailed Mode: Show resource type breakdown
                <div className="space-y-4">
                  {resourceTypes.map((type) => (
                    <div key={type.id} className="grid grid-cols-3 gap-4 items-end">
                      <div>
                        <Label htmlFor={`${type.id}-required`} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.name}</span>
                        </Label>
                        <Input
                          id={`${type.id}-required`}
                          type="number"
                          min="0"
                          value={formData.resources[type.id]?.required || 0}
                          onChange={(e) => {
                            const required = parseInt(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              resources: {
                                ...prev.resources,
                                [type.id]: {
                                  ...prev.resources[type.id],
                                  required,
                                  hours: required * 8 * 5 * 4 // 8 hours/day * 5 days * 4 weeks
                                }
                              }
                            }));
                          }}
                          placeholder="# Required"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${type.id}-allocated`}>Allocated</Label>
                        <Input
                          id={`${type.id}-allocated`}
                          type="number"
                          min="0"
                          value={formData.resources[type.id]?.allocated || 0}
                          onChange={(e) => {
                            const allocated = parseInt(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              resources: {
                                ...prev.resources,
                                [type.id]: {
                                  ...prev.resources[type.id],
                                  allocated
                                }
                              }
                            }));
                          }}
                          placeholder="# Allocated"
                        />
                      </div>
                      <div>
                        <Label>Hours Required</Label>
                        <Input
                          id={`${type.id}-hours`}
                          type="number"
                          min="0"
                          value={formData.resources[type.id]?.hours || 0}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              resources: {
                                ...prev.resources,
                                [type.id]: {
                                  ...prev.resources[type.id],
                                  hours
                                }
                              }
                            }));
                          }}
                          placeholder="Hours Required"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hours and Progress Summary - Always Visible */}
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Total Hours</Label>
                  <div className="text-lg font-semibold">
                    {formData.simpleMode 
                      ? formData.totalHours || 0
                      : Object.values(formData.resources || {})
                          .reduce((sum, resource) => sum + (resource.hours || 0), 0)
                    } hours
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hoursUsed">Hours Used</Label>
                    <Input
                      id="hoursUsed"
                      type="number"
                      min="0"
                      value={formData.hoursUsed || 0}
                      onChange={(e) => {
                        const hoursUsed = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          hoursUsed
                        }));
                      }}
                      placeholder="Enter hours used"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Progress</Label>
                    <div className="text-lg font-semibold">
                      {(() => {
                        const totalHours = formData.simpleMode 
                          ? formData.totalHours || 0
                          : Object.values(formData.resources || {})
                              .reduce((sum, resource) => sum + (resource.hours || 0), 0);
                        const hoursUsed = formData.hoursUsed || 0;
                        return totalHours > 0 ? Math.min(Math.round((hoursUsed / totalHours) * 100), 100) : 0;
                      })()}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Milestones</h3>
            
            {/* Add Milestone Form */}
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <Label htmlFor="milestoneName" className="text-base">Name</Label>
                <Input
                  id="milestoneName"
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter milestone name"
                />
              </div>
              
              <div className="w-40 min-w-[120px] max-w-full">
                <Label htmlFor="milestoneDate" className="text-base">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !newMilestone.date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0" />
                      <span>
                        {newMilestone.date
                          ? format(new Date(newMilestone.date), "MM/dd/yy")
                          : "Pick a date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4} forceMount>
                    <div className="bg-white rounded-md border shadow-md">
                      <CalendarComponent
                        mode="single"
                        selected={newMilestone.date ? new Date(newMilestone.date) : undefined}
                        onSelect={date => setNewMilestone(prev => ({ ...prev, date: date ? date.toISOString().split('T')[0] : '' }))}
                        initialFocus
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={addMilestone} size="icon" className="rounded-full bg-green-600 hover:bg-green-700 text-white w-10 h-10 flex items-center justify-center" aria-label="Add Milestone">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Milestone List */}
            <div className="space-y-2">
              {formData.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingMilestoneId === milestone.id ? (
                    <>
                      <div className="flex items-center space-x-4 flex-1">
                        <Input
                          value={editingMilestone.name}
                          onChange={(e) => setEditingMilestone(prev => ({ ...prev, name: e.target.value }))}
                          className="flex-1"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-32 justify-start text-left font-normal h-10",
                                !editingMilestone.date && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4 shrink-0" />
                              <span>
                                {editingMilestone.date
                                  ? format(new Date(editingMilestone.date), "MM/dd/yy")
                                  : "Pick a date"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4} forceMount>
                            <div className="bg-white rounded-md border shadow-md">
                              <CalendarComponent
                                mode="single"
                                selected={editingMilestone.date ? new Date(editingMilestone.date) : undefined}
                                onSelect={date => setEditingMilestone(prev => ({ ...prev, date: date ? date.toISOString().split('T')[0] : '' }))}
                                initialFocus
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Button onClick={() => saveEditMilestone(milestone.id)} size="icon" className="rounded-full bg-green-600 hover:bg-green-700 text-white w-8 h-8 flex items-center justify-center ml-2" aria-label="Save Milestone">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button onClick={cancelEditMilestone} size="icon" className="rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 w-8 h-8 flex items-center justify-center ml-2" aria-label="Cancel Edit">
                          <CloseIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-4 flex-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{milestone.name}</div>
                          <div className="text-sm text-gray-500">
                            {milestone.date ? format(new Date(milestone.date), "MM/dd/yy") : ''}
                          </div>
                        </div>
                        <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                          {milestone.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => startEditMilestone(milestone)} size="icon" variant="ghost" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => removeMilestone(milestone.id)} size="icon" variant="ghost" className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {editingProject && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="mr-auto"
            >
              Delete Project
            </Button>
          )}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              {editingProject ? 'Save Changes' : 'Add Project'}
            </Button>
          </div>
        </DialogFooter>

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <div className="font-semibold mb-2">Delete Project?</div>
              <div className="mb-4 text-gray-700">Are you sure you want to delete this project? This action cannot be undone.</div>
              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={() => { setShowDeleteConfirm(false); onDelete && onDelete(editingProject); onClose(); }}
                >
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;

