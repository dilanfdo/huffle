const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Wires an upload keystore into the generated Android release build without
 * committing secrets. Reads, in order: HUFFLE_KEYSTORE_* env vars, or the
 * properties file at $HUFFLE_SIGNING_FILE (default ~/.huffle-signing/keystore.properties).
 * When neither exists the release build falls back to the debug keystore so
 * local smoke builds still work; Play uploads must use the real key.
 */
const BLOCK = `
def huffleSigningFile = new File(System.getenv('HUFFLE_SIGNING_FILE') ?: "\${System.getProperty('user.home')}/.huffle-signing/keystore.properties")
def huffleSigning = new Properties()
if (huffleSigningFile.exists()) {
    huffleSigningFile.withInputStream { huffleSigning.load(it) }
}
`;

const RELEASE_SIGNING = `
        release {
            if (huffleSigning.getProperty('storeFile')) {
                storeFile file(huffleSigning.getProperty('storeFile'))
                storePassword huffleSigning.getProperty('storePassword')
                keyAlias huffleSigning.getProperty('keyAlias')
                keyPassword huffleSigning.getProperty('keyPassword')
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let src = mod.modResults.contents;
    if (src.includes('huffleSigningFile')) {
      return mod;
    }
    src = src.replace(/\nandroid \{/, `${BLOCK}\nandroid {`);
    src = src.replace(/signingConfigs \{\n(\s*)debug \{/, `signingConfigs {${RELEASE_SIGNING}\n$1debug {`);
    src = src.replace(
      /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release',
    );
    mod.modResults.contents = src;
    return mod;
  });
};
