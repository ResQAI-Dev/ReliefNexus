import type { UserRole } from "../types/auth.types";

interface RegisterValidationData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  agreedToTerms: boolean;
}

export const validateLoginForm = (
  email: string,
  password: string
): string | null => {
  if (!email.trim() || !password) {
    return "Please enter your email and password.";
  }

  return null;
};

export const validateRegisterForm = ({
  fullName,
  email,
  password,
  confirmPassword,
  role,
  agreedToTerms,
}: RegisterValidationData): string | null => {
  if (
    !fullName.trim() ||
    !email.trim() ||
    !password ||
    !confirmPassword
  ) {
    return "Please complete all required fields.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  if (password.length < 6) {
    return "Password must contain at least 6 characters.";
  }

  if (!role) {
    return "Please select a role.";
  }

  if (!agreedToTerms) {
    return "Please agree to the platform terms and responsible-use policy.";
  }

  return null;
};

export const getDashboardPath = (role: UserRole | string): string => {
  if (role === "SystemAdministrator") {
    return "/dashboard/system-administrator";
  }

  if (
    role === "ReliefCoordinator" ||
    role === "FieldVolunteer" ||
    role === "AffectedUser"
  ) {
    return "/dashboard/user";
  }

  return "/";
};

export const getAuthErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return fallback;
};