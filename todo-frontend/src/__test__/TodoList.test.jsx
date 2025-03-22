import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import TodoList from "../pages/TodoList";
import { AuthContext } from "../context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import { deleteTask } from "../services/api";

// 👇 mock services/api 里的所有函数
jest.mock("../services/api", () => ({
  updateTask: jest.fn(() => Promise.resolve()),
  deleteTask: jest.fn(() => Promise.resolve()),
  getTasks: jest.fn(() => Promise.resolve({ data: [], pagination: { totalPages: 1 } })),
  addTask: jest.fn(() => Promise.resolve()),
}));

// 👇 导入 mock 后的函数用于 expect
import { updateTask } from "../services/api";

// mock axios 也保留
jest.mock("axios");

const renderWithAuth = (ui) => {
  return render(
    <AuthContext.Provider value={{ token: "test-token", logout: jest.fn() }}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe("TodoList", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: {
        data: [],
        pagination: { totalPages: 1 },
      },
    });
  });

  it("renders dashboard title", async () => {
    renderWithAuth(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText(/📝 Todo Dashboard/i)).toBeInTheDocument();
    });
  });

  it("adds a new task", async () => {
    axios.post.mockResolvedValue({});
    renderWithAuth(<TodoList />);

    const input = screen.getByPlaceholderText("➕ New task title");
    fireEvent.change(input, { target: { value: "Test Task" } });

    const addButton = screen.getByText("Add Task");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it("shows error if task title is empty", async () => {
    renderWithAuth(<TodoList />);
    const addButton = screen.getByText("Add Task");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Task title cannot be empty.")).toBeInTheDocument();
    });
  });
});
it("loads and displays a task", async () => {
  axios.get.mockResolvedValueOnce({
    data: {
      data: [
        {
          _id: "1",
          title: "Loaded Task",
          category: "personal",
          priority: "medium",
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: new Date().toISOString(),
        },
      ],
      pagination: { totalPages: 1 },
    },
  });

  renderWithAuth(<TodoList />);

  await waitFor(() => {
    expect(screen.getByText("Loaded Task")).toBeInTheDocument();
  });
});

it("opens and saves task changes in modal", async () => {
  axios.get.mockResolvedValueOnce({
    data: {
      data: [{
        _id: "1",
        title: "Editable Task",
        description: "Some description",
        category: "work",
        priority: "low",
        dueDate: "2025-03-22T16:53",
        createdAt: "2025-03-22T16:53",
        completed: false,
      }],
      pagination: { totalPages: 1 },
    },
  });

  const { getByText, getByLabelText } = renderWithAuth(<TodoList />);

  fireEvent.click(await screen.findByText("Editable Task"));

  await waitFor(() => {
    expect(screen.getByText("📝 Edit Task")).toBeInTheDocument();
  });

  fireEvent.change(getByLabelText("Title"), { target: { value: "Updated Task" } });
  fireEvent.click(getByText("Save"));

  await waitFor(() => {
    expect(updateTask).toHaveBeenCalled();  // 使用正确的 mock 函数断言
  });
});

it("deletes a task", async () => {
  axios.get.mockResolvedValueOnce({
    data: {
      data: [
        {
          _id: "1",
          title: "Task to Delete",
          category: "shopping",
          priority: "high",
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { totalPages: 1 },
    },
  });

  deleteTask.mockResolvedValue({}); // mock services/api 的 deleteTask

  renderWithAuth(<TodoList />);

  await waitFor(() => {
    expect(screen.getByText("Task to Delete")).toBeInTheDocument();
  });

  const deleteButton = screen.getByRole("button", { name: "🗑" });
  fireEvent.click(deleteButton);

  await waitFor(() => {
    expect(deleteTask).toHaveBeenCalled(); // ✅ 改为断言 deleteTask
  });
});
