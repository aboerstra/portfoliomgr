import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { addMonths, format } from 'date-fns';

// Helper to aggregate total resource hours per month
function aggregateResourceHours(projects, startMonth, endMonth) {
  const months = [];
  let current = new Date(startMonth);
  while (current <= endMonth) {
    months.push(format(current, 'yyyy-MM'));
    current = addMonths(current, 1);
  }
  const data = months.map(month => ({ month, hours: 0 }));
  projects.forEach(project => {
    if (!project.startDate || !project.endDate || !project.resources) return;
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    months.forEach((month, i) => {
      const monthDate = new Date(month + '-01');
      if (monthDate >= start && monthDate <= end) {
        // Sum all resource allocations for this project for this month
        const total = Object.values(project.resources).reduce((sum, v) => sum + (typeof v === 'object' && v.hours ? v.hours : 0), 0);
        data[i].hours += total;
      }
    });
  });
  return data;
}

export default function ResourceChart({ projects, startDate, endDate }) {
  if (!projects || !startDate || !endDate) return null;
  const chartData = aggregateResourceHours(projects, startDate, endDate);

  return (
    <div style={{ width: '100%', height: 20 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Area
            type="monotone"
            dataKey="hours"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 