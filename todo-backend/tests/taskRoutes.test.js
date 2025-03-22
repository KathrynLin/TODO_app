const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const realAuth = require("../middleware/auth");
const realRoutes = require("../routes/tasks");

jest.mock("../middleware/auth", () => {
  const mongoose = require("mongoose");
  return (req, res, next) => {
    req.user = { userId: new mongoose.Types.ObjectId().toHexString() };
    next();
  };
});

const taskRoutes = require("../routes/tasks");
const Task = require("../models/Task");

jest.mock("../models/Task");

const app = express();
app.use(express.json());
app.use("/api/tasks", taskRoutes);

describe("Task API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/tasks - 创建任务成功", async () => {
    const mockTask = { _id: "123", title: "New Task", category: "work", priority: "high" };
    Task.create.mockResolvedValueOnce(mockTask);

    const res = await request(app).post("/api/tasks").send({
      title: "New Task",
      category: "work",
      priority: "high"
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.code).toBe("TASK_CREATED");
    expect(res.body.data.title).toBe("New Task");
  });

  it("GET /api/tasks - 获取任务列表", async () => {
    Task.aggregate.mockResolvedValue([]);
    Task.countDocuments.mockResolvedValue(0);

    const res = await request(app).get("/api/tasks");

    expect(res.statusCode).toBe(200);
    expect(res.body.pagination.total).toBe(0);
  });

  it("PATCH /api/tasks/:id/status - 修改完成状态", async () => {
    const mockTask = { _id: "123", completed: true };
    Task.findOneAndUpdate.mockResolvedValueOnce(mockTask);

    const res = await request(app)
      .patch("/api/tasks/123/status")
      .send({ completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.completed).toBe(true);
  });

  it("DELETE /api/tasks/:id - 删除任务", async () => {
    Task.findOneAndDelete.mockResolvedValueOnce({ _id: "123", title: "Delete Me" });

    const res = await request(app).delete("/api/tasks/123");

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe("TASK_DELETED");
  });

  it("DELETE /api/tasks/bulk/delete - 批量删除任务", async () => {
    Task.deleteMany.mockResolvedValueOnce({ deletedCount: 2 });

    const res = await request(app)
      .delete("/api/tasks/bulk/delete")
      .send({ taskIds: ["id1", "id2"] });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.deletedCount).toBe(2);
  });

  it("GET /api/tasks/stats - 获取任务统计", async () => {
    Task.aggregate.mockResolvedValue([
      {
        total: 10,
        completed: 5,
        highPriority: 2,
        overdue: 3,
      },
    ]);

    const res = await request(app).get("/api/tasks/stats");

    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBe(10);
    expect(res.body.data.completed).toBe(5);
    expect(res.body.data.highPriority).toBe(2);
    expect(res.body.data.overdue).toBe(3);
  });

  it("POST /api/tasks - 创建任务失败（缺少标题）", async () => {
    const res = await request(app).post("/api/tasks").send({
      category: "work",
      priority: "high"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: expect.stringContaining("标题至少需要") })
      ])
    );
  });

  it("PUT /api/tasks/:id - 更新任务成功", async () => {
    const mockTask = { _id: "123", title: "Updated Task" };
    Task.findOneAndUpdate.mockResolvedValueOnce(mockTask);

    const res = await request(app)
      .put("/api/tasks/123")
      .send({
        title: "Updated Task",
        category: "work",
        priority: "high"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe("TASK_UPDATED");
    expect(res.body.data.title).toBe("Updated Task");
  });

  it("PUT /api/tasks/:id - 更新任务失败（无权限或不存在）", async () => {
    Task.findOneAndUpdate.mockResolvedValueOnce(null);

    const res = await request(app)
      .put("/api/tasks/invalid")
      .send({
        title: "Updated Task",
        category: "work",
        priority: "high"
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe("TASK_NOT_FOUND");
  });

  it("DELETE /api/tasks/:id - 删除任务失败（不存在）", async () => {
    Task.findOneAndDelete.mockResolvedValueOnce(null);

    const res = await request(app).delete("/api/tasks/does-not-exist");

    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe("TASK_NOT_FOUND");
  });

  it("POST /api/tasks - 创建任务失败（无效分类）", async () => {
    const res = await request(app).post("/api/tasks").send({
      title: "Bad Category",
      category: "invalid",
      priority: "high"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "无效的任务分类" })
      ])
    );
  });

  it("should fail when creating task with invalid dueDate", async () => {
    const res = await request(app).post("/api/tasks").send({
      title: "Bad Date Task",
      category: "work",
      priority: "medium",
      dueDate: "not-a-date"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("should return validation error for short title", async () => {
    const res = await request(app).post("/api/tasks").send({
      title: "Hi",
      category: "work",
      priority: "low"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors[0].msg).toBe("标题至少需要3个字符");
  });

  it("should return empty task list on out-of-range pagination", async () => {
    Task.aggregate.mockResolvedValue([]);
    Task.countDocuments.mockResolvedValue(0);

    const res = await request(app).get("/api/tasks?page=999&limit=10");

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });


});