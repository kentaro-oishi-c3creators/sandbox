import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
await mkdir('test-results',{recursive:true});const results=[];
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[],failedRequests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failedRequests.push(r.url()));
    const response=await page.goto(process.env.BASE_URL||'http://127.0.0.1:4174/');assert.equal(response.status(),200);
    await page.waitForFunction(()=>window.kasugaDebug?.().triangles>0);
    const debug=await page.evaluate(()=>window.kasugaDebug());
    assert.equal(debug.version,2);assert.equal(debug.webgl2,true);assert.equal(debug.animals+debug.people+debug.statues,0);
    assert.ok(Math.abs(debug.gateHeight-12)<.001);assert.equal(debug.eyeHeight,1.65);
    await page.screenshot({path:`test-results/entrance-${viewport.width}.png`});
    await page.locator('#walk').click();
    await page.waitForFunction(()=>window.kasugaDebug().progress>.002);
    await page.locator('#walk').click();const paused=await page.evaluate(()=>window.kasugaDebug().progress);
    await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.kasugaDebug().progress),paused);
    for(const [t,name]of [['0.38','森の参道'],['0.68','二之鳥居'],['1','春日大社・南門']]){
      await page.locator(`[data-stop="${t}"]`).click();
      await page.waitForFunction(v=>Math.abs(window.kasugaDebug().progress-v)<.0001,Number(t));
      assert.equal(await page.locator('#location-name').textContent(),name);
      if(t!=='0.38')await page.screenshot({path:`test-results/${t==='1'?'nanmon':'torii'}-${viewport.width}.png`});
    }
    assert.equal(await page.evaluate(()=>window.kasugaDebug().arrived),true);
    await page.locator('#progress').fill('50');assert.equal(await page.evaluate(()=>window.kasugaDebug().progress),.5);
    await page.locator('#overview').click();assert.equal(await page.evaluate(()=>window.kasugaDebug().overview),true);
    await page.locator('#overview').click();assert.equal(await page.evaluate(()=>window.kasugaDebug().overview),false);
    const yaw=await page.evaluate(()=>window.kasugaDebug().yawOffset);
    await page.mouse.move(viewport.width*.5,viewport.height*.45);await page.mouse.down();await page.mouse.move(viewport.width*.65,viewport.height*.43,{steps:5});await page.mouse.up();
    assert.notEqual(await page.evaluate(()=>window.kasugaDebug().yawOffset),yaw);
    await page.locator('canvas').focus();await page.keyboard.down('w');await page.waitForFunction(()=>window.kasugaDebug().progress>.5);await page.keyboard.up('w');
    await page.locator('#speed').selectOption('2.4');
    await page.locator('#reset').click();assert.equal(await page.evaluate(()=>window.kasugaDebug().progress),0);
    await page.locator('#quality').click();assert.equal(await page.evaluate(()=>window.kasugaDebug().highQuality),true);
    await page.locator('#quality').click();
    await page.locator('#about-open').click();assert.equal(await page.locator('#about').evaluate(d=>d.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#about').evaluate(d=>d.open),false);
    if(viewport.width<760){
      const b=await page.locator('#forward').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForFunction(()=>window.kasugaDebug().progress>0);await page.mouse.up();
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);
    results.push({viewport,debug,errors,failedRequests,status:'passed'});await context.close();
  }
  const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:4174/');await page.waitForFunction(()=>window.kasugaDebug);assert.equal(await page.evaluate(()=>window.kasugaDebug().walking),false);await context.close();
  results.push({reducedMotion:true,status:'passed'});await writeFile('test-results/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
