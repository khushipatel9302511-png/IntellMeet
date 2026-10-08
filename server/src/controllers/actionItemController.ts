import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ActionItem } from '../models/ActionItem';
import { Meeting } from '../models/Meeting';

export const createActionItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId, title, description, assignedTo, dueDate } = req.body;
    const userId = req.user?.userId;

    if (!meetingId || !title?.trim()) {
      res.status(400).json({
        message: 'Meeting ID and title are required',
      });
      return;
    }

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      res.status(404).json({
        message: 'Meeting not found',
      });
      return;
    }

    const isHost = meeting.hostId.toString() === userId;

    const isParticipant = meeting.participants.some(
      (participant) => participant.toString() === userId
    );

    if (!isHost && !isParticipant) {
      res.status(403).json({
        message: 'You are not authorized for this meeting',
      });
      return;
    }

    const actionItem = await ActionItem.create({
      meetingId,
      title: title.trim(),
      description: description?.trim() || '',
      assignedTo: assignedTo || undefined,
      dueDate: dueDate || undefined,
      status: 'pending',
    });

    const populatedActionItem = await actionItem.populate([
      { path: 'assignedTo', select: 'name email avatarUrl' },
    ]);

    res.status(201).json({
      message: 'Action item created successfully',
      actionItem: populatedActionItem,
    });
  } catch (error) {
    console.error('[ActionItem] Create error:', error);

    res.status(500).json({
      message: 'Error creating action item',
    });
  }
};

export const getActionItemsByMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const userId = req.user?.userId;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      res.status(404).json({
        message: 'Meeting not found',
      });
      return;
    }

    const isHost = meeting.hostId.toString() === userId;

    const isParticipant = meeting.participants.some(
      (participant) => participant.toString() === userId
    );

    if (!isHost && !isParticipant) {
      res.status(403).json({
        message: 'You are not authorized for this meeting',
      });
      return;
    }

    const actionItems = await ActionItem.find({ meetingId })
      .populate('assignedTo', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      actionItems,
    });
  } catch (error) {
    console.error('[ActionItem] Fetch error:', error);

    res.status(500).json({
      message: 'Error fetching action items',
    });
  }
};

export const updateActionItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, dueDate, status } = req.body;
    const userId = req.user?.userId;

    const actionItem = await ActionItem.findById(id);

    if (!actionItem) {
      res.status(404).json({
        message: 'Action item not found',
      });
      return;
    }

    const meeting = await Meeting.findById(actionItem.meetingId);

    if (!meeting) {
      res.status(404).json({
        message: 'Meeting not found',
      });
      return;
    }

    const isHost = meeting.hostId.toString() === userId;

    const isParticipant = meeting.participants.some(
      (participant) => participant.toString() === userId
    );

    if (!isHost && !isParticipant) {
      res.status(403).json({
        message: 'You are not authorized to update this action item',
      });
      return;
    }

    if (title !== undefined) {
      actionItem.title = title.trim();
    }

    if (description !== undefined) {
      actionItem.description = description.trim();
    }

    if (assignedTo !== undefined) {
      actionItem.assignedTo = assignedTo || undefined;
    }

    if (dueDate !== undefined) {
      actionItem.dueDate = dueDate || undefined;
    }

    if (status !== undefined) {
      if (!['pending', 'in-progress', 'completed'].includes(status)) {
        res.status(400).json({
          message: 'Invalid action item status',
        });
        return;
      }

      actionItem.status = status;
    }

    await actionItem.save();

    const populatedActionItem = await actionItem.populate([
      { path: 'assignedTo', select: 'name email avatarUrl' },
    ]);

    res.status(200).json({
      message: 'Action item updated successfully',
      actionItem: populatedActionItem,
    });
  } catch (error) {
    console.error('[ActionItem] Update error:', error);

    res.status(500).json({
      message: 'Error updating action item',
    });
  }
};

export const deleteActionItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const actionItem = await ActionItem.findById(id);

    if (!actionItem) {
      res.status(404).json({
        message: 'Action item not found',
      });
      return;
    }

    const meeting = await Meeting.findById(actionItem.meetingId);

    if (!meeting) {
      res.status(404).json({
        message: 'Meeting not found',
      });
      return;
    }

    const isHost = meeting.hostId.toString() === userId;

    if (!isHost) {
      res.status(403).json({
        message: 'Only the meeting host can delete an action item',
      });
      return;
    }

    await ActionItem.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Action item deleted successfully',
    });
  } catch (error) {
    console.error('[ActionItem] Delete error:', error);

    res.status(500).json({
      message: 'Error deleting action item',
    });
  }
};
