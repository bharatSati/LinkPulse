import mongoose from 'mongoose';
import security from '../config/security.js';

export const NOTIFICATION_TYPES = [
  'invitation',
  'member_event',
  'link_event',
  'link_disabled',
  'campaign_event',
  'abuse_report',
  'anomaly',
  'security_event',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    targetUrl: {
      type: String,
      default: null,
      trim: true,
      maxlength: 300,
    },
    readAt: {
      type: Date,
      default: null,
    },
    dedupeKey: {
      type: String,
      default: null,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

notificationSchema.index({ recipient: 1, readAt: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ workspace: 1, createdAt: -1 });
notificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * security.notificationRetentionDays }
);

export default mongoose.model('Notification', notificationSchema);
