import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('header indicators start hidden and are assigned from the current route at startup', async()=>{
 const liquid=await readFile(new URL('../sections/site-header.liquid',import.meta.url),'utf8');
 const js=await readFile(new URL('../src/theme.js',import.meta.url),'utf8');
 assert.match(liquid,/data-nav-indicator/);
 assert.match(liquid,/data-nav-item/);
 const nav=liquid.slice(liquid.indexOf('<nav class="hidden items-center justify-center'),liquid.indexOf('</nav>',liquid.indexOf('<nav class="hidden items-center justify-center')));
 assert.doesNotMatch(nav,/class="[^"]* text-rust"/);
 assert.match(js,/data-nav-indicator/);
 assert.match(js,/aria-current/);
 assert.match(js,/popstate/);
});
