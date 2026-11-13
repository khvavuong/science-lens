const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const vm = require('node:vm');
const fs = require('node:fs');

test('swiping autoplays a fixed voice; stale completions and blurred screens stay silent', async () => {
  const slots = []; let cursor = 0, effects = [], focused = true, spoken = [];
  const same = (a,b) => a && b && a.length === b.length && a.every((v,i) => Object.is(v,b[i]));
  const react = {
    useState(init) { const i=cursor++; slots[i] ??= { value: typeof init === 'function' ? init() : init }; return [slots[i].value, v => { slots[i].value = typeof v === 'function' ? v(slots[i].value) : v; }]; },
    useRef(value) { const i=cursor++; return slots[i] ??= {current:value}; },
    useCallback(fn,deps) { const i=cursor++; if (!same(slots[i]?.deps,deps)) slots[i]={fn,deps}; return slots[i].fn; },
    useEffect(fn,deps) { const i=cursor++; if (!same(slots[i]?.deps,deps)) { effects.push(() => { slots[i]?.cleanup?.(); slots[i]={deps,cleanup:fn()}; }); } },
  };
  const speech = { stop: async () => {}, getAvailableVoicesAsync: async () => [{language:'vi-VN',identifier:'fixed-vietnamese'}], speak: (text,options) => spoken.push({text,options}) };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/lib/useNarration.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code, {exports,require: id => id==='react' ? react : id==='expo-router' ? {useIsFocused:()=>focused} : id==='expo-audio' ? {setAudioModeAsync:async()=>{}} : speech});
  const render = async (key,url) => { cursor=0; const result=exports.useNarration({key,url,chunks:[`scene ${key}`,`end ${key}`],autoplay:true,muted:false}); const pending=effects;effects=[];pending.forEach(fn=>fn()); await new Promise(r=>setImmediate(r)); return result; };
  await render(0); assert.equal(spoken.at(-1).text,'scene 0');
  const stale = spoken.at(-1).options.onDone;
  const first = await render(0); first.pause();
  await render(1,'https://example.com/new-cloud-voice.wav');
  assert.equal(spoken.at(-1).text,'scene 1');
  assert.ok(spoken.every(s=>s.options.voice==='fixed-vietnamese'));
  const count=spoken.length; stale(); assert.equal(spoken.length,count);
  await render(1,'https://example.com/late-voice.wav'); assert.equal(spoken.length,count);
  focused=false; await render(1); spoken.at(-1).options.onDone(); assert.equal(spoken.length,count);
  focused=true; await render(2); assert.equal(spoken.at(-1).text,'scene 2');
});
