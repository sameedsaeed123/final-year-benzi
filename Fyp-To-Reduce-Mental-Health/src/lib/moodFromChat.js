export function sentimentToMoodLabel(sentimentLabel) {
  if (sentimentLabel === 'positive') return 'Good'
  if (sentimentLabel === 'negative') return 'Bad'
  return 'Normal'
}

export const MOOD_LABELS = ['Happy', 'Good', 'Normal', 'Bad', 'Awful']
