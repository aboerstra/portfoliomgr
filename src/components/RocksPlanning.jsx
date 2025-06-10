import React, { useState, useEffect } from 'react';
import { quarters } from '../data/sampleData';
import { getRocksForValueStreamQuarter, getMilestonesForValueStreamQuarter, getResourceHoursByTypeForValueStreamQuarter } from '../utils/quarterlyView';
import { CheckCircle, PlayCircle, Clock, AlertTriangle, XCircle, PauseCircle } from 'lucide-react';

// Initial rocks data
const initialRocks = [
  // Example:
  // { id: 'rock-1', valueStreamId: 'tech-platform', quarter: 1, year: 2025, name: 'Launch New API', status: 'in-progress' }
];

const statusOptions = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'at-risk', label: 'At Risk' }
];

function getCurrentQuarterAndNext(year) {
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();
  let currentQ = 1;
  if (thisMonth >= 0 && thisMonth <= 2) currentQ = 1;
  else if (thisMonth >= 3 && thisMonth <= 5) currentQ = 2;
  else if (thisMonth >= 6 && thisMonth <= 8) currentQ = 3;
  else if (thisMonth >= 9 && thisMonth <= 11) currentQ = 4;
  if (year !== thisYear) return [1, 2]; // fallback for other years
  return [currentQ, Math.min(currentQ + 1, 4)];
}

// Add statusIcon helper (copied from GanttChart)
const statusIcon = (status) => {
  const iconProps = { className: "h-4 w-4 mr-1", 'aria-label': status };
  switch (status) {
    case 'completed':
      return <CheckCircle {...iconProps} style={{ color: '#10B981' }} />;
    case 'in-progress':
      return <PlayCircle {...iconProps} style={{ color: '#3B82F6' }} />;
    case 'planned':
      return <Clock {...iconProps} style={{ color: '#6B7280' }} />;
    case 'at-risk':
      return <AlertTriangle {...iconProps} style={{ color: '#F59E0B' }} />;
    case 'delayed':
      return <XCircle {...iconProps} style={{ color: '#EF4444' }} />;
    case 'on-hold':
      return <PauseCircle {...iconProps} style={{ color: '#FB923C' }} />;
    default:
      return <Clock {...iconProps} style={{ color: '#6B7280' }} />;
  }
};

// Priority badge helper
const priorityBadge = (priority) => {
  if (!priority) return null;
  let badgeClass = 'text-xs px-2 py-0.5 rounded ml-2';
  if (priority === 'high') badgeClass += ' bg-red-500 text-white';
  else if (priority === 'medium') badgeClass += ' bg-yellow-400 text-gray-900';
  else if (priority === 'low') badgeClass += ' bg-green-500 text-white';
  else badgeClass += ' bg-gray-200 text-gray-700';
  return <span className={badgeClass}>{priority}</span>;
};

