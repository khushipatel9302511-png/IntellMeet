import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Task } from '../models/Task'
import { Workspace } from '../models/Workspace'

export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { workspaceId, title, description, assignedTo, dueDate } =
      req.body

    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({
        message: 'Unauthorized',
      })
      return
    }

    if (!workspaceId || !title?.trim()) {
      res.status(400).json({
        message: 'Workspace ID and task title are required',
      })
      return
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      members: userId,
    })

    if (!workspace) {
      res.status(404).json({
        message: 'Workspace not found or access denied',
      })
      return
    }

    const task = await Task.create({
      workspaceId,
      title: title.trim(),
      description: description?.trim() || '',
      assignedTo: assignedTo || undefined,
      dueDate: dueDate || undefined,
      status: 'todo',
      createdBy: userId,
    })

    await task.populate('assignedTo', 'name email')
    await task.populate('createdBy', 'name email')

    res.status(201).json({
      message: 'Task created successfully',
      task,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error creating task',
      error,
    })
  }
}

export const getTasksByWorkspace = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { workspaceId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({
        message: 'Unauthorized',
      })
      return
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      members: userId,
    })

    if (!workspace) {
      res.status(404).json({
        message: 'Workspace not found or access denied',
      })
      return
    }

    const tasks = await Task.find({
      workspaceId,
    })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      tasks,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching tasks',
      error,
    })
  }
}

export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { title, description, assignedTo, dueDate, status } = req.body

    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({
        message: 'Unauthorized',
      })
      return
    }

    const task = await Task.findById(id)

    if (!task) {
      res.status(404).json({
        message: 'Task not found',
      })
      return
    }

    const workspace = await Workspace.findOne({
      _id: task.workspaceId,
      members: userId,
    })

    if (!workspace) {
      res.status(403).json({
        message: 'Access denied',
      })
      return
    }

    if (title !== undefined) {
      task.title = title.trim()
    }

    if (description !== undefined) {
      task.description = description.trim()
    }

    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo || undefined
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate || undefined
    }

    if (status !== undefined) {
      if (
        !['todo', 'in-progress', 'completed'].includes(
          status
        )
      ) {
        res.status(400).json({
          message: 'Invalid task status',
        })
        return
      }

      task.status = status
    }

    await task.save()

    await task.populate('assignedTo', 'name email')
    await task.populate('createdBy', 'name email')

    res.status(200).json({
      message: 'Task updated successfully',
      task,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating task',
      error,
    })
  }
}

export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({
        message: 'Unauthorized',
      })
      return
    }

    const task = await Task.findById(id)

    if (!task) {
      res.status(404).json({
        message: 'Task not found',
      })
      return
    }

    const workspace = await Workspace.findOne({
      _id: task.workspaceId,
      members: userId,
    })

    if (!workspace) {
      res.status(403).json({
        message: 'Access denied',
      })
      return
    }

    if (task.createdBy.toString() !== userId) {
      res.status(403).json({
        message: 'Only the task creator can delete this task',
      })
      return
    }

    await Task.findByIdAndDelete(id)

    res.status(200).json({
      message: 'Task deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting task',
      error,
    })
  }
}