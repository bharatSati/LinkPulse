import mongoose from 'mongoose';
import { WORKSPACE_ROLES } from '../utils/roles.js';

const workspaceInvitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: WORKSPACE_ROLES,
      default: 'viewer',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    declinedAt: {
      type: Date,
      default: null,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    expiredNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

workspaceInvitationSchema.index({ workspace: 1, email: 1 });
workspaceInvitationSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('WorkspaceInvitation', workspaceInvitationSchema);
