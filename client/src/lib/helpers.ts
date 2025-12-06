export function getClassificationColor(classification: string): string {
  switch(classification) {
    case 'fake':
      return 'text-red-600 dark:text-red-400'
    case 'misleading':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'real':
      return 'text-green-600 dark:text-green-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

export function getClassificationBgColor(classification: string): string {
  switch(classification) {
    case 'fake':
      return 'bg-red-500'
    case 'misleading':
      return 'bg-yellow-500'
    case 'real':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

export function getCredibilityLevelColor(level: string): string {
  switch(level) {
    case 'high':
      return 'text-green-600 dark:text-green-400'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'low':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

export function getSentimentColor(sentiment?: string, score?: number): string {
  if (!sentiment || !score) return 'text-gray-600 dark:text-gray-400'
  
  if (score > 0.7) {
    return sentiment === 'Positive' 
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
  }
  
  return 'text-yellow-600 dark:text-yellow-400'
}
