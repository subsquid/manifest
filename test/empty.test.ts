import { Manifest } from '../src';

describe('Empty', () => {
  it('should return empty version and squid name', () => {
    const m = new Manifest({});
    expect(m.squidName()).toBeUndefined();
    expect(m.versionName()).toBeUndefined();
    expect(m.values()).toEqual({});
    expect(m.hasError()).toBeTruthy();
    expect(m.toYaml()).toEqual('{}\n');
  });

  it('should parse unknown manifest', () => {
    const m = Manifest.parse(undefined as unknown as string);
    expect(m.squidName()).toBeUndefined();
    expect(m.versionName()).toBeUndefined();
    expect(m.values()).toEqual({});
    expect(m.hasError()).toBeTruthy();
    expect(m.toYaml()).toEqual('{}\n');
  });

  it('should parse null manifest', () => {
    const m = new Manifest(null as any);
    expect(m.squidName()).toBeUndefined();
    expect(m.versionName()).toBeUndefined();
    expect(m.values()).toEqual({});
    expect(m.hasError()).toBeTruthy();
    expect(m.toYaml()).toEqual('{}\n');
  });
});
