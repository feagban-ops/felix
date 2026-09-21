import { calculateLevel, getXPProgress } from './utils'

export interface GamificationResult {
  newXp: number
  newLevel: number
  levelUp: boolean
  cardsObtained: Array<{
    bottleId: string
    bottleName: string
    rarity: string
    isNew: boolean
    quantity: number
  }>
}

export function calculateGamification(
  currentXp: number,
  bottles: Array<{ id: string; name: string; rarity: string; baseXp: number; quantity: number }>,
  existingCards: Map<string, number>
): GamificationResult {
  let totalXpGained = 0
  const cardsObtained: GamificationResult['cardsObtained'] = []

  for (const bottle of bottles) {
    const xpGained = bottle.baseXp * bottle.quantity
    totalXpGained += xpGained

    const existingQuantity = existingCards.get(bottle.id) || 0
    const isNew = existingQuantity === 0
    const newQuantity = existingQuantity + bottle.quantity

    cardsObtained.push({
      bottleId: bottle.id,
      bottleName: bottle.name,
      rarity: bottle.rarity,
      isNew,
      quantity: newQuantity,
    })
  }

  const newXp = currentXp + totalXpGained
  const oldLevel = calculateLevel(currentXp)
  const newLevel = calculateLevel(newXp)
  const levelUp = newLevel > oldLevel

  return {
    newXp,
    newLevel,
    levelUp,
    cardsObtained,
  }
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'commune':
      return 'from-gray-400 to-gray-600'
    case 'rare':
      return 'from-blue-400 to-blue-600'
    case 'epique':
      return 'from-purple-400 to-purple-600'
    case 'legendaire':
      return 'from-yellow-400 to-orange-500'
    default:
      return 'from-gray-400 to-gray-600'
  }
}

export function getRarityLabel(rarity: string): string {
  switch (rarity) {
    case 'commune':
      return 'Commune'
    case 'rare':
      return 'Rare'
    case 'epique':
      return 'Épique'
    case 'legendaire':
      return 'Légendaire'
    default:
      return rarity
  }
}
