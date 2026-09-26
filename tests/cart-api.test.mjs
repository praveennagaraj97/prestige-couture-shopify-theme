import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCartAPI} from '../src/cart-api.js';
const response=(body,ok=true)=>({ok,json:async()=>body});
test('serializes mutations and recovers the queue after a rejected write',async()=>{
 let active=0,max=0,n=0; const seen=[];
 const api=createCartAPI({root:'/fr/',fetch:async(url,opts)=>{seen.push(url); if(url.endsWith('cart.js'))return response({items:[],item_count:n}); active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,5));active--;n++;return response(n===1?{description:'Sold out'}:{},n!==1)}});
 const results=await Promise.allSettled([api.add(1),api.add(2)]);
 assert.equal(results[0].status,'rejected');assert.equal(results[0].reason.message,'Sold out');assert.equal(results[1].status,'fulfilled');assert.equal(max,1);assert.ok(seen.every(x=>x.startsWith('/fr/')));
});
test('variant swap rolls back added quantity if removing original fails',async()=>{
 let items=[{key:'old',variant_id:1,quantity:2,properties:{gift:'yes'}}];
 const api=createCartAPI({fetch:async(url,opts)=>{const b=opts?.body?JSON.parse(opts.body):{};
 if(url.endsWith('cart.js'))return response({items:structuredClone(items)});
 if(url.endsWith('add.js')){items.push({key:'new',variant_id:2,quantity:b.items[0].quantity});return response({});}
 if(b.id==='old')return response({description:'Remove failed'},false);
 items=items.filter(x=>x.key!==b.id);return response({items}); }});
 await assert.rejects(api.swap('old',2),/Remove failed/);assert.deepEqual(items,[{key:'old',variant_id:1,quantity:2,properties:{gift:'yes'}}]);
});
test('quantity writes use line keys and validated integer quantities',async()=>{
 let payload;const api=createCartAPI({fetch:async(url,opts)=>{if(opts?.body)payload=JSON.parse(opts.body);return response({items:[]})}});
 await assert.rejects(api.change('line:key',-1),/quantity/i);await api.change('line:key',0);assert.equal(payload.id,'line:key');assert.equal(payload.quantity,0);
});
test('HTML server errors never leak into customer-facing errors',async()=>{
 const api=createCartAPI({fetch:async()=>({ok:false,json:async()=>{throw Error('<html>')}})});
 await assert.rejects(api.add(1),e=>!e.message.includes('<html>'));
});
test('applied discount extraction retains product-specific codes and omits rejected codes',async()=>{
 const {applicableDiscountCodes}=await import('../src/cart-api.js');
 assert.equal(typeof applicableDiscountCodes,'function');
 assert.deepEqual(applicableDiscountCodes({discount_codes:[{code:'DRESS10',applicable:true},{code:'BAD',applicable:false},{code:'dress10',applicable:true}]}),['DRESS10']);
});
