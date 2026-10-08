import { Schema, model, Document } from 'mongoose';

export type ActionItemStatus = 'pending' | 'in-progress' | 'completed';

export interface IActionItem extends Document {
  meetingId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  assignedTo?: Schema.Types.ObjectId;
  dueDate?: Date;
  status: ActionItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemSchema = new Schema<IActionItem>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    dueDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const ActionItem = model<IActionItem>('ActionItem', ActionItemSchema);