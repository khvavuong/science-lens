const assert = require('node:assert/strict');
const configure = require('./app.config');
const config = { name: 'LumosLens', ios: { bundleIdentifier: 'app.lumoslab' } };
delete process.env.SCANSCIENCE_SIDELOAD;
assert.equal(configure({ config }), config);
process.env.SCANSCIENCE_SIDELOAD = '1';
process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.254:8787';
const local = configure({ config });
assert.equal(local.ios.bundleIdentifier, config.ios.bundleIdentifier);
assert.deepEqual(local.ios.infoPlist.NSAppTransportSecurity.NSExceptionDomains, {
  '192.168.1.254': { NSExceptionAllowsInsecureHTTPLoads: true },
});
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
assert.deepEqual(configure({ config }).ios.infoPlist.NSAppTransportSecurity.NSExceptionDomains, {});
console.log('Sideload config checks passed');
