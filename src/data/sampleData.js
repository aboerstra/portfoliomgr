// Sample data for Faye Portfolio Management

export const valueStreams = [
  {
    id: 'tech-platform',
    name: 'Technology Platform',
    color: '#8B5CF6', // Purple
    description: 'Core technology infrastructure and platform development'
  },
  {
    id: 'customer-experience',
    name: 'Customer Experience',
    color: '#06B6D4', // Cyan
    description: 'Customer-facing applications and user experience improvements'
  },
  {
    id: 'data-analytics',
    name: 'Data & Analytics',
    color: '#10B981', // Green
    description: 'Data platform, analytics, and business intelligence'
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    color: '#F59E0B', // Amber
    description: 'Cloud infrastructure, security, and operations'
  }
];

export const projects = [
  {
    id: 'proj-001',
    name: 'API Gateway Modernization',
    valueStreamId: 'tech-platform',
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    status: 'in-progress',
    priority: 'high',
    description: 'Modernize legacy API gateway to microservices architecture',
    progress: 35,
    resources: {
      developers: { allocated: 4, required: 4 },
      architects: { allocated: 1, required: 1 },
      devops: { allocated: 2, required: 2 }
    },
    milestones: [
      { id: 'ms-001', name: 'Architecture Design Complete', date: '2025-02-15', status: 'completed', linkedRockIds: [] },
      { id: 'ms-002', name: 'MVP Implementation', date: '2025-04-15', status: 'in-progress', linkedRockIds: [] },
      { id: 'ms-003', name: 'Production Deployment', date: '2025-06-15', status: 'planned', linkedRockIds: [] }
    ],
    hoursUsed: 0,
    totalHours: 160
  },
  {
    id: 'proj-002',
    name: 'Mobile App Redesign',
    valueStreamId: 'customer-experience',
    startDate: '2025-02-01',
    endDate: '2025-08-31',
    status: 'planned',
    priority: 'high',
    description: 'Complete redesign of mobile application with new UX',
    progress: 0,
    resources: {
      developers: { allocated: 3, required: 4 },
      designers: { allocated: 2, required: 2 },
      pm: { allocated: 1, required: 1 }
    },
    milestones: [
      { id: 'ms-004', name: 'UX Research Complete', date: '2025-03-01', status: 'planned', linkedRockIds: [] },
      { id: 'ms-005', name: 'Design System Ready', date: '2025-04-01', status: 'planned', linkedRockIds: [] },
      { id: 'ms-006', name: 'Beta Release', date: '2025-07-01', status: 'planned', linkedRockIds: [] },
      { id: 'ms-007', name: 'App Store Launch', date: '2025-08-15', status: 'planned', linkedRockIds: [] }
    ],
    hoursUsed: 0,
    totalHours: 160
  },
  {
    id: 'proj-003',
    name: 'Real-time Analytics Platform',
    valueStreamId: 'data-analytics',
    startDate: '2025-03-01',
    endDate: '2025-09-30',
    status: 'planned',
    priority: 'medium',
    description: 'Build real-time analytics and reporting platform',
    progress: 0,
    resources: {
      developers: { allocated: 2, required: 3 },
      dataEngineers: { allocated: 2, required: 2 },
      analysts: { allocated: 1, required: 1 }
    },
    milestones: [
      { id: 'ms-008', name: 'Data Pipeline Setup', date: '2025-04-15', status: 'planned', linkedRockIds: [] },
      { id: 'ms-009', name: 'Dashboard MVP', date: '2025-06-30', status: 'planned', linkedRockIds: [] },
      { id: 'ms-010', name: 'Advanced Analytics', date: '2025-09-15', status: 'planned', linkedRockIds: [] }
    ],
    hoursUsed: 0,
    totalHours: 160
  },
  {
    id: 'proj-004',
    name: 'Cloud Migration Phase 2',
    valueStreamId: 'infrastructure',
    startDate: '2025-01-15',
    endDate: '2025-05-31',
    status: 'in-progress',
    priority: 'high',
    description: 'Migrate remaining legacy systems to cloud infrastructure',
    progress: 60,
    resources: {
      devops: { allocated: 3, required: 3 },
      developers: { allocated: 2, required: 2 },
      architects: { allocated: 1, required: 1 }
    },
    milestones: [
      { id: 'ms-011', name: 'Migration Plan Approved', date: '2025-02-01', status: 'completed', linkedRockIds: [] },
      { id: 'ms-012', name: 'Database Migration', date: '2025-03-31', status: 'in-progress', linkedRockIds: [] },
      { id: 'ms-013', name: 'Application Migration', date: '2025-05-15', status: 'planned', linkedRockIds: [] }
    ],
    hoursUsed: 0,
    totalHours: 160
  },
  {
    id: 'proj-005',
    name: 'Customer Portal Enhancement',
    valueStreamId: 'customer-experience',
    startDate: '2025-04-01',
    endDate: '2025-07-31',
    status: 'planned',
    priority: 'medium',
    description: 'Enhance customer self-service portal with new features',
    progress: 0,
    resources: {
      developers: { allocated: 2, required: 3 },
      designers: { allocated: 1, required: 1 },
      pm: { allocated: 1, required: 1 }
    },
    milestones: [
      { id: 'ms-014', name: 'Requirements Gathering', date: '2025-04-15', status: 'planned', linkedRockIds: [] },
      { id: 'ms-015', name: 'Feature Development', date: '2025-06-15', status: 'planned', linkedRockIds: [] },
      { id: 'ms-016', name: 'User Testing', date: '2025-07-15', status: 'planned', linkedRockIds: [] }
    ],
    hoursUsed: 0,
    totalHours: 160
  },
  {
    id: 'proj-1',
    name: 'Sample Project 1',
    description: 'This is a sample project',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    valueStreamId: 'vs-1',
    resourceTypeId: 'rt-1',
    status: 'Not Started',
    priority: 'Medium',
    progress: 0,
    hoursUsed: 0,
    totalHours: 160,
    resources: {},
    milestones: [],
    asanaUrl: '',
    pmAllocation: 20
  }
];

