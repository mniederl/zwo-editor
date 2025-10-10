export const Colors = {
  GRAY: '#807F80',
  BLUE: '#0E90D4',
  GREEN: '#00C46A',
  YELLOW: '#FFCB00',
  ORANGE: '#FF6430',
  RED: '#E90000',
  WHITE: '#FFFFFF'
} as const

type ZoneKey = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5' | 'Z6'

interface ZoneRange {
  min: number
  max: number
}

export const Zones: Record<ZoneKey, ZoneRange> = {
  Z1: { min: 0.1, max: 0.605 },
  Z2: { min: 0.605, max: 0.763 },
  Z3: { min: 0.763, max: 0.901 },
  Z4: { min: 0.901, max: 1.053 },
  Z5: { min: 1.053, max: 1.194 },
  Z6: { min: 1.194, max: 2.0 }
}

export const ZonesArray: [number, number][] = Object.values(Zones).map(
  ({ min, max }) => [min, max]
)
