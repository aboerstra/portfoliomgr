import React, { useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Calendar, Diamond, Users, Plus, ChevronDown, ChevronRight, ChevronLeft, Pencil, Trash2, GripVertical, CheckCircle, PlayCircle, Clock, AlertTriangle, XCircle, PauseCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { addMonths, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format, setMonth } from 'date-fns';
import { createPortal } from 'react-dom';
import { resourceTypes as staticResourceTypes } from '../data/sampleData';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Move StatusIconWithTooltip to the top level of the file
const StatusIconWithTooltip = ({ tooltip, children }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    setCoords({ x: e.clientX, y: e.clientY });
  };
  return (
    <span
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={handleMouseMove}
      style={{ display: 'inline-block' }}
    >
      {children}
      {show && createPortal(
        <span
          className="fixed px-2 py-1 rounded bg-black text-white text-xs whitespace-nowrap shadow-lg z-[9999]"
          style={{ left: coords.x + 12, top: coords.y + 12, pointerEvents: 'none' }}
        >
          {tooltip}
        </span>,
        document.body
      )}
    </span>
  );
};

// Add this new component after StatusIconWithTooltip
const ProjectBarWithTooltip = ({ project, left, width, onDragStart, onDoubleClick, isDragging, valueStream }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });

  // Calculate project resource information
  const totalHours = Object.values(project.resources || {})
    .reduce((sum, resource) => sum + (resource.hours || 0), 0);
  
  const projectDuration = Math.ceil(
    (new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24 * 30)
  );
  
  const avgMonthlyHours = Math.round(totalHours / projectDuration);
  const progressPercentage = project.totalHours > 0 ? Math.round((project.hoursUsed / project.totalHours) * 100) : 0;

  const handleMouseMove = (e) => {
    setTooltipCoords({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onMouseMove={handleMouseMove}
    >
      <div 
        className={`absolute rounded-md shadow-sm border border-gray-200 flex items-center justify-between px-2 cursor-move hover:shadow-md transition-shadow ${
          isDragging ? 'shadow-lg z-20' : ''
        }`}
        style={{
          top: 12,
          height: 24,
          left: `${left}%`,
          width: `${width}%`,
          backgroundColor: valueStream.color,
          opacity: isDragging ? 0.9 : 0.8,
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          transition: isDragging ? 'none' : 'all 0.2s ease-in-out'
        }}
        onMouseDown={(e) => onDragStart(e, project, 'move')}
        onDoubleClick={(e) => onDoubleClick(e, project)}
      >
        {/* Start Date Handle */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-20"
          onMouseDown={(e) => onDragStart(e, project, 'start')}
        />
        <div className="text-white text-xs font-medium truncate">
          {project.name}
        </div>
        <div className="ml-auto text-white text-xs font-semibold pr-1">
          {progressPercentage}%
        </div>
        {/* End Date Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-20"
          onMouseDown={(e) => onDragStart(e, project, 'end')}
        />
      </div>
      {showTooltip && createPortal(
        <div
          className="fixed px-3 py-2 rounded bg-black/90 text-white text-sm shadow-lg z-[9999]"
          style={{ 
            left: tooltipCoords.x + 12, 
            top: tooltipCoords.y + 12,
            pointerEvents: 'none',
            minWidth: '200px'
          }}
        >
          <div className="font-semibold mb-1">{project.name}</div>
          <div className="text-xs space-y-1">
            <div>Total Hours: {totalHours.toLocaleString()}</div>
            <div>Hours Used: {project.hoursUsed?.toLocaleString() || 0}</div>
            <div>Hours Remaining: {(totalHours - (project.hoursUsed || 0)).toLocaleString()}</div>
            <div>Avg Monthly Hours: {avgMonthlyHours.toLocaleString()}</div>
            <div>Duration: {projectDuration} months</div>
            <div>Progress: {progressPercentage}%</div>
            <div>Status: {project.status}</div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const GanttChart = ({ projects, valueStreams, selectedValueStream, onAddProject, onUpdateProject, onDeleteProject, onReorderProjects, resourceTypes = staticResourceTypes }) => {
  // Add state for expanded value streams
  const [expandedStreams, setExpandedStreams] = useState(new Set());
  const [draggingProject, setDraggingProject] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragMode, setDragMode] = useState(null); // 'start', 'end', or 'move'
  const [dragStartDates, setDragStartDates] = useState(null);
  const timelineRef = useRef(null);
  const [timeRange, setTimeRange] = useState('quarter');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dragOverProjectId, setDragOverProjectId] = useState(null);
  const [dragOverValueStreamId, setDragOverValueStreamId] = useState(null);
  const [openPriorityPopover, setOpenPriorityPopover] = useState(null);

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Toggle value stream expansion
  const toggleValueStream = (streamId) => {
    setExpandedStreams(prev => {
      const next = new Set(prev);
      if (next.has(streamId)) {
        next.delete(streamId);
      } else {
        next.add(streamId);
      }
      return next;
    });
  };

  // Calculate timeline dimensions and dates
  const timelineData = useMemo(() => {
    let startDate, endDate;
    
    if (timeRange === 'quarter') {
      // Start at the selected month, show 3 months
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
    } else {
      // For year view, start from the selected month
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, 0);
    }
    
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Generate month markers
    const months = [];
    const currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
      months.push({
        date: new Date(currentMonth),
        label: currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    return { startDate, endDate, totalDays, months };
  }, [currentDate, timeRange]);

  const handlePrevious = () => {
    if (timeRange === 'quarter') {
      setCurrentDate(prev => subMonths(prev, 3));
    } else {
      setCurrentDate(prev => subMonths(prev, 12));
    }
  };

  const handleNext = () => {
    if (timeRange === 'quarter') {
      setCurrentDate(prev => addMonths(prev, 3));
    } else {
      setCurrentDate(prev => addMonths(prev, 12));
    }
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    // Keep the current month when changing time range
    setCurrentDate(prev => new Date(prev));
  };

  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(monthIndex));
    setCurrentDate(newDate);
  };

  // Handle drag start
  const handleDragStart = (e, project, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingProject(project);
    setDragStartX(e.clientX);
    setDragMode(mode);
    setDragStartDates({
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate)
    });
  };

  // Handle drag
  const handleDrag = (e) => {
    if (!draggingProject || !timelineRef.current || !dragStartDates) return;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const pixelsPerDay = timelineRect.width / timelineData.totalDays;
    const daysOffset = Math.round((e.clientX - dragStartX) / pixelsPerDay);

    let newStartDate = new Date(dragStartDates.startDate);
    let newEndDate = new Date(dragStartDates.endDate);
    const projectDuration = newEndDate - newStartDate;

    if (dragMode === 'start') {
      newStartDate.setDate(newStartDate.getDate() + daysOffset);
      // Only constrain if the entire project would be outside the timeline
      if (newStartDate > newEndDate) {
        newStartDate = new Date(newEndDate);
      }
    } else if (dragMode === 'end') {
      newEndDate.setDate(newEndDate.getDate() + daysOffset);
      // Only constrain if the entire project would be outside the timeline
      if (newEndDate < newStartDate) {
        newEndDate = new Date(newStartDate);
      }
    } else {
      // For moving the entire project
      newStartDate.setDate(newStartDate.getDate() + daysOffset);
      newEndDate.setDate(newEndDate.getDate() + daysOffset);
    }

    // Update the project immediately during drag
    onUpdateProject({
      ...draggingProject,
      startDate: newStartDate.toISOString().split('T')[0],
      endDate: newEndDate.toISOString().split('T')[0]
    });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggingProject(null);
    setDragMode(null);
    setDragStartDates(null);
  };

  // Add event listeners for drag
  React.useEffect(() => {
    if (draggingProject) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [draggingProject, dragStartX]);

  const handleDoubleClick = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    onAddProject(project.valueStreamId, project);
  };

  // Group projects by value stream
  const projectsByValueStream = useMemo(() => {
    const grouped = {};
    // Always include all value streams, even if they have no projects
    valueStreams.forEach(stream => {
      const streamProjects = projects.filter(project => project.valueStreamId === stream.id);
      grouped[stream.id] = {
        ...stream,
        projects: streamProjects
      };
    });
    // If a value stream is selected, only show that value stream's projects
    if (selectedValueStream) {
      const selectedStream = valueStreams.find(s => s.id === selectedValueStream);
      if (selectedStream) {
        return {
          [selectedStream.id]: grouped[selectedStream.id]
        };
      }
    }
    return grouped;
  }, [projects, valueStreams, selectedValueStream]);

  // Calculate project position and width on timeline
  const getProjectTimelineData = (project) => {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    
    // Calculate the visible portion of the project
    const visibleStart = projectStart < timelineData.startDate ? timelineData.startDate : projectStart;
    const visibleEnd = projectEnd > timelineData.endDate ? timelineData.endDate : projectEnd;
    
    // If project is completely outside the timeline, don't render
    if (visibleEnd < timelineData.startDate || visibleStart > timelineData.endDate) {
      return null;
    }

    // Calculate position and width based on the visible portion
    const daysFromStart = Math.ceil((visibleStart - timelineData.startDate) / (1000 * 60 * 60 * 24));
    const projectDuration = Math.ceil((visibleEnd - visibleStart) / (1000 * 60 * 60 * 24));
    const leftPercent = (daysFromStart / timelineData.totalDays) * 100;
    const widthPercent = (projectDuration / timelineData.totalDays) * 100;

    return { 
      leftPercent, 
      widthPercent, 
      projectStart, 
      projectEnd, 
      visibleStart, 
      visibleEnd,
      isStartVisible: projectStart >= timelineData.startDate,
      isEndVisible: projectEnd <= timelineData.endDate
    };
  };

  // Get milestone position on timeline
  const getMilestonePosition = (milestoneDate) => {
    const date = new Date(milestoneDate);
    const daysFromStart = Math.ceil((date - timelineData.startDate) / (1000 * 60 * 60 * 24));
    return (daysFromStart / timelineData.totalDays) * 100;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in-progress': return '#3B82F6';
      case 'planned': return '#6B7280';
      case 'at-risk': return '#F59E0B';
      case 'delayed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Add a helper to map status to icon and color
  const statusIcon = (status) => {
    const iconProps = { className: "h-4 w-4 ml-2", 'aria-label': status };
    switch (status) {
      case 'completed':
        return <StatusIconWithTooltip tooltip="Completed"><CheckCircle {...iconProps} style={{ color: '#10B981' }} /></StatusIconWithTooltip>;
      case 'in-progress':
        return <StatusIconWithTooltip tooltip="In Progress"><PlayCircle {...iconProps} style={{ color: '#3B82F6' }} /></StatusIconWithTooltip>;
      case 'planned':
        return <StatusIconWithTooltip tooltip="Planned"><Clock {...iconProps} style={{ color: '#6B7280' }} /></StatusIconWithTooltip>;
      case 'at-risk':
        return <StatusIconWithTooltip tooltip="At Risk"><AlertTriangle {...iconProps} style={{ color: '#F59E0B' }} /></StatusIconWithTooltip>;
      case 'delayed':
        return <StatusIconWithTooltip tooltip="Delayed"><XCircle {...iconProps} style={{ color: '#EF4444' }} /></StatusIconWithTooltip>;
      case 'on-hold':
        return <StatusIconWithTooltip tooltip="On Hold"><PauseCircle {...iconProps} style={{ color: '#FB923C' }} /></StatusIconWithTooltip>;
      default:
        return <StatusIconWithTooltip tooltip={status}><Clock {...iconProps} style={{ color: '#6B7280' }} /></StatusIconWithTooltip>;
    }
  };

  const barHeight = 48;

  // Handle drag events for reordering
  const handleReorderDragStart = (e, projectId) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleReorderDragOver = (e, projectId) => {
    e.preventDefault();
    setDragOverProjectId(projectId);
  };
  const handleReorderDrop = (e, valueStreamId, projectId) => {
    e.preventDefault();
    if (draggedProjectId && draggedProjectId !== projectId) {
      const streamProjects = projects.filter(p => p.valueStreamId === valueStreamId);
      const draggedIdx = streamProjects.findIndex(p => p.id === draggedProjectId);
      const dropIdx = streamProjects.findIndex(p => p.id === projectId);
      if (draggedIdx !== -1 && dropIdx !== -1) {
        const newOrder = [...streamProjects];
        const [removed] = newOrder.splice(draggedIdx, 1);
        newOrder.splice(dropIdx, 0, removed);
        onReorderProjects && onReorderProjects(valueStreamId, newOrder);
      }
    }
    setDraggedProjectId(null);
    setDragOverProjectId(null);
    setDragOverValueStreamId(null);
  };
  const handleReorderDragEnd = () => {
    setDraggedProjectId(null);
    setDragOverProjectId(null);
    setDragOverValueStreamId(null);
  };

  // Drag to different value stream
  const handleValueStreamDragOver = (e, valueStreamId) => {
    e.preventDefault();
    setDragOverValueStreamId(valueStreamId);
  };
  const handleValueStreamDrop = (e, valueStreamId) => {
    e.preventDefault();
    if (draggedProjectId) {
      const project = projects.find(p => p.id === draggedProjectId);
      if (project && project.valueStreamId !== valueStreamId) {
        onUpdateProject({ ...project, valueStreamId });
      }
    }
    setDraggedProjectId(null);
    setDragOverValueStreamId(null);
    setDragOverProjectId(null);
  };

  const toggleAllValueStreams = () => {
    if (expandedStreams.size === valueStreams.length) {
      setExpandedStreams(new Set());
    } else {
      valueStreams.forEach(stream => setExpandedStreams(prev => {
        const next = new Set(prev);
        next.add(stream.id);
        return next;
      }));
    }
  };

  return (
    <div className="flex-1 bg-white">
      <Card className="h-[calc(100vh-200px)] flex flex-col">
        {/* Fixed Headers */}
        <div className="flex-none">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex items-center">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Portfolio Timeline</span>
                  <Select value={String(currentDate.getMonth())} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-[120px] ml-2">
                      <SelectValue>{monthOptions[currentDate.getMonth()]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month, idx) => (
                        <SelectItem key={month} value={String(idx)}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedValueStream && (
                    <Badge variant="secondary">
                      {valueStreams.find(s => s.id === selectedValueStream)?.name}
                    </Badge>
                  )}
                </CardTitle>
              </div>

              <div className="flex items-center space-x-4">
                {/* Time Range Controls */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-sm font-medium">
                      {timeRange === 'quarter' 
                        ? `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`
                        : currentDate.getFullYear()
                      }
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNext}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">View:</label>
                    <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarter">Quarter</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Timeline Header */}
          <div className="flex border-b border-gray-200">
            <div className="w-96 p-4 border-r border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleAllValueStreams}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {expandedStreams.size === valueStreams.length ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  <span className="font-medium">Value Streams & Projects</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddProject(selectedValueStream)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 relative bg-gray-50">
              {/* Month Markers */}
              <div className="flex h-full">
                {timelineData.months.map((month, index) => (
                  <div
                    key={month.label}
                    className="flex-1 border-r border-gray-200 last:border-r-0"
                    style={{ minWidth: '100px' }}
                  >
                    <div className="p-2 text-center text-sm font-medium">
                      {month.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          <div className="relative">
            {/* Value Stream Groups */}
            <div className="w-full">
              {Object.values(projectsByValueStream).map((valueStream) => {
                const isExpanded = expandedStreams.has(valueStream.id);
                const projectCount = valueStream.projects.length;
                const rowHeight = isExpanded ? Math.max(1, projectCount) * barHeight + 40 : 0;
                
                return (
                  <div
                    key={valueStream.id}
                    className={`border-b border-gray-200 ${dragOverValueStreamId === valueStream.id ? 'bg-purple-50' : ''}`}
                    onDragOver={e => handleValueStreamDragOver(e, valueStream.id)}
                    onDrop={e => handleValueStreamDrop(e, valueStream.id)}
                  >
                    {/* Value Stream Header */}
                    <div className="flex bg-gray-50 border-b border-gray-100">
                      <div className="w-96 p-4 border-r border-gray-200">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleValueStream(valueStream.id)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: valueStream.color }}
                          />
                          <div>
                            <div className="font-semibold text-sm text-gray-800">
                              {valueStream.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {valueStream.projects.length} projects
                            </div>
                          </div>
                          <Button 
                            onClick={() => onAddProject(valueStream.id)} 
                            size="sm" 
                            variant="ghost"
                            className="ml-auto h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 relative bg-gray-25">
                        {/* Value Stream Timeline Background */}
                      </div>
                    </div>
                    
                    {/* Projects within Value Stream */}
                    <div
                      className="flex-1 relative p-2 pb-6"
                      ref={timelineRef}
                      style={{ 
                        height: isExpanded ? rowHeight : 0, 
                        transition: 'height 0.2s ease-in-out',
                        overflow: 'hidden'
                      }}
                    >
                      {isExpanded && (
                        <div className="flex">
                          <div className="w-96 border-r border-gray-200 bg-white flex flex-col justify-start" style={{ minHeight: rowHeight }}>
                            {valueStream.projects.map((project, index) => (
                              <div key={project.id + '-wrapper'} className="w-full border-b border-gray-100">
                                <div
                                  key={project.id}
                                  style={{ height: barHeight, marginBottom: 8 }}
                                  className={`flex flex-col justify-center ${dragOverProjectId === project.id ? 'bg-purple-50' : ''}`}
                                  draggable={true}
                                  onDragStart={e => handleReorderDragStart(e, project.id)}
                                  onDragOver={e => handleReorderDragOver(e, project.id)}
                                  onDrop={e => handleReorderDrop(e, valueStream.id, project.id)}
                                  onDragEnd={handleReorderDragEnd}
                                >
                                  <div className="flex items-center justify-between h-full px-2">
                                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          className="p-1 hover:bg-gray-100 rounded-full cursor-grab"
                                          title="Reorder Project"
                                          tabIndex={-1}
                                        >
                                          <GripVertical className="w-4 h-4 text-gray-400" />
                                        </button>
                                        <span className="font-medium text-sm truncate min-w-0 flex items-center">
                                          {project.name}
                                          {statusIcon(project.status)}
                                        </span>
                                      </div>
                                      <div className="flex mt-1 text-xs text-gray-500 truncate">
                                        <div className="flex-shrink-0 flex flex-col items-start ml-7" style={{ minWidth: '4.5rem' }}>
                                          <Badge 
                                            className={`text-xs w-fit
                                            ${project.priority === 'high' ? 'bg-red-500 text-white' : ''}
                                            ${project.priority === 'medium' ? 'bg-yellow-400 text-gray-900' : ''}
                                            ${project.priority === 'low' ? 'bg-green-500 text-white' : ''}
                                          `}
                                          >
                                            {project.priority}
                                          </Badge>
                                        </div>
                                        <div className="flex-1 flex items-center gap-4 ml-2 min-w-0">
                                          <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <StatusIconWithTooltip
                                              tooltip={Object.entries(project.resources || {}).map(([type, res]) => {
                                                console.log('Resource Type ID:', type);
                                                console.log('Resource Data:', res);
                                                console.log('Available Resource Types:', resourceTypes);
                                                console.log('Matching Resource Type:', resourceTypes.find(r => r.id === type));
                                                const rt = resourceTypes.find(r => r.id === type);
                                                const rtByName = resourceTypes.find(r => r.name.toLowerCase() === type.toLowerCase());
                                                const displayName = rt?.name || rtByName?.name || type;
                                                console.log('Final Display Name:', displayName);
                                                return `${displayName}: ${res.allocated || 0}/${res.required || 0}`;
                                              }).join('\n')}
                                            >
                                              <span>{
                                                Number.isFinite(Object.values(project.resources).reduce((sum, resource) => sum + (resource.allocated || 0), 0))
                                                  ? Object.values(project.resources).reduce((sum, resource) => sum + (resource.allocated || 0), 0)
                                                  : 0
                                              } people</span>
                                            </StatusIconWithTooltip>
                                          </div>
                                          <span className="text-gray-400 truncate">
                                            {new Date(project.startDate).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })} - {new Date(project.endDate).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      <button
                                        className="p-1 hover:bg-gray-100 rounded-full"
                                        title="Edit Project"
                                        onClick={() => onAddProject(project.valueStreamId, project)}
                                      >
                                        <Pencil className="w-4 h-4 text-gray-500" />
                                      </button>
                                      {typeof onDeleteProject === 'function' && (
                                        <button
                                          className="p-1 hover:bg-red-100 rounded-full"
                                          title="Delete Project"
                                          onClick={() => onDeleteProject(project)}
                                        >
                                          <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex-1 relative" style={{ minHeight: rowHeight }}>
                            {valueStream.projects.map((project, index) => {
                              const projectTimelineData = getProjectTimelineData(project);
                              if (!projectTimelineData) return null;
                              const isDragging = draggingProject?.id === project.id;
                              const topOffset = index * barHeight;
                              return (
                                <div key={project.id} style={{ position: 'absolute', left: 0, right: 0, top: topOffset, height: barHeight, zIndex: 1 }}>
                                  <ProjectBarWithTooltip project={project} left={projectTimelineData.leftPercent} width={projectTimelineData.widthPercent} onDragStart={handleDragStart} onDoubleClick={handleDoubleClick} isDragging={isDragging} valueStream={valueStream} />
                                  {/* Milestones */}
                                  {project.milestones.map((milestone) => {
                                    const position = getMilestonePosition(milestone.date);
                                    return (
                                      <div
                                        key={milestone.id}
                                        className="absolute top-6 transform -translate-x-1/2"
                                        style={{ left: `${position}%` }}
                                      >
                                        <div className="relative group">
                                          <Diamond 
                                            className={`h-4 w-4 cursor-pointer ${
                                              milestone.status === 'completed' ? 'text-green-600 fill-green-600' :
                                              milestone.status === 'in-progress' ? 'text-blue-600 fill-blue-600' :
                                              'text-gray-400 fill-gray-400'
                                            }`}
                                          />
                                          {/* Milestone Tooltip */}
                                          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                            {milestone.name}
                                            <br />
                                            {new Date(milestone.date).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                            {/* Today Line - only render if today is within the timeline */}
                            {(() => {
                              const today = new Date();
                              if (today >= timelineData.startDate && today <= timelineData.endDate) {
                                const todayPosition = getMilestonePosition(today.toISOString().split('T')[0]);
                                return (
                                  <div 
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                    style={{ left: `${todayPosition}%` }}
                                  >
                                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1 rounded">
                                      Today
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GanttChart;

