import { Schema, model, Document } from 'mongoose'

export type TaskStatus = 'todo' | 'in-progress' | 'completed'

export interface ITask extends Document {
  workspaceId: Schema.Types.ObjectId
  title: string
  description?: string
  assignedTo?: Schema.Types.ObjectId
  dueDate?: Date
  status: TaskStatus
  createdBy: Schema.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
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
      enum: ['todo', 'in-progress', 'completed'],
      default: 'todo',
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

export const Task = model<ITask>('Task', TaskSchema)