/* oxlint-disable eslint/max-classes-per-file */

export type Printer = (message: LoggerMessage) => void

export interface LoggerOptions {
  silent?: boolean
  dryRun?: boolean
  verbose?: boolean
  printer?: Printer
}

export interface LoggerMessage {
  dryRun?: boolean
  stage: string
  message: unknown
}

function defaultPrinter({
  dryRun,
  stage,
  message
}: LoggerMessage) {
  // oxlint-disable-next-line eslint/no-console
  console.log(`${dryRun ? `[dry-run]` : ''}[${stage}]:`, message)
}

/**
 * A child messages logger that bounds to a specific stage.
 */
export class ChildLogger {
  /**
   * Creates a child logger instance.
   * @param parent - The parent logger to inherit options from.
   * @param stage - The stage of the process this logger is associated with.
   */
  constructor(
    public parent: Logger,
    public stage: string
  ) {}

  /**
   * Logs an info message.
   * @param message - The message to log.
   */
  info(message: unknown) {
    this.parent.info(this.stage, message)
  }

  /**
   * Logs a verbose message.
   * @param message - The message to log.
   */
  verbose(message: unknown) {
    this.parent.verbose(this.stage, message)
  }
}

/**
 * A messages logger.
 */
export class Logger {
  public readonly printer: Printer

  /**
   * Creates a logger instance.
   * @param options - The logger options.
   */
  constructor(
    public options: LoggerOptions = {}
  ) {
    const { printer = defaultPrinter } = options

    this.printer = printer
  }

  /**
   * Logs an info message.
   * @param stage - The stage of the process.
   * @param message - The message to log.
   */
  info(stage: string, message: unknown) {
    const {
      silent,
      dryRun
    } = this.options

    if (!silent) {
      this.printer({
        dryRun,
        stage,
        message
      })
    }
  }

  /**
   * Logs a verbose message.
   * @param stage - The stage of the process.
   * @param message - The message to log.
   */
  verbose(stage: string, message: unknown) {
    const {
      silent,
      verbose,
      dryRun
    } = this.options

    if (!silent && (verbose || dryRun)) {
      this.printer({
        dryRun,
        stage,
        message
      })
    }
  }

  /**
   * Creates a child logger for a specific stage.
   * @param stage - The stage of the process.
   * @returns A child logger for the specified stage.
   */
  createChild(stage: string) {
    return new ChildLogger(this, stage)
  }
}
