import mongoose from 'mongoose';

export const AUDIT_ACTIONS = [
  'workspace.created',
  'workspace.updated',
  'workspace.deleted',
  'member.added',
  'member.joined',
  'member.removed',
  'member.left',
  'member.role_changed',
  'ownership.transferred',
  'invitation.created',
  'invitation.resent',
  'invitation.revoked',
  'invitation.declined',
  'invitation.accepted',
  'invitation.expired',
  'link.disabled',
  'link.reactivated',
  'abuse.report.created',
  'abuse.report.reviewed',
  'security.event.reviewed',
];

const auditLogSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
    },
    targetType: {
      type: String,
      default: null,
      maxlength: 40,
    },
    targetId: {
      type: String,
      default: null,
      maxlength: 60,
    },
    targetLabel: {
      type: String,
      default: null,
      maxlength: 160,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ workspace: 1, createdAt: -1 });
auditLogSchema.index({ workspace: 1, action: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