function RocksPlanning({ valueStreams, projects: initialProjects, resourceTypes, onUpdateProjects }) {
  const [year, setYear] = useState(2025);
  const [rocks, setRocks] = useState(() => {
    const savedRocks = localStorage.getItem('rocks');
    return savedRocks ? JSON.parse(savedRocks) : initialRocks;
  });
  const [showPast, setShowPast] = useState(false);
  const [rockInputs, setRockInputs] = useState({});
  const [projects, setProjects] = useState(initialProjects);

  // Save rocks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('rocks', JSON.stringify(rocks));
  }, [rocks]);

  const currentAndNext = getCurrentQuarterAndNext(year);
  const visibleQuarters = showPast
    ? quarters.filter(q => q.name.endsWith(year))
    : quarters.filter((q, i) => q.name.endsWith(year) && (i + 1 === currentAndNext[0] || i + 1 === currentAndNext[1]));

  // Add/edit/delete rock handlers
  const addRock = (valueStreamId, quarter) => {
    const key = `${valueStreamId}-${quarter}`;
    const name = (rockInputs[key] || '').trim();
    if (name) {
      const newRock = { 
        id: `rock-${Date.now()}`, 
        valueStreamId, 
        quarter, 
        year, 
        name, 
        status: 'not-started' 
      };
      setRocks(prev => [...prev, newRock]);
      setRockInputs(inputs => ({ ...inputs, [key]: '' }));
    }
  };

  const updateRockStatus = (rockId, status) => {
    setRocks(prev => prev.map(r => r.id === rockId ? { ...r, status } : r));
  };

  const deleteRock = (rockId) => {
    setRocks(prev => prev.filter(r => r.id !== rockId));
  };

  // Handler to link/unlink a milestone to rocks
  const updateMilestoneLinks = (projectId, milestoneId, newLinkedRockIds) => {
    const updatedProjects = projects.map(p =>
      p.id !== projectId ? p : {
        ...p,
        milestones: p.milestones.map(m =>
          m.id !== milestoneId ? m : { ...m, linkedRockIds: newLinkedRockIds }
        )
      }
    );
    setProjects(updatedProjects);
    onUpdateProjects(updatedProjects);
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold mr-6">Rocks Planning</h2>
        <label className="mr-2 font-medium">Year:</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded px-2 py-1">
          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="ml-4 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded" onClick={() => setShowPast(v => !v)}>
          {showPast ? 'Hide Past Quarters' : 'Show Past Quarters'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2 text-left bg-gray-50">Value Stream</th>
              {visibleQuarters.map(q => (
                <th key={q.id} className="border-b p-2 text-center bg-gray-50">{q.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {valueStreams.map(vs => (
              <tr key={vs.id}>
                <td className="border-r p-2 align-top font-semibold" style={{ background: vs.color + '10' }}>{vs.name}</td>
                {visibleQuarters.map((q, i) => {
                  const quarterNum = quarters.findIndex(qq => qq.id === q.id) + 1;
                  // Rocks
                  const rocksForCell = getRocksForValueStreamQuarter(rocks, vs.id, quarterNum, year);
                  // Milestones
                  const milestonesForCell = getMilestonesForValueStreamQuarter(projects, vs.id, q.startDate, q.endDate);
                  // Resource hours
                  const resourceHours = getResourceHoursByTypeForValueStreamQuarter(projects, vs.id, q.startDate, q.endDate);
                  const inputKey = `${vs.id}-${quarterNum}`;
                  return (
                    <td key={q.id} className="align-top p-2 min-w-[320px] border-l">
                      {/* Rocks */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Rocks</span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <input
                            className="text-xs border rounded px-2 py-1 flex-1"
                            placeholder="Add a rock..."
                            value={rockInputs[inputKey] || ''}
                            onChange={e => setRockInputs(inputs => ({ ...inputs, [inputKey]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') addRock(vs.id, quarterNum); }}
                          />
                          <button
                            className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded"
                            onClick={() => addRock(vs.id, quarterNum)}
                          >Add</button>
                        </div>
                        {rocksForCell.length === 0 && <div className="text-xs text-gray-400 italic">No rocks set</div>}
                        {rocksForCell.map(rock => (
                          <div key={rock.id} className="flex items-center gap-2 mb-1">
                            <span className="truncate flex-1">{rock.name}</span>
                            <select value={rock.status} onChange={e => updateRockStatus(rock.id, e.target.value)} className="text-xs border rounded px-1 py-0.5">
                              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <button className="text-xs text-red-500 hover:underline" onClick={() => deleteRock(rock.id)}>Delete</button>
                          </div>
                        ))}
                      </div>
                      {/* Milestones */}
                      <div className="mb-2">
                        <div className="font-medium mb-1">Milestones</div>
                        {milestonesForCell.length === 0 && <div className="text-xs text-gray-400 italic">No milestones</div>}
                        {milestonesForCell.map(milestone => (
                          <div key={milestone.id} className="flex items-center gap-2 mb-1">
                            {statusIcon(milestone.status)}
                            <span className="truncate flex-1 text-sm font-normal text-gray-700 ml-1">{milestone.name}</span>
                            {priorityBadge(milestone.priority)}
                            <span className="text-xs text-gray-500">{milestone.date}</span>
                            <span className="text-xs text-gray-400 italic">{milestone.projectName}</span>
                          </div>
                        ))}
                      </div>
                      {/* Resource Commitments */}
                      <div>
                        <div className="font-medium mb-1">Resource Hours</div>
                        {Object.keys(resourceHours).length === 0 && <div className="text-xs text-gray-400 italic">No resource hours</div>}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(resourceHours).map(([type, hours]) => {
                            const rt = resourceTypes.find(r => r.id === type);
                            return (
                              <span key={type} className="text-xs px-2 py-1 rounded bg-gray-100" style={{ color: rt?.color }}>{rt?.name || type}: {hours}h</span>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RocksPlanning; 