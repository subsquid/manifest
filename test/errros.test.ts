import { ManifestParsingError } from '../src';

describe('Errors', () => {
  describe('ManifestParsingError', () => {
    it('should add numbers to numbers to each detail and 2 spaces padding', () => {
      expect(new ManifestParsingError(['line1', 'line2']).message).toEqual(
        [
          //
          `Validation error occurred:`,
          `  1) line1`,
          `  2) line2`,
          //
        ].join('\n'),
      );
    });
  });
});
