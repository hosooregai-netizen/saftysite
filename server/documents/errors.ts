import 'server-only';

export class DocumentGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentGenerationError';
  }
}

export class DocumentTemplateNotFoundError extends DocumentGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentTemplateNotFoundError';
  }
}

export class DocumentGeneratorNotConfiguredError extends DocumentGenerationError {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentGeneratorNotConfiguredError';
  }
}