export const resourceTypes = [
  {
    id: 'rt-1',
    name: 'Project Manager',
    hourlyRate: 150,
    capacity: 1,
    color: '#8B5CF6',
    isDefault: true
  },
  { id: 'developers', name: 'Developers', hourlyRate: 100, capacity: 8, color: '#3B82F6' },
  { id: 'designers', name: 'Designers', hourlyRate: 90, capacity: 3, color: '#EC4899' },
  { id: 'qa', name: 'QA Engineers', hourlyRate: 85, capacity: 4, color: '#10B981' },
  { id: 'dataEngineers', name: 'Data Engineers', hourlyRate: 110, capacity: 4, color: '#F59E0B' },
  { id: 'analysts', name: 'Business Analysts', hourlyRate: 80, capacity: 6, color: '#06B6D4' }
];

export const quarters = [
  { id: 'q1-2025', name: 'Q1 2025', startDate: '2025-01-01', endDate: '2025-03-31' },
  { id: 'q2-2025', name: 'Q2 2025', startDate: '2025-04-01', endDate: '2025-06-30' },
  { id: 'q3-2025', name: 'Q3 2025', startDate: '2025-07-01', endDate: '2025-09-30' },
  { id: 'q4-2025', name: 'Q4 2025', startDate: '2025-10-01', endDate: '2025-12-31' }
];

export const resourceCommitments = {
  'q1-2025': {
    developers: { committed: 18, available: 20 },
    designers: { committed: 6, available: 8 },
    architects: { committed: 3, available: 4 },
    devops: { committed: 5, available: 6 },
    dataEngineers: { committed: 2, available: 4 },
    analysts: { committed: 4, available: 6 },
    pm: { committed: 4, available: 5 }
  },
  'q2-2025': {
    developers: { committed: 15, available: 20 },
    designers: { committed: 7, available: 8 },
    architects: { committed: 2, available: 4 },
    devops: { committed: 4, available: 6 },
    dataEngineers: { committed: 3, available: 4 },
    analysts: { committed: 3, available: 6 },
    pm: { committed: 3, available: 5 }
  },
  'q3-2025': {
    developers: { committed: 12, available: 20 },
    designers: { committed: 5, available: 8 },
    architects: { committed: 2, available: 4 },
    devops: { committed: 3, available: 6 },
    dataEngineers: { committed: 4, available: 4 },
    analysts: { committed: 2, available: 6 },
    pm: { committed: 2, available: 5 }
  },
  'q4-2025': {
    developers: { committed: 10, available: 20 },
    designers: { committed: 4, available: 8 },
    architects: { committed: 1, available: 4 },
    devops: { committed: 2, available: 6 },
    dataEngineers: { committed: 2, available: 4 },
    analysts: { committed: 3, available: 6 },
    pm: { committed: 2, available: 5 }
  }
};

