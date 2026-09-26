import test from 'node:test';
import assert from 'node:assert/strict';
import {isActiveNavigationPath} from '../src/navigation.js';

test('navigation follows the current page and maps collection links to product routes',()=>{
 assert.equal(isActiveNavigationPath('/','/'),true);
 assert.equal(isActiveNavigationPath('/pages/contact','/pages/contact'),true);
 assert.equal(isActiveNavigationPath('/pages/contact','/pages/about'),false);
 assert.equal(isActiveNavigationPath('/collections/all','/collections/sarees'),true);
 assert.equal(isActiveNavigationPath('/collections/all','/products/indigo-kurti'),true);
 assert.equal(isActiveNavigationPath('/collections/all','/pages/contact'),false);
});
