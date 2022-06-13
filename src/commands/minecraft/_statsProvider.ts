import type { Image } from '@napi-rs/canvas'
import type { Player } from 'hypixel-types'

export interface StatsProviderResponse {
  uuid: string
  image: Buffer
  metadata: {
    height: number
    width: number
    bytes: number
    format: string
  }
}

interface StatsProviderDef {
  displayName?: string
  makeStats: (player: Player, avatar?: Image) => Promise<StatsProviderResponse>
}

export interface StatsProvider extends StatsProviderDef {
  name: string
  displayName: string
}

export function statsProvider(name: string, def: StatsProviderDef): StatsProvider {
  return {
    ...def,
    name,
    displayName: def.displayName ?? name,
  }
}
