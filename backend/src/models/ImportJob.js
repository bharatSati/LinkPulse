import mongoose from 'mongoose';

const rowErrorSchema = new mongoose.Schema(
  {
    row: { type: Number, required: true },
    message: { type: String, required: true },
  },
  { _id: false }
);

const importJobSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255,
    },
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    totalRows: { type: Number, default: 0, min: 0 },
    importedCount: { type: Number, default: 0, min: 0 },
    failedCount: { type: Number, default: 0, min: 0 },
    skippedCount: { type: Number, default: 0, min: 0 },
    rowErrors: { type: [rowErrorSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

importJobSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('ImportJob', importJobSchema);
