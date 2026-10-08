import { Schema, model, Document } from 'mongoose'

export interface IWorkspace extends Document {
  name: string
  description?: string
  ownerId: Schema.Types.ObjectId
  members: Schema.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
)

export const Workspace = model<IWorkspace>(
  'Workspace',
  WorkspaceSchema
)