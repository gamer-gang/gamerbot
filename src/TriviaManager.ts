import axios from 'axios'
import { Logger } from 'log4js'
import { URLSearchParams } from 'node:url'
import { GamerbotClient } from './GamerbotClient.js'
import {
  CategoriesResponse,
  TokenRequestResponse,
  TokenResetResponse,
  TriviaOptions,
  TriviaResponse,
  TriviaResponseType,
} from './types/trivia.js'

export class TriviaManager {
  #token?: string
  logger: Logger

  constructor(public readonly client: GamerbotClient) {
    void this.#requestToken()
    this.logger = this.client.getLogger('trivia')
  }

  async #requestToken(): Promise<boolean> {
    const data = (await axios.get('https://opentdb.com/api_token.php?command=request'))
      .data as TokenRequestResponse
    if (data.response_code !== 0) {
      this.logger.error(`Failed retrieving trivia session token: ${data.response_message}`)
      throw new Error(`Requesting token: ${data.response_message}`)
    }

    this.#token = data.token
    return true
  }

  async resetToken(): Promise<boolean> {
    const data = (
      await axios.get(`https://opentdb.com/api_token.php?command=reset&token=${this.#token}`)
    ).data as TokenResetResponse

    if (data.response_code !== 0) {
      this.logger.warn('Failed resetting trivia session token, getting new one instead')
      return await this.#requestToken()
    }

    this.#token = data.token
    return true
  }

  static async getCategories(): Promise<CategoriesResponse['trivia_categories']> {
    const res = await axios.get('https://opentdb.com/api_category.php')
    const { trivia_categories: categories } = res.data as CategoriesResponse

    return categories
  }

  async fetchQuestion(options?: TriviaOptions): Promise<TriviaResponse> {
    const params = new URLSearchParams({ amount: '1' })
    if (options?.category) params.set('category', options.category.toString())
    if (options?.difficulty) params.set('difficulty', options.difficulty)
    if (options?.type) params.set('type', options.type)
    if (this.#token) params.set('token', this.#token)

    const url = `https://opentdb.com/api.php?${params.toString()}`

    const data = (await axios.get(url)).data as TriviaResponse

    switch (data.response_code) {
      case TriviaResponseType.QuestionsExhausted:
        await this.resetToken()
        return await this.fetchQuestion(options)
      case TriviaResponseType.InvalidToken:
        await this.#requestToken()
        return await this.fetchQuestion(options)
      case TriviaResponseType.InvalidParameters:
        throw new Error('Invalid category')
      case TriviaResponseType.NoResults:
        throw new Error(
          `Unexpected response code 1\nURL: ${url.replace(
            new RegExp(this.#token ?? '§', 'g'),
            '[TOKEN]'
          )}`
        )
      case TriviaResponseType.Success:
      default:
        return data
    }
  }
}
