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
    asanaUrl: ''
  });

  const [newMilestone, setNewMilestone] = useState({
    name: '',
    date: '',
    status: 'planned'
  });

  // Add a state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Add a state for the date range
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  // Add state for editing milestone
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState({ name: '', date: '', status: 'planned' });

  // Reset form when opening/closing or when editingProject changes
  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setFormData({
          ...editingProject,
          startDate: editingProject.startDate,
          endDate: editingProject.endDate,
          milestones: editingProject.milestones || [],
          asanaUrl: editingProject.asanaUrl || ''
        });
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
          asanaUrl: ''
        });
      }
    }
  }, [isOpen, editingProject, valueStreamId]);

  // Update dateRange when editingProject changes
  useEffect(() => {
    if (isOpen) {
      if (editingProject && editingProject.startDate && editingProject.endDate) {
        setDateRange({
          from: new Date(editingProject.startDate),
          to: new Date(editingProject.endDate)
        });
      } else {
        setDateRange({ from: null, to: null });
      }
    }
  }, [isOpen, editingProject]);

  // When dateRange changes, update formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      startDate: dateRange.from ? dateRange.from.toISOString().split('T')[0] : '',
      endDate: dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''
    }));
  }, [dateRange]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResourceChange = (resourceType, field, value) => {
    setFormData(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [resourceType]: {
          ...prev.resources[resourceType],
          [field]: field === 'hours' ? parseFloat(value) || 0 : parseInt(value) || 0
        }
      }
    }));
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
      const project = {
        ...formData,
        id: editingProject ? editingProject.id : `proj-${Date.now()}`,
        progress: editingProject ? editingProject.progress : 0
      };
      
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
        asanaUrl: ''
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
                <Label htmlFor="valueStream">Value Stream *</Label>
                <Select value={formData.valueStreamId} onValueChange={(value) => handleInputChange('valueStreamId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value stream" />
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* Date Range Picker */}
                <div className="space-y-4">
                  <Label htmlFor="dateRange">Project Dates *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !dateRange.from && !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 shrink-0" />
                        <span>
                          {dateRange.from && dateRange.to
                            ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                            : "Pick a date range"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
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
            </div>
          </div>

          {/* Resource Allocation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mt-8">Resource Allocation</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {resourceTypes.map((resourceType) => (
                <div key={resourceType.id} className="space-y-2">
                  <Label className="text-base">{resourceType.name}</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Required"
                        value={formData.resources[resourceType.id]?.required || ''}
                        onChange={(e) => handleResourceChange(resourceType.id, 'required', e.target.value)}
                        min="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">Required</div>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Allocated"
                        value={formData.resources[resourceType.id]?.allocated || ''}
                        onChange={(e) => handleResourceChange(resourceType.id, 'allocated', e.target.value)}
                        min="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">Allocated</div>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Hours Required"
                        value={formData.resources[resourceType.id]?.hours || ''}
                        onChange={(e) => handleResourceChange(resourceType.id, 'hours', e.target.value)}
                        min="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">Hours</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between mt-8 mb-4">
              <h3 className="text-lg font-semibold">Milestones / Rocks</h3>
            </div>
            {/* Add Milestone Form */}
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex flex-row flex-wrap gap-4 items-end max-w-full">
                <div className="flex-1 min-w-[140px] max-w-full">
                  <Label htmlFor="milestoneName" className="text-base">Milestone Name</Label>
                  <Input
                    id="milestoneName"
                    value={newMilestone.name}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter milestone name"
                  />
                </div>
                <div className="w-40 min-w-[120px] max-w-full">
                  <Label htmlFor="milestoneStatus" className="text-base">Status</Label>
                  <Select value={newMilestone.status} onValueChange={(value) => setNewMilestone(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newMilestone.date ? new Date(newMilestone.date) : undefined}
                        onSelect={date => setNewMilestone(prev => ({ ...prev, date: date ? date.toISOString().split('T')[0] : '' }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={addMilestone} size="icon" className="rounded-full bg-green-600 hover:bg-green-700 text-white w-10 h-10 flex items-center justify-center" aria-label="Add Milestone">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Milestone List */}
            {formData.milestones.length > 0 && (
              <div className="space-y-2">
                {formData.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg gap-4">
                    {editingMilestoneId === milestone.id ? (
                      <>
                        <div className="flex flex-row flex-wrap gap-2 items-end w-full">
                          <Input
                            className="flex-1 min-w-[120px]"
                            value={editingMilestone.name}
                            onChange={e => setEditingMilestone(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Milestone name"
                          />
                          <Select value={editingMilestone.status} onValueChange={value => setEditingMilestone(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
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
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={editingMilestone.date ? new Date(editingMilestone.date) : undefined}
                                onSelect={date => setEditingMilestone(prev => ({ ...prev, date: date ? date.toISOString().split('T')[0] : '' }))}
                                initialFocus
                              />
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
                        <div className="flex items-center gap-2">
                          <Button onClick={() => startEditMilestone(milestone)} size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 flex items-center justify-center ml-2" aria-label="Edit Milestone">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => removeMilestone(milestone.id)}
                            size="icon"
                            variant="destructive"
                            className="rounded-full bg-red-600 hover:bg-red-700 text-white w-8 h-8 flex items-center justify-center ml-2"
                            aria-label="Remove Milestone"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col items-center gap-2 mt-4 px-0 border-t pt-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full justify-center items-center">
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 min-w-[160px]">
              {editingProject ? 'Update Project' : 'Add Project'}
            </Button>
            {editingProject && (
              <Button 
                variant="destructive" 
                className="min-w-[160px]"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Project
              </Button>
            )}
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

