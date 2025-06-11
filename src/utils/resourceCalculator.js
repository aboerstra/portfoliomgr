// Resource impact calculation engine
// This module calculates how resource changes affect project timelines

export class ResourceImpactCalculator {
  constructor() {
    // Base productivity factors
    this.baseProductivity = 1.0;
    this.communicationOverhead = 0.1; // 10% overhead per additional person
    this.rampUpTime = 0.2; // 20% efficiency loss for new team members
    this.optimalTeamSize = 7; // Brooks' Law - optimal team size
  }

  /**
   * Calculate the impact of resource changes on project duration
   * @param {Object} project - Project object
   * @param {Object} resourceChanges - Changes to resource allocation
   * @param {Array} resourceTypes - Available resource types
   * @returns {Object} Impact analysis
   */
  calculateTimelineImpact(project, resourceChanges, resourceTypes) {
    const originalDuration = this.calculateProjectDuration(project, resourceTypes);
    const newResources = { ...project.resources };
    
    // Apply resource changes
    Object.keys(resourceChanges).forEach(resourceType => {
      if (newResources[resourceType]) {
        newResources[resourceType] = {
          ...newResources[resourceType],
          allocated: resourceChanges[resourceType]
        };
      }
    });

    const newProject = { ...project, resources: newResources };
    const newDuration = this.calculateProjectDuration(newProject, resourceTypes);
    
    const impact = {
      originalDuration,
      newDuration,
      durationChange: newDuration - originalDuration,
      percentageChange: ((newDuration - originalDuration) / originalDuration) * 100,
      newEndDate: this.calculateNewEndDate(project.startDate, newDuration),
      costImpact: this.calculateCostImpact(project, resourceChanges, resourceTypes),
      riskFactors: this.assessRiskFactors(newProject, resourceTypes)
    };

    return impact;
  }

  /**
   * Calculate project duration based on resources and complexity
   * @param {Object} project - Project object
   * @param {Array} resourceTypes - Available resource types
   * @returns {number} Duration in weeks
   */
  calculateProjectDuration(project, resourceTypes) {
    // Base complexity estimation (simplified model)
    const baseComplexity = this.estimateProjectComplexity(project);
    
    // Calculate total effective resources
    let totalEffectiveResources = 0;
    let teamSize = 0;
    
    Object.entries(project.resources).forEach(([resourceTypeId, allocation]) => {
      const resourceType = resourceTypes.find(rt => rt.id === resourceTypeId);
      if (resourceType && allocation.allocated > 0) {
        const efficiency = this.calculateResourceEfficiency(allocation.allocated, teamSize);
        totalEffectiveResources += allocation.allocated * efficiency;
        teamSize += allocation.allocated;
      }
    });

    // Apply team size penalties (Brooks' Law)
    const teamSizeFactor = this.calculateTeamSizeFactor(teamSize);
    const effectiveCapacity = totalEffectiveResources * teamSizeFactor;
    
    // Calculate duration (complexity / effective capacity)
    const duration = Math.max(1, baseComplexity / Math.max(0.1, effectiveCapacity));
    
    return Math.round(duration * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Estimate project complexity based on various factors
   * @param {Object} project - Project object
   * @returns {number} Complexity score
   */
  estimateProjectComplexity(project) {
    // Base complexity from project duration (simplified)
    const originalStart = new Date(project.startDate);
    const originalEnd = new Date(project.endDate);
    const originalWeeks = Math.ceil((originalEnd - originalStart) / (1000 * 60 * 60 * 24 * 7));
    
    // Complexity factors
    let complexity = originalWeeks * 10; // Base complexity units
    
    // Adjust for priority (high priority projects often more complex)
    if (project.priority === 'high') complexity *= 1.2;
    if (project.priority === 'low') complexity *= 0.8;
    
    // Adjust for number of milestones (more milestones = more complexity)
    complexity *= (1 + (project.milestones?.length || 0) * 0.1);
    
    return complexity;
  }

  /**
   * Calculate resource efficiency based on team dynamics
   * @param {number} allocated - Number of allocated resources
   * @param {number} currentTeamSize - Current team size
   * @returns {number} Efficiency factor (0-1)
   */
  calculateResourceEfficiency(allocated, currentTeamSize) {
    // Individual efficiency starts at 1.0
    let efficiency = 1.0;
    
    // Communication overhead increases with team size
    const communicationPenalty = Math.max(0, (currentTeamSize - 2) * this.communicationOverhead);
    efficiency -= communicationPenalty;
    
    // Diminishing returns for large allocations
    if (allocated > 5) {
      efficiency *= (1 - (allocated - 5) * 0.05);
    }
    
    return Math.max(0.1, efficiency); // Minimum 10% efficiency
  }

  /**
   * Calculate team size factor (Brooks' Law implementation)
   * @param {number} teamSize - Total team size
   * @returns {number} Team size factor
   */
  calculateTeamSizeFactor(teamSize) {
    if (teamSize === 0) return 0;
    if (teamSize <= this.optimalTeamSize) return 1.0;
    
    // Penalty for teams larger than optimal
    const oversizePenalty = (teamSize - this.optimalTeamSize) * 0.05;
    return Math.max(0.3, 1.0 - oversizePenalty);
  }

  /**
   * Calculate new end date based on duration
   * @param {string} startDate - Project start date
   * @param {number} durationWeeks - Duration in weeks
   * @returns {string} New end date
   */
  calculateNewEndDate(startDate, durationWeeks) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (durationWeeks * 7));
    return end.toISOString().split('T')[0];
  }

