import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Meeting } from '../models/Meeting';

export const createMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, scheduledAt } = req.body;
    const hostId = req.user?.userId;

    if (!hostId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const meeting = await Meeting.create({
      title,
      hostId,
      scheduledAt: scheduledAt || new Date(),
      participants: [hostId],
    });

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting,
    });
  } catch (error) {
    console.error('[Create Meeting] Error:', error);
    res.status(500).json({ message: 'Error creating meeting.' });
  }
};

export const getMeetings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const meetings = await Meeting.find({
      $or: [{ hostId: userId }, { participants: userId }],
    })
      .populate('hostId', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({ meetings });
  } catch (error) {
    console.error('[Get Meetings] Error:', error);
    res.status(500).json({ message: 'Error fetching meetings.' });
  }
};

export const getMeetingById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id)
      .populate('hostId', 'name email avatarUrl')
      .populate('participants', 'name email avatarUrl');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    res.status(200).json({ meeting });
  } catch (error) {
    console.error('[Get Meeting] Error:', error);
    res.status(500).json({ message: 'Error fetching meeting.' });
  }
};

export const updateMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    if (meeting.hostId.toString() !== userId) {
      res.status(403).json({
        message: 'Only the meeting host can update this meeting.',
      });
      return;
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Meeting updated successfully',
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error('[Update Meeting] Error:', error);
    res.status(500).json({ message: 'Error updating meeting.' });
  }
};

export const deleteMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    if (meeting.hostId.toString() !== userId) {
      res.status(403).json({
        message: 'Only the meeting host can delete this meeting.',
      });
      return;
    }

    await Meeting.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Meeting deleted successfully.',
      meetingId: id,
    });
  } catch (error) {
    console.error('[Delete Meeting] Error:', error);
    res.status(500).json({ message: 'Error deleting meeting.' });
  }
};