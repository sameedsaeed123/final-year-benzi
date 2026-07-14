/** Shared mood label ↔ sentiment mapping for dashboard + analytics. */

export const MANUAL_MOOD_LABELS = ['Happy', 'Good', 'Normal', 'Bad', 'Awful']

const MOOD_TO_SCORE = {
  Happy: 0.85,
  Good: 0.5,
  Normal: 0,
  Bad: -0.5,
  Awful: -0.9,
}

export function moodLabelToSentiment(moodLabel) {
  const score = MOOD_TO_SCORE[moodLabel] ?? 0
  const label = score > 0.05 ? 'positive' : score < -0.05 ? 'negative' : 'neutral'
  return { score, label }
}

export function sentimentLabelToMoodChip(sentimentLabel) {
  if (sentimentLabel === 'positive') return 'Good'
  if (sentimentLabel === 'negative') return 'Bad'
  return 'Normal'
}

export function isValidManualMood(label) {
  return MANUAL_MOOD_LABELS.includes(label)
}
