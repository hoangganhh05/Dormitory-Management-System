export interface DashboardStats {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  pendingRegistrations: number;
  urgentIssues: number;
  buildingStats: {
    [buildingName: string]: {
      total: number;
      occupied: number;
    };
  };
  recentRegistrations: any[];
  recentMaintenance: any[];
}

export interface DashboardApiResponse {
  success: boolean;
  data: DashboardStats;
  message?: string;
}
