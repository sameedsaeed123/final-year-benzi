import mongoose from 'mongoose'

const weeklySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: Number, default: 0 },
  },
  { _id: false }
)

const progressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    pct: { type: Number, default: 0 },
  },
  { _id: false }
)

const reportSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    weekly: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 },
  },
  { _id: false }
)

const patientAiStatsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    taskScore: { type: Number, default: 0 },
    weeklyTaskProgress: { type: [weeklySchema], default: [] },
    progressCenterPct: { type: Number, default: 0 },
    progressBars: { type: [progressSchema], default: [] },
    reportLines: { type: [reportSchema], default: [] },
  },
  { timestamps: true }
)

export const PatientAiStats = mongoose.model('PatientAiStats', patientAiStatsSchema)
