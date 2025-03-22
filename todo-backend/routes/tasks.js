const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// 任务数据验证规则
const taskValidationRules = [
  body('title')
    .trim()
    .isLength({ min: 3 })
    .withMessage('标题至少需要3个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),
  body('category')
    .isIn(['work', 'personal', 'shopping'])
    .withMessage('无效的任务分类'),
  body('priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('无效的优先级'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('无效的日期格式（需ISO8601格式）'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('完成状态必须为布尔值')
];

// 获取当前用户的过滤任务
router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      priority,
      completed,
      search,
      sortBy = 'dueDate',
      page = 1,
      limit = 10,
      dueDate_gte,
      dueDate_lte
    } = req.query;

    const matchStage = { userId: new mongoose.Types.ObjectId(req.user.userId) };
    if (category) matchStage.category = category;
    if (priority) matchStage.priority = priority;
    if (completed !== undefined) {
      matchStage.completed = completed === 'true';
    } else {
      matchStage.completed = false;
    }
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (dueDate_gte && dueDate_lte) {
      matchStage.dueDate = {
        $gte: new Date(dueDate_gte),
        $lte: new Date(dueDate_lte)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          priorityValue: {
            $switch: {
              branches: [
                { case: { $eq: ["$priority", "high"] }, then: 3 },
                { case: { $eq: ["$priority", "medium"] }, then: 2 },
                { case: { $eq: ["$priority", "low"] }, then: 1 }
              ],
              default: 0
            }
          },
          hasDueDate: {
            $cond: [{ $ifNull: ["$dueDate", false] }, 1, 0]
          }
        }
      }
    ];

    if (sortBy === 'priority') {
      pipeline.push({ $sort: { completed: 1, priorityValue: -1, createdAt: -1 } });
    } else if (sortBy === 'createdAt') {
      pipeline.push({ $sort: { completed: 1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { completed: 1, hasDueDate: -1, dueDate: 1 } });
    }

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const tasks = await Task.aggregate(pipeline);
    const total = await Task.countDocuments(matchStage);

    res.json({
      data: tasks,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('🔥 Fetch Tasks Error:', error);
    res.status(500).json({
      code: 'FETCH_TASKS_FAILED',
      message: '获取任务失败'
    });
  }
});

// 新增：单独 PATCH 完成状态
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId
      },
      {
        completed: req.body.completed
      },
      {
        new: true
      }
    );

    if (!task) {
      return res.status(404).json({ code: 'TASK_NOT_FOUND', message: '任务不存在' });
    }

    res.json({ code: 'TASK_STATUS_UPDATED', data: task });
  } catch (error) {
    res.status(500).json({ code: 'UPDATE_STATUS_FAILED', message: '更新状态失败' });
  }
});

// 创建新任务（带数据验证）
router.post('/', auth, taskValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR',
      errors: errors.array() 
    });
  }

  try {
    const taskData = {
      ...req.body,
      userId: req.user.userId
    };

    if (!taskData.category) taskData.category = 'personal';
    if (!taskData.priority) taskData.priority = 'medium';

    const task = await Task.create(taskData);

    res.status(201).json({
      code: 'TASK_CREATED',
      data: task
    });

  } catch (error) {
    console.error('🔥 Task creation error:', error);
    res.status(500).json({
      code: 'CREATE_TASK_FAILED',
      message: '创建任务失败'
    });
  }
});

// 更新任务（全字段验证）
router.put('/:id', auth, taskValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR',
      errors: errors.array() 
    });
  }

  try {
    const task = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        userId: req.user.userId 
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        code: 'TASK_NOT_FOUND',
        message: '任务不存在或没有权限'
      });
    }

    res.json({ code: 'TASK_UPDATED', data: task });

  } catch (error) {
    res.status(500).json({ code: 'UPDATE_TASK_FAILED', message: '更新任务失败' });
  }
});

// 删除单个任务
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!task) {
      return res.status(404).json({ code: 'TASK_NOT_FOUND', message: '任务不存在或已删除' });
    }

    res.json({ code: 'TASK_DELETED', data: task });

  } catch (error) {
    res.status(500).json({ code: 'DELETE_TASK_FAILED', message: '删除任务失败' });
  }
});

// 任务统计接口
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ code: 'INVALID_USER_ID', message: '用户ID无效' });
    }

    const stats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
          highPriority: { 
            $sum: { 
              $cond: [ { $eq: ["$priority", "high"] }, 1, 0 ] 
            }
          },
          overdue: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $ne: ["$dueDate", null] },
                    { $lt: ["$dueDate", new Date()] },
                    { $eq: ["$completed", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      code: 'STATS_SUCCESS',
      data: {
        total: stats[0]?.total || 0,
        completed: stats[0]?.completed || 0,
        highPriority: stats[0]?.highPriority || 0,
        overdue: stats[0]?.overdue || 0
      }
    });

  } catch (error) {
    console.error('🔥 Stats Error:', error);
    res.status(500).json({ code: 'STATS_FAILED', message: '获取统计信息失败' });
  }
});

// 批量删除任务
router.delete('/bulk/delete', auth, async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: '需要提供有效的任务ID数组' });
    }

    const result = await Task.deleteMany({
      _id: { $in: taskIds },
      userId: req.user.userId
    });

    res.json({ code: 'BULK_DELETE_SUCCESS', data: { deletedCount: result.deletedCount } });

  } catch (error) {
    res.status(500).json({ code: 'BULK_DELETE_FAILED', message: '批量删除失败' });
  }
});

module.exports = router;