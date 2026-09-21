import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateLevel(xp: number): number {
  return 1 + Math.floor(Math.sqrt(xp / 100))
}

export function getXPForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100
}

export function getXPProgress(xp: number): { current: number; target: number; progress: number } {
  const level = calculateLevel(xp)
  const currentLevelXP = getXPForLevel(level)
  const nextLevelXP = getXPForLevel(level + 1)
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  
  return {
    current: xp - currentLevelXP,
    target: nextLevelXP - currentLevelXP,
    progress: Math.min(100, Math.max(0, progress)),
  }
}
