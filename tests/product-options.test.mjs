import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findVariantForOption} from '../src/product-options.js';

test('selecting an option resolves the matching available variant while preserving other options',()=>{
 const variants=[
  {id:1,options:['S','Cotton'],available:true},
  {id:2,options:['M','Cotton'],available:true},
  {id:3,options:['S','Linen'],available:true},
  {id:4,options:['M','Linen'],available:false}
 ];
 assert.equal(findVariantForOption(variants,1,0,'M')?.id,2);
 assert.equal(findVariantForOption(variants,1,1,'Linen')?.id,3);
 assert.equal(findVariantForOption(variants,2,1,'Linen'),null);
});
