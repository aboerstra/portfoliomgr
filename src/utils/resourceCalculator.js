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

