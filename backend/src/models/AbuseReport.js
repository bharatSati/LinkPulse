import mongoose from 'mongoose';

export const ABUSE_REASONS = [
  'spam',
  'phishing',
  'malware',
  'harassment',
  'impersonation',
  'misleading',
  'other',
];

export const ABUSE_REPORT_STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'];

const abuseReportSchema = new mongoose.Schema(
  {
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      enum: ABUSE_REASONS,
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ABUSE_REPORT_STATUSES,
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

abuseReportSchema.index({ workspace: 1, status: 1, createdAt: -1 });
abuseReportSchema.index({ link: 1, createdAt: -1 });

export default mongoose.model('AbuseReport', abuseReportSchema);
