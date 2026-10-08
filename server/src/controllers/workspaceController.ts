import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Workspace } from '../models/Workspace'
import { User } from '../models/User'

export const createWorkspace = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body
    const ownerId = req.user?.userId

    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    if (!name?.trim()) {
      res.status(400).json({
        message: 'Workspace name is required',
      })
      return
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description?.trim() || '',
      ownerId,
      members: [ownerId],
    })

    await workspace.populate('ownerId', 'name email')
    await workspace.populate('members', 'name email')

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error creating workspace',
      error,
    })
  }
}

export const getMyWorkspaces = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const workspaces = await Workspace.find({
      members: userId,
    })
      .populate('ownerId', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      workspaces,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching workspaces',
      error,
    })
  }
}

export const getWorkspaceById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const workspace = await Workspace.findOne({
      _id: id,
      members: userId,
    })
      .populate('ownerId', 'name email')
      .populate('members', 'name email')

    if (!workspace) {
      res.status(404).json({
        message: 'Workspace not found',
      })
      return
    }

    res.status(200).json({
      workspace,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching workspace',
      error,
    })
  }
}

export const addMemberToWorkspace = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { email } = req.body
    const currentUserId = req.user?.userId

    if (!currentUserId) {
      res.status(401).json({
        message: 'Unauthorized',
      })
      return
    }

    if (!email?.trim()) {
      res.status(400).json({
        message: 'Member email is required',
      })
      return
    }

    const workspace = await Workspace.findById(id)

    if (!workspace) {
      res.status(404).json({
        message: 'Workspace not found',
      })
      return
    }

    if (workspace.ownerId.toString() !== currentUserId) {
      res.status(403).json({
        message: 'Only the workspace owner can add members',
      })
      return
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    })

    if (!user) {
      res.status(404).json({
        message: 'User with this email does not exist',
      })
      return
    }

    if (
      workspace.members.some(
        (member) => member.toString() === user._id.toString()
      )
    ) {
      res.status(400).json({
        message: 'User is already a workspace member',
      })
      return
    }

    workspace.members.push(user._id as any)

    await workspace.save()

    await workspace.populate('ownerId', 'name email')
    await workspace.populate('members', 'name email')

    res.status(200).json({
      message: 'Member added successfully',
      workspace,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error adding workspace member',
      error,
    })
  }
}