// Constants for localStorage keys
const SCENARIOS_KEY = 'faye_portfolio_scenarios';
const LAST_VIEWED_SCENARIO_KEY = 'faye_portfolio_last_viewed';
const CURRENT_VIEW_KEY = 'faye_portfolio_current_view';

// Helper functions for localStorage
const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

// Scenario management functions
export const saveScenario = (name, data) => {
  const scenarios = getFromStorage(SCENARIOS_KEY, []);
  const existingIndex = scenarios.findIndex(s => s.name === name);
  
  const scenario = {
    name,
    data,
    lastModified: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    scenarios[existingIndex] = scenario;
  } else {
    scenarios.push(scenario);
  }

  saveToStorage(SCENARIOS_KEY, scenarios);
  return scenario;
};

export const loadScenario = (name) => {
  const scenarios = getFromStorage(SCENARIOS_KEY, []);
  return scenarios.find(s => s.name === name);
};

export const deleteScenario = (name) => {
  const scenarios = getFromStorage(SCENARIOS_KEY, []);
  const updatedScenarios = scenarios.filter(s => s.name !== name);
  saveToStorage(SCENARIOS_KEY, updatedScenarios);
};

export const listScenarios = () => {
  return getFromStorage(SCENARIOS_KEY, []);
};

// Last viewed state management
export const saveLastViewedState = (data) => {
  saveToStorage(LAST_VIEWED_SCENARIO_KEY, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const getLastViewedState = () => {
  return getFromStorage(LAST_VIEWED_SCENARIO_KEY);
};

// Current view persistence
export const saveCurrentView = (view) => {
  saveToStorage(CURRENT_VIEW_KEY, view);
};

export const getCurrentView = () => {
  return getFromStorage(CURRENT_VIEW_KEY, 'portfolio');
}; 