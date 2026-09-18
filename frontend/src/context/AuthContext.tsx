import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  loginUser,
  registerUser,
} from "../features/authentication/services/authService";

import type {
  AuthUser,
  RegisterResponse,
} from "../features/authentication/types/auth.types";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (
    fullName: string,
    email: string,
    password: string,
    role: string,
    phoneNumber: string,
    dateOfBirth: string,
    address: string,
    district: string,
    emergencyContactName: string,
    emergencyContactPhone: string
  ) => Promise<RegisterResponse>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as AuthUser);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthUser> => {
    const response = await loginUser({
      email,
      password,
    });

    const loggedInUser = response.user;

    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));

    setToken(response.accessToken);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: string,
    phoneNumber: string,
    dateOfBirth: string,
    address: string,
    district: string,
    emergencyContactName: string,
    emergencyContactPhone: string
  ): Promise<RegisterResponse> => {
    return registerUser({
      fullName,
      email,
      password,
      role,
      phoneNumber,
      dateOfBirth,
      address,
      district,
      emergencyContactName,
      emergencyContactPhone,
    });
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
