import { Image } from '@napi-rs/canvas'
import { Player } from 'hypixel-types'

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
  makeStats: (player: Player, avatar?: Image) => Promise<StatsProviderResponse>
}

export interface StatsProvider extends StatsProviderDef {
  name: string
}

export function statsProvider(name: string, def: StatsProviderDef): StatsProvider {
  return {
    ...def,
    name,
  }
}
