// Shared types used by page.tsx and components

export type CustomerType = 'normal' | 'impatient' | 'allergic' | 'regular' | 'hungry' | 'vip' | 'boss'

export interface CustomerOrder {
  ingredients: string[]
  spiceLevel: string
  customerEmoji: string
  customerName: string
  customerType: CustomerType
  forbiddenIngredients: string[]
}
