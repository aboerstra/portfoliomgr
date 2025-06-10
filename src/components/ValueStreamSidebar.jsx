import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { BarChart3, User, BarChart2 } from 'lucide-react';

const ValueStreamSidebar = ({ projects, valueStreams, selectedValueStream, onValueStreamSelect }) => {
  const getProjectsByValueStream = (valueStreamId) => {
    return projects.filter(project => project.valueStreamId === valueStreamId);
  };

  const getValueStreamStats = (valueStreamId) => {
    const streamProjects = getProjectsByValueStream(valueStreamId);
    const totalProjects = streamProjects.length;
    const inProgress = streamProjects.filter(p => p.status === 'in-progress').length;
    const completed = streamProjects.filter(p => p.status === 'completed').length;
    const planned = streamProjects.filter(p => p.status === 'planned').length;
    
    return { totalProjects, inProgress, completed, planned };
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Value Streams</h2>
        <p className="text-sm text-gray-600">Select a value stream to filter projects</p>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-80px)]">
        <div className="p-2 space-y-1">
          {/* All Projects Option */}
          <button
            onClick={() => onValueStreamSelect(null)}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              !selectedValueStream 
                ? 'bg-purple-50 border border-purple-200' 
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full shrink-0 bg-gray-400" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">All Projects</div>
                <div className="text-xs text-gray-500">
                  {projects.length} projects
                </div>
              </div>
            </div>
          </button>

          {/* Value Streams */}
          {valueStreams.map((stream) => {
            const streamProjects = projects.filter(p => p.valueStreamId === stream.id);
            const isSelected = selectedValueStream === stream.id;
            
            return (
              <button
                key={stream.id}
                onClick={() => onValueStreamSelect(stream.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  isSelected 
                    ? 'bg-purple-50 border border-purple-200' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: stream.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{stream.name}</div>
                    <div className="text-xs text-gray-500">
                      {streamProjects.length} projects
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ValueStreamSidebar;