  /**
   * Calculate cost impact of resource changes
   * @param {Object} project - Project object
   * @param {Object} resourceChanges - Resource changes
   * @param {Array} resourceTypes - Available resource types
   * @returns {Object} Cost impact analysis
   */
  calculateCostImpact(project, resourceChanges, resourceTypes) {
    let originalCost = 0;
    let newCost = 0;
    
    const originalDuration = this.calculateProjectDuration(project, resourceTypes);
    
    Object.entries(project.resources).forEach(([resourceTypeId, allocation]) => {
      const resourceType = resourceTypes.find(rt => rt.id === resourceTypeId);
      if (resourceType) {
        const weeklyCost = allocation.allocated * resourceType.hourlyRate * 40; // 40 hours/week
        originalCost += weeklyCost * originalDuration;
        
        const newAllocation = resourceChanges[resourceTypeId] || allocation.allocated;
        const newWeeklyCost = newAllocation * resourceType.hourlyRate * 40;
        newCost += newWeeklyCost * originalDuration; // Use original duration for comparison
      }
    });

    return {
      originalCost: Math.round(originalCost),
      newCost: Math.round(newCost),
      costChange: Math.round(newCost - originalCost),
      percentageChange: originalCost > 0 ? ((newCost - originalCost) / originalCost) * 100 : 0
    };
  }

  /**
   * Assess risk factors for the new resource allocation
   * @param {Object} project - Project object
   * @param {Array} resourceTypes - Available resource types
   * @returns {Array} Risk factors
   */
  assessRiskFactors(project, resourceTypes) {
    const risks = [];
    let totalTeamSize = 0;
    
    Object.entries(project.resources).forEach(([resourceTypeId, allocation]) => {
      totalTeamSize += allocation.allocated;
      
      // Check for over-allocation
      const resourceType = resourceTypes.find(rt => rt.id === resourceTypeId);
      if (resourceType && allocation.allocated > resourceType.capacity) {
        risks.push({
          type: 'over-allocation',
          severity: 'high',
          message: `${resourceType.name}: ${allocation.allocated} allocated but only ${resourceType.capacity} available`
        });
      }
      
      // Check for under-allocation
      if (allocation.required > allocation.allocated) {
        risks.push({
          type: 'under-allocation',
          severity: 'medium',
          message: `${resourceType?.name || resourceTypeId}: ${allocation.required} required but only ${allocation.allocated} allocated`
        });
      }
    });
    
    // Check team size
    if (totalTeamSize > this.optimalTeamSize * 2) {
      risks.push({
        type: 'team-size',
        severity: 'high',
        message: `Team size (${totalTeamSize}) may be too large, causing communication overhead`
      });
    }
    
    if (totalTeamSize === 0) {
      risks.push({
        type: 'no-resources',
        severity: 'critical',
        message: 'No resources allocated to project'
      });
    }
    
    return risks;
  }
}

/**
 * Calculate the average hours per month for a selected quarter or the current quarter.
 * @param {Array} projects - Array of project objects
 * @param {string} quarter - Quarter in format 'YYYY-Q' (e.g., '2023-Q1'). If not provided, uses the current quarter.
 * @returns {Object} Object containing the average hours per month for the quarter.
 */
export function calculateQuarterlyResourceRequirements(projects, quarter) {
  // Determine the start and end dates for the quarter
  let startDate, endDate;
  if (quarter) {
    const [year, q] = quarter.split('-Q');
    const month = (parseInt(q) - 1) * 3;
    startDate = new Date(parseInt(year), month, 1);
    endDate = new Date(parseInt(year), month + 3, 0);
  } else {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
    endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
  }

  // Filter projects that overlap with the quarter
  const activeProjects = projects.filter(project => {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    return projectEnd >= startDate && projectStart <= endDate;
  });

  // Calculate total hours for the quarter
  const totalHours = activeProjects.reduce((sum, project) => {
    return sum + Object.values(project.resources || {}).reduce((projectSum, resource) => projectSum + (resource.hours || 0), 0);
  }, 0);

  // Calculate the number of months in the quarter
  const monthsInQuarter = 3;

  // Calculate average hours per month
  const avgHoursPerMonth = Math.round(totalHours / monthsInQuarter);

  return {
    avgHoursPerMonth,
    totalHours,
    startDate,
    endDate,
    activeProjectsCount: activeProjects.length
  };
}

