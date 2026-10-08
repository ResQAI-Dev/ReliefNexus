import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  const getEmailInput = () =>
    document.querySelector('input[type="email"]') as HTMLInputElement;

  const getPasswordInput = () =>
    document.querySelector('input[type="password"], input[type="text"]') as HTMLInputElement;

  it("REACT-001 - renders the login form", () => {
    renderLoginPage();

    expect(
      screen.getByRole("heading", { name: /sign in to/i })
    ).toBeInTheDocument();

    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("REACT-002 - validates empty credentials", async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/please enter your email and password/i)
    ).toBeInTheDocument();

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("REACT-003 - navigates System Administrator after successful login", async () => {
    mockLogin.mockResolvedValueOnce({
      id: "admin-001",
      email: "admin@reliefnexus.com",
      role: "SystemAdministrator",
    });

    renderLoginPage();

    fireEvent.change(getEmailInput(), {
      target: { value: "admin@reliefnexus.com" },
    });

    fireEvent.change(getPasswordInput(), {
      target: { value: "TestPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        "admin@reliefnexus.com",
        "TestPassword123!"
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/system-administrator"
      );
    });
  });

  it("REACT-004 - navigates normal users to the user dashboard", async () => {
    mockLogin.mockResolvedValueOnce({
      id: "user-001",
      email: "user@reliefnexus.com",
      role: "ReliefCoordinator",
    });

    renderLoginPage();

    fireEvent.change(getEmailInput(), {
      target: { value: "user@reliefnexus.com" },
    });

    fireEvent.change(getPasswordInput(), {
      target: { value: "TestPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user");
    });
  });

  it("REACT-005 - displays API authentication errors", async () => {
    mockLogin.mockRejectedValueOnce({
      response: {
        data: {
          message: "Invalid email or password.",
        },
      },
    });

    renderLoginPage();

    fireEvent.change(getEmailInput(), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.change(getPasswordInput(), {
      target: { value: "WrongPassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
  });

  it("REACT-006 - toggles password visibility", () => {
    renderLoginPage();

    const passwordInput = getPasswordInput();

    expect(passwordInput).toHaveAttribute("type", "password");

    const passwordContainer = passwordInput.parentElement;
    expect(passwordContainer).not.toBeNull();

    const toggleButton = passwordContainer?.querySelector(
      "button"
    ) as HTMLButtonElement;

    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
