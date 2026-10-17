import mongoose from 'mongoose';
import security from '../config/security.js';

export const SECURITY_EVENT_TYPES = [
  'link_creation_burst',
  'source_request_burst',
  'click_spike',
  'reported',
  'suspicious_destination',
  'password_failures',
  'admin_action',
];

export const SECURITY_SEVERITIES = ['low', 'medium', 'high'];
export const SECURITY_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'];
export const SECURITY_SOURCES = ['rules', 'report', 'admin'];

const securityEventSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: SECURITY_EVENT_TYPES,
      required: true,
    },
    severity: {
      type: String,
      enum: SECURITY_SEVERITIES,
      default: 'low',
    },
    status: {
      type: String,
      enum: SECURITY_STATUSES,
      default: 'open',
    },
    source: {
      type: String,
      enum: SECURITY_SOURCES,
      default: 'rules',
    },
    ruleKey: {
      type: String,
      default: null,
      maxlength: 60,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    dedupeKey: {
      type: String,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

securityEventSchema.index({ workspace: 1, createdAt: -1 });
securityEventSchema.index({ workspace: 1, status: 1, severity: 1 });
securityEventSchema.index({ link: 1, createdAt: -1 });
securityEventSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);
securityEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * security.eventRetentionDays }
);

export default mongoose.model('SecurityEvent', securityEventSchema);
