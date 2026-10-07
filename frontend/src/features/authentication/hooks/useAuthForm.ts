import { useState } from "react";

interface UseAuthFormOptions {
  initialRole?: string;
}

export const useAuthForm = ({
  initialRole = "AffectedUser",
}: UseAuthFormOptions = {}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(initialRole);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearError = () => {
    setError("");
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole(initialRole);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRememberMe(false);
    setAgreedToTerms(false);
    setLoading(false);
    setError("");
  };

  return {
    fullName,
    setFullName,

    email,
    setEmail,

    password,
    setPassword,

    confirmPassword,
    setConfirmPassword,

    role,
    setRole,

    showPassword,
    setShowPassword,

    showConfirmPassword,
    setShowConfirmPassword,

    rememberMe,
    setRememberMe,

    agreedToTerms,
    setAgreedToTerms,

    loading,
    setLoading,

    error,
    setError,

    clearError,
    resetForm,
  };
};