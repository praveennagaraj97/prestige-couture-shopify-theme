import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('header indicators render for the current route and do not animate during route sync', async()=>{
 const liquid=await readFile(new URL('../sections/site-header.liquid',import.meta.url),'utf8');
 const js=await readFile(new URL('../src/theme.js',import.meta.url),'utf8');
 assert.match(liquid,/data-nav-indicator/);
 assert.match(liquid,/data-nav-item/);
 assert.match(liquid,/active_nav_home/);
 assert.match(liquid,/request\.page_type == 'index'/);
 assert.match(liquid,/request\.page_type == 'collection' or request\.page_type == 'product'/);
 assert.match(liquid,/request\.path/);
 const nav=liquid.slice(liquid.indexOf('<nav class="hidden items-center justify-center'),liquid.indexOf('</nav>',liquid.indexOf('<nav class="hidden items-center justify-center')));
 assert.match(nav,/active_nav_home/);
 assert.match(nav,/active_nav_products/);
 assert.match(js,/data-nav-indicator/);
 assert.match(js,/aria-current/);
 assert.match(js,/popstate/);
 assert.match(js,/indicator\.hidden=!active/);
 assert.doesNotMatch(js,/animate\(indicator/);
});
