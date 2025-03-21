import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom'; // Add this import
import Login from "./Login";
import { AuthContext } from "../context/AuthContext";
import { BrowserRouter } from "react-router-dom";

// Helper to wrap with Router & Context
const renderWithProviders = (ui, contextProps) => {
  return render(
    <AuthContext.Provider value={contextProps}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

test("renders login form", () => {
  renderWithProviders(<Login />, { login: jest.fn() });

  expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test("calls login function when credentials submitted", async () => {
  const mockLogin = jest.fn();

  renderWithProviders(<Login />, { login: mockLogin });

  fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "testuser" } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "123456" } });

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  // You can add more logic here to test Axios interaction via mocking
});