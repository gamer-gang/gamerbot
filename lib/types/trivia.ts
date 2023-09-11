export interface CategoriesResponse {
  trivia_categories: Array<{
    id: number
    name: string
  }>
}

export interface TriviaOptions {
  category?: number | string
  type?: 'boolean' | 'multiple'
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface TriviaQuestion {
  category: string
  type: 'boolean' | 'multiple'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

export const enum TriviaResponseType {
  Success = 0,
  NoResults = 1,
  InvalidParameters = 2,
  InvalidToken = 3,
  QuestionsExhausted = 4,
}

export interface TriviaResponse {
  /**
   * #### Response Codes
   *
   * The API appends a "Response Code" to each API Call to help tell developers what the API is
   * doing.
   *
   * - Code 0: Success Returned results successfully.
   * - Code 1: No Results Could not return results. The API doesn't have enough questions for your
   *   query. (Ex. Asking for 50 Questions in a Category that only has 20.)
   * - Code 2: Invalid Parameter Contains an invalid parameter. Arguements passed in aren't valid.
   *   (Ex. Amount = Five)
   * - Code 3: Token Not Found Session Token does not exist.
   * - Code 4: Token Empty Session Token has returned all possible questions for the specified
   *   query. Resetting the Token is necessary.
   */
  response_code: 0 | 1 | 2 | 3 | 4
  results: TriviaQuestion[]
}

export interface TokenRequestResponse {
  response_code: number
  response_message: string
  token: string
}

export interface TokenResetResponse {
  response_code: number
  token: string
}
