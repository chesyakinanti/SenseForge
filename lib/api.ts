import {
  clearBackendCache,
  getBackendAnomalies,
  getBackendAnomaly,
  getBackendDashboardData,
  getBackendHeatmap,
  getBackendMachine,
  getBackendMachines,
  getBackendMachineSeries,
  getBackendMaintenanceLogs,
  getBackendNotifications,
  getBackendProcessingData,
} from "./backend-adapter";
import type { RangeKey } from "./types";

export const api = {
  clearCache() {
    clearBackendCache();
  },
  async getDashboard() {
    return getBackendDashboardData();
  },
  async getMachines() {
    return getBackendMachines();
  },
  async getMachine(id: string) {
    return getBackendMachine(id);
  },
  async getMachineSeries(id: string, range: RangeKey) {
    return getBackendMachineSeries(id, range);
  },
  async getAnomalies() {
    return getBackendAnomalies();
  },
  async getAnomaly(id: string) {
    return getBackendAnomaly(id);
  },
  async getMaintenance() {
    return getBackendMaintenanceLogs();
  },
  async getProcessing() {
    return getBackendProcessingData();
  },
  async getNotifications() {
    return getBackendNotifications();
  },
  async getHeatmap() {
    return getBackendHeatmap();
  },
};