/**
 * Calculate the average hours per month for a preset range.
 * @param {Array} projects - Array of project objects
 * @param {string} range - Preset range: 'lastMonth', 'lastQuarter', 'lastYear', 'currentMonth', 'currentQuarter', 'currentYear', 'nextMonth', 'nextQuarter', 'nextYear'
 * @returns {Object} Object containing the average hours per month for the range.
 */
export function calculateResourceRequirementsForRange(projects, range) {
  const now = new Date();
  let startDate, endDate;

  switch (range) {
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'lastQuarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedLastQuarter = lastQuarter < 0 ? 3 : lastQuarter;
      startDate = new Date(lastQuarterYear, adjustedLastQuarter * 3, 1);
      endDate = new Date(lastQuarterYear, (adjustedLastQuarter + 1) * 3, 0);
      break;
    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    case 'currentMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'currentQuarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      break;
    case 'currentYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    case 'nextMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      break;
    case 'nextQuarter':
      const nextQuarter = Math.floor(now.getMonth() / 3) + 1;
      const nextQuarterYear = nextQuarter > 3 ? now.getFullYear() + 1 : now.getFullYear();
      const adjustedNextQuarter = nextQuarter > 3 ? 0 : nextQuarter;
      startDate = new Date(nextQuarterYear, adjustedNextQuarter * 3, 1);
      endDate = new Date(nextQuarterYear, (adjustedNextQuarter + 1) * 3, 0);
      break;
    case 'nextYear':
      startDate = new Date(now.getFullYear() + 1, 0, 1);
      endDate = new Date(now.getFullYear() + 1, 11, 31);
      break;
    default:
      throw new Error('Invalid range specified');
  }

  // Initialize monthly totals
  const monthlyTotals = {};
  const monthlyProjectCounts = {};

  // Helper to get month key
  const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  // Initialize all months in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const monthKey = getMonthKey(currentDate);
    monthlyTotals[monthKey] = 0;
    monthlyProjectCounts[monthKey] = 0;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Calculate hours for each project
  projects.forEach(project => {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    
    // Skip projects that don't overlap with our range
    if (projectEnd < startDate || projectStart > endDate) return;
    
    // Calculate total project hours
    const totalProjectHours = Object.values(project.resources || {})
      .reduce((sum, resource) => sum + (resource.hours || 0), 0);
    
    // Calculate project duration in months
    const projectMonths = (projectEnd.getFullYear() - projectStart.getFullYear()) * 12 + 
                         (projectEnd.getMonth() - projectStart.getMonth()) + 1;
    
    // Calculate hours per month for this project
    const hoursPerMonth = Math.ceil(totalProjectHours / projectMonths);
    
    // Calculate the overlap with our range
    const rangeStart = new Date(Math.max(projectStart, startDate));
    const rangeEnd = new Date(Math.min(projectEnd, endDate));
    
    // Calculate the number of months in the overlap
    const overlapMonths = (rangeEnd.getFullYear() - rangeStart.getFullYear()) * 12 + 
                         (rangeEnd.getMonth() - rangeStart.getMonth()) + 1;
    
    // Calculate the total hours for the overlap period
    const overlapHours = hoursPerMonth * overlapMonths;
    
    // Distribute hours across months within our range
    const currentDate = new Date(rangeStart);
    while (currentDate <= rangeEnd) {
      const monthKey = getMonthKey(currentDate);
      monthlyTotals[monthKey] += hoursPerMonth;
      monthlyProjectCounts[monthKey]++;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  });

  // Calculate statistics
  const monthlyValues = Object.values(monthlyTotals);
  const maxHours = Math.max(...monthlyValues);
  const minHours = Math.min(...monthlyValues);
  const avgHoursPerMonth = Math.round(monthlyValues.reduce((sum, hours) => sum + hours, 0) / monthlyValues.length);
  const totalHours = monthlyValues.reduce((sum, hours) => sum + hours, 0);

  return {
    avgHoursPerMonth,
    totalHours,
    maxHours,
    minHours,
    startDate,
    endDate,
    activeProjectsCount: Object.values(monthlyProjectCounts).reduce((sum, count) => sum + count, 0),
    monthlyBreakdown: monthlyTotals
  };
}

