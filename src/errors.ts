export class ManifestError extends Error {
  protected formatMessage(baseError: string, details: string[]): string {
    return [baseError + ':', ...details.map((v, i) => `  ${i + 1}) ${v}`)].join('\n');
  }
}

export class ManifestEvaluatingError extends ManifestError {
  constructor(details: string[] = []) {
    super();

    this.message = this.formatMessage('Evaluation error occurred', details);
  }
}

export class ManifestParsingError extends ManifestError {
  constructor(details: string[] = []) {
    super();

    this.message = this.formatMessage('Validation error occurred', details);
  }
}
