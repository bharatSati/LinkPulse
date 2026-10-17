import mongoose from 'mongoose';
import env from '../config/env.js';

export const AI_INSIGHT_KINDS = ['insights', 'recommendations'];

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'insight' },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    evidence: { type: [String], default: [] },
    recommendation: { type: String, default: '' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const anomalySchema = new mongoose.Schema(
  {
    subtype: { type: String, default: 'spike' },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    evidence: { type: [String], default: [] },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    rule: { type: Object, default: {} },
    detectedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiInsightSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    kind: { type: String, enum: AI_INSIGHT_KINDS, required: true },
    model: { type: String, default: '' },
    rangeFrom: { type: Date, required: true },
    rangeTo: { type: Date, required: true },
    rangeDays: { type: Number, default: 0 },
    dataSignature: { type: String, default: '' },
    metrics: { type: Object, default: {} },
    anomalies: { type: [anomalySchema], default: [] },
    items: { type: [itemSchema], default: [] },
    notice: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

aiInsightSchema.index({ workspace: 1, kind: 1, generatedAt: -1 });
aiInsightSchema.index(
  { generatedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * env.aiHistoryDays }
);

export default mongoose.model('AiInsight', aiInsightSchema);
