export interface UrbanDictionaryResponse {
  list: UrbanDictionaryTerm[]
}

export interface UrbanDictionaryTerm {
  definition: string
  permalink: string
  thumbs_up: number
  author: string
  word: string
  defid: number
  current_vote: string
  written_on: string
  example: string
  thumbs_down: number
}
