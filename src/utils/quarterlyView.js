// Utility functions for Quarterly View

// Get rocks for a value stream and quarter
export function getRocksForValueStreamQuarter(rocks, valueStreamId, quarter, year) {
  return rocks.filter(
    (rock) =>
      rock.valueStreamId === valueStreamId &&
      rock.quarter === quarter &&
      rock.year === year
  );
}

// Get milestones for a value stream and quarter
export function getMilestonesForValueStreamQuarter(projects, valueStreamId, quarterStart, quarterEnd) {
  // Find all projects in the value stream that overlap the quarter
  const relevantProjects = projects.filter(
    (p) =>
      p.valueStreamId === valueStreamId &&
      new Date(p.endDate) >= new Date(quarterStart) &&
      new Date(p.startDate) <= new Date(quarterEnd)
  );
  // Gather all milestones in those projects that fall within the quarter
  let milestones = [];
  relevantProjects.forEach((project) => {
    if (Array.isArray(project.milestones)) {
      milestones = milestones.concat(
        project.milestones.filter((m) => {
          const d = new Date(m.date);
          return d >= new Date(quarterStart) && d <= new Date(quarterEnd);
        }).map((m) => ({ ...m, projectId: project.id, projectName: project.name }))
      );
    }
  });
  return milestones;
}

// Calculate resource hours by type for a value stream and quarter
export function getResourceHoursByTypeForValueStreamQuarter(projects, valueStreamId, quarterStart, quarterEnd) {
  // For each project in the value stream that overlaps the quarter, sum resource allocations
  const relevantProjects = projects.filter(
    (p) =>
      p.valueStreamId === valueStreamId &&
      new Date(p.endDate) >= new Date(quarterStart) &&
      new Date(p.startDate) <= new Date(quarterEnd)
  );
  const resourceTotals = {};
  relevantProjects.forEach((project) => {
    Object.entries(project.resources || {}).forEach(([type, { allocated }]) => {
      resourceTotals[type] = (resourceTotals[type] || 0) + (allocated || 0);
    });
  });
  return resourceTotals;
} 