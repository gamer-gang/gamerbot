/* eslint-disable @typescript-eslint/method-signature-style */
declare module 'piston-client' {
  export interface PistonApi {
    runtimes(): Promise<Runtime[]>
    execute(language: string, code: string, config?: ExecuteOptions): Promise<ExecuteResult>
    execute(config: ExecuteOptionsRequired): Promise<ExecuteResult>
  }

  declare const piston: (options?: PistonOptions) => PistonApi
  export default piston

  export interface PistonOptions {
    /**
     * Piston server to use. Defaults to `https://emkc.org`.
     */
    server?: string
  }

  export interface ExecuteOptions {
    /**
     * The language to use for execution; must be installed.
     */
    language?: string
    /**
     * The version of the language to use for execution, must be a string
     * containing a SemVer selector for the version or the specific version
     * number to use.
     */
    version?: string
    /**
     * An array of files containing code or other data that should be used for
     * execution. The first file in this array is considered the main file.
     */
    files?: File[]
    /**
     * The text to pass as stdin to the program. Defaults to blank
     * string.
     */
    stdin?: string
    /**
     * The arguments to pass to the program. Defaults to `[]`.
     */
    args?: string[]
    /**
     * The maximum time allowed for the compile stage to finish before bailing
     * out in milliseconds. Defaults to `10000` (10 seconds)
     */
    compileTimeout?: number
    /**
     * The maximum time allowed for the run stage to finish before bailing out
     * in milliseconds. Defaults to `3000` (3 seconds).
     */
    runTimeout?: number
    /**
     * The maximum amount of memory the compile stage is allowed to use in
     * bytes. Defaults to `-1` (no limit)
     */
    compileMemoryLimit?: number
    /**
     * The maximum amount of memory the run stage is allowed to use in bytes.
     * Defaults to -1 (no limit)
     */
    runMemoryLimit?: number
  }

  export interface ExecuteOptionsRequired extends ExecuteOptions {
    language: string
    version: string
    files: File[]
  }

  export interface Runtime {
    language: string
    version: string
    aliases: string[]
    runtime?: string
  }

  export type FileEncoding = 'base64' | 'hex' | 'utf8'
  export interface File {
    /**
     * The name of the file to upload, must be a string containing no path or left out.
     */
    name?: string
    /**
     * The content of the files to upload.
     */
    content: string
    /**
     * The encoding scheme used for the file content. One of `base64`, `hex` or `utf8`. Defaults to `utf8`.
     */
    encoding?: FileEncoding
  }

  export interface ExecuteStageResult {
    stdout: string
    stderr: string
    output: string
    code: number
    signal: string | null
  }

  export type ExecuteResult = ExecuteSuccessResult | ExecuteErrorResult

  export interface ExecuteSuccessResult {
    language: string
    version: string
    compile?: ExecuteStageResult
    run: ExecuteStageResult
  }

  export interface ExecuteErrorResult {
    success: false
    error: Error
  }
}
