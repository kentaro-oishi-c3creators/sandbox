import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
await mkdir('test-results',{recursive:true});const results=[];
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[],failedRequests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failedRequests.push(r.url()));
    const response=await page.goto(process.env.BASE_URL||'http://127.0.0.1:4175/');assert.equal(response.status(),200);
    await page.waitForFunction(()=>window.todaijiDebug?.().triangles>0);
    const debug=await page.evaluate(()=>window.todaijiDebug());
    assert.equal(debug.version,2.2);assert.equal(debug.webgl2,true);assert.equal(debug.animals+debug.people+debug.statues,0);
    assert.ok(Math.abs(debug.gateHeight-25.46)<.001);assert.equal(debug.eyeHeight,1.65);
    for(const [i,n]of [57.012,48.742,50.480].entries())assert.ok(Math.abs(debug.hallDimensions[i]-n)<.01);
    assert.ok(debug.routeLength>600&&debug.routeLength<800);
    assert.ok(debug.landmarkPositions.pond[0]>debug.landmarkPositions.nandaimon[0]);
    await page.screenshot({path:`test-results/entrance-${viewport.width}.png`});
    const idle=await page.evaluate(()=>window.todaijiDebug().renderCount);await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>window.todaijiDebug().renderCount),idle);
    await page.locator('#walk').click();
    await page.waitForFunction(()=>window.todaijiDebug().progress>.002);
    await page.locator('#walk').click();const paused=await page.evaluate(()=>window.todaijiDebug().progress);
    await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.todaijiDebug().progress),paused);
    const ts=await page.locator('[data-stop]').evaluateAll(bs=>bs.map(b=>b.dataset.stop));
    for(const [t,name]of [[ts[1],'南大門'],[ts[2],'鏡池・中門'],['1','大仏殿・前庭']]){
      await page.locator(`[data-stop="${t}"]`).click();
      await page.waitForFunction(v=>Math.abs(window.todaijiDebug().progress-v)<.0001,Number(t));
      assert.equal(await page.locator('#location-name').textContent(),name);
      await page.screenshot({path:`test-results/${t==='1'?'hall':name==='南大門'?'nandaimon':'chumon'}-${viewport.width}.png`});
    }
    assert.equal(await page.evaluate(()=>window.todaijiDebug().arrived),true);
    await page.locator('#progress').fill('50');assert.equal(await page.evaluate(()=>window.todaijiDebug().progress),.5);
    await page.locator('#overview').click();assert.equal(await page.evaluate(()=>window.todaijiDebug().overview),true);
    await page.locator('#overview').click();assert.equal(await page.evaluate(()=>window.todaijiDebug().overview),false);
    const yaw=await page.evaluate(()=>window.todaijiDebug().yawOffset);
    await page.mouse.move(viewport.width*.5,viewport.height*.45);await page.mouse.down();await page.mouse.move(viewport.width*.65,viewport.height*.43,{steps:5});await page.mouse.up();
    assert.notEqual(await page.evaluate(()=>window.todaijiDebug().yawOffset),yaw);
    await page.locator('canvas').focus();await page.keyboard.down('w');await page.waitForFunction(()=>window.todaijiDebug().progress>.5);await page.keyboard.up('w');
    await page.locator('#speed').selectOption('2.4');
    await page.locator('#reset').click();assert.equal(await page.evaluate(()=>window.todaijiDebug().progress),0);
    await page.locator('#quality').click();assert.equal(await page.evaluate(()=>window.todaijiDebug().highQuality),true);
    await page.locator('#quality').click();
    await page.locator('#about-open').click();assert.equal(await page.locator('#about').evaluate(d=>d.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#about').evaluate(d=>d.open),false);
    if(viewport.width<760){
      const b=await page.locator('#forward').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForFunction(()=>window.todaijiDebug().progress>0);await page.mouse.up();
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);
    results.push({viewport,debug,errors,failedRequests,status:'passed'});await context.close();
  }
  const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();await page.goto(process.env.BASE_URL||'http://127.0.0.1:4175/');await page.waitForFunction(()=>window.todaijiDebug);assert.equal(await page.evaluate(()=>window.todaijiDebug().walking),false);await context.close();
  results.push({reducedMotion:true,status:'passed'});await writeFile('test-results/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
