export type UserRole =
  | "AffectedUser"
  | "FieldVolunteer"
  | "ReliefCoordinator"
  | "SystemAdministrator";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole | string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole | string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  district: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface RegisterResponse {
  id: string;
  fullName: string;
  email: string;
  role: UserRole | string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

