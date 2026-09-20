export interface UserStatus {
  environment: string;
  user: {
    loggedIn: boolean;
    enabled: boolean;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
    [key: string]: unknown;
  };
}

export interface FuelerDashboardData {
  sampleMessage: string;
  [key: string]: unknown;
}
