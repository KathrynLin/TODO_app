import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import axios from "axios";
import TodoList from "./TodoList";
import { AuthContext } from "../context/AuthContext";
import { BrowserRouter } from "react-router-dom";

jest.mock("axios");

const renderWithProviders = (ui, token = "mock_token") => {
  return render(
    <AuthContext.Provider value={{ token, logout: jest.fn() }}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe("TodoList", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("renders tasks from API", async () => {
    // Mock the API response
    axios.get.mockResolvedValue({
      data: [
        { _id: 1, title: "Test task", completed: false },
      ],
    });

    renderWithProviders(<TodoList />);

    // Wait for the task to be rendered
    expect(await screen.findByText("Test task")).toBeInTheDocument();
  });

  it("adds a new task", async () => {
    // Mock the API responses
    axios.get.mockResolvedValue({ data: [] }); // Initial empty tasks
    axios.post.mockResolvedValue({
      data: { _id: 2, title: "New Task", completed: false },
    });

    renderWithProviders(<TodoList />);

    // Add a new task
    fireEvent.change(screen.getByPlaceholderText("Add new task"), {
      target: { value: "New Task" },
    });
    fireEvent.click(screen.getByText("Add"));

    // Wait for the new task to be rendered
    expect(await screen.findByText("New Task")).toBeInTheDocument();
  });

  it("toggles task completion", async () => {
    // Mock the API responses
    axios.get.mockResolvedValue({
      data: [{ _id: 1, title: "Test task", completed: false }],
    });
    axios.put.mockResolvedValue({
      data: { _id: 1, title: "Test task", completed: true },
    });

    renderWithProviders(<TodoList />);

    // Find the task and toggle its completion
    const task = await screen.findByText("Test task");
    fireEvent.click(task);

    // Wait for the task to be updated
    await waitFor(() => {
      expect(task).toHaveStyle("text-decoration: line-through");
    });
  });

  it("deletes a task", async () => {
    // Mock the API responses
    axios.get.mockResolvedValue({
      data: [{ _id: 1, title: "Test task", completed: false }],
    });
    axios.delete.mockResolvedValue({});

    renderWithProviders(<TodoList />);

    // Find the delete button and click it
    const deleteButton = await screen.findByLabelText("Delete task");
    fireEvent.click(deleteButton);

    // Wait for the task to be removed
    await waitFor(() => {
      expect(screen.queryByText("Test task")).not.toBeInTheDocument();
    });
  });

  it("shows an error message when tasks fail to load", async () => {
    // Mock the API to reject with an error
    axios.get.mockRejectedValue(new Error("Failed to load tasks"));

    renderWithProviders(<TodoList />);

    // Wait for the error message to be displayed
    expect(await screen.findByText("Failed to load tasks. Please try again.")).toBeInTheDocument();
  });

  it("shows an error message when adding a task fails", async () => {
    // Mock the API responses
    axios.get.mockResolvedValue({ data: [] }); // Initial empty tasks
    axios.post.mockRejectedValue(new Error("Failed to add task"));

    renderWithProviders(<TodoList />);

    // Add a new task
    fireEvent.change(screen.getByPlaceholderText("Add new task"), {
      target: { value: "New Task" },
    });
    fireEvent.click(screen.getByText("Add"));

    // Wait for the error message to be displayed
    expect(await screen.findByText("Failed to add task. Please try again.")).toBeInTheDocument();
  });

  it("shows an error message when toggling task completion fails", async () => {
    // Mock the API responses
    axios.get.mockResolvedValue({
      data: [{ _id: 1, title: "Test task", completed: false }],
    });
    axios.put.mockRejectedValue(new Error("Failed to update task"));

    renderWithProviders(<TodoList />);

    // Find the task and toggle its completion
    const task = await screen.findByText("Test task");
    fireEvent.click(task);

    // Wait for the error message to be displayed
    expect(await screen.findByText("Failed to update task.")).toBeInTheDocument();
  });

  it("shows an error message when deleting a task fails", async () => {
    // Mock the API responses
    axios.get.mockResolvedValue({
      data: [{ _id: 1, title: "Test task", completed: false }],
    });
    axios.delete.mockRejectedValue(new Error("Failed to delete task"));

    renderWithProviders(<TodoList />);

    // Find the delete button and click it
    const deleteButton = await screen.findByLabelText("Delete task");
    fireEvent.click(deleteButton);

    // Wait for the error message to be displayed
    expect(await screen.findByText("Failed to delete task.")).toBeInTheDocument();
  });
});