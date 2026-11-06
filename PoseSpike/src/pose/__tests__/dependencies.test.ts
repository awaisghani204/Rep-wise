// Requirement 1.4 / 10.3: runtime dependencies stay limited to the spike's allow-list.
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_EXACT = new Set([
  'expo',
  'react',
  'react-native',
  'react-native-vision-camera',
  'react-native-worklets-core',
  'react-native-svg',
  'expo-dev-client',
  'pose-landmarker',
]);

/** True when a runtime dependency name is on the allow-list (Expo packages match by prefix). */
function isAllowed(name: string): boolean {
  return ALLOWED_EXACT.has(name) || name.startsWith('expo-');
}

describe('runtime dependency allow-list', () => {
  it('declares only allowed runtime dependencies', () => {
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    const names = Object.keys(pkg.dependencies ?? {});
    const disallowed = names.filter((n) => !isAllowed(n));

    if (disallowed.length > 0) {
      throw new Error(`Disallowed runtime dependencies: ${disallowed.join(', ')}`);
    }
    expect(disallowed).toEqual([]);
  });

  it('allows pose-landmarker and expo-* packages without requiring them', () => {
    expect(isAllowed('pose-landmarker')).toBe(true);
    expect(isAllowed('expo-status-bar')).toBe(true);
    expect(isAllowed('axios')).toBe(false);
    expect(isAllowed('@react-native-async-storage/async-storage')).toBe(false);
  });
});
