const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const vm = require('node:vm');
const fs = require('node:fs');
const exportsForTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'src/lib/captureCrop.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsForTest});
test('crop maps the viewfinder through a centered cover preview',()=>{
 for(const image of [{width:3024,height:4032},{width:4032,height:3024}]) {
  const viewport={width:430,height:932}; const c=exportsForTest.captureCrop(image,viewport);
  const scale=Math.max(viewport.width/image.width,viewport.height/image.height);
  assert.ok(Math.abs(c.width*scale-430*.68)<1);
  assert.ok(Math.abs(c.height*scale-430*.68/.9)<1);
  assert.ok(c.originX>=0 && c.originY>=0);
  assert.ok(c.originX+c.width<=image.width && c.originY+c.height<=image.height);
  assert.ok(Math.abs((c.originY+c.height/2)*scale-image.height*scale/2+40)<1);
 }
 assert.throws(()=>exportsForTest.captureCrop({width:0,height:0},{width:430,height:932}));
});
