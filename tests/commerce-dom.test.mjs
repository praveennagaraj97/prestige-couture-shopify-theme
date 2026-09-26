import {test} from 'node:test';
import assert from 'node:assert/strict';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function environment(){
 const listeners=new Map();let cards=[],section=null;
 const document={documentElement:{lang:'en'},querySelectorAll(selector){return selector==='[data-product-card]'?cards:[];},querySelector(selector){return selector==='[data-collection-section]'?section:null;},addEventListener(name,handler){listeners.set(name,handler);},dispatchEvent(){}};
 globalThis.document=document;globalThis.window={Shopify:{routes:{root:'/'}},addEventListener(){},matchMedia:()=>({matches:true}),KW:{}};globalThis.location={href:'https://example.com/collections/all?sort_by=best-selling'};globalThis.history={pushState(){},replaceState(){}};globalThis.CustomEvent=class{constructor(type,options){this.type=type;Object.assign(this,options);}};
 return {listeners,setCards(value){cards=value;},setSection(value){section=value;}};
}
function card(){const label={textContent:''};const button={dataset:{addLabel:'Add to Bag',viewLabel:'View Bag',available:'true'},querySelector:()=>label};return {dataset:{productId:'12'},querySelector(selector){return selector==='[data-card-action]'?button:null;},button,label};}
test('AJAX replacement cards synchronize existing cart membership before accepting another add',async()=>{
 const env=environment();globalThis.fetch=async()=>({ok:true,json:async()=>({items:[{product_id:12,variant_id:31}],item_count:1})});
 const {initializeCommerce}=await import('../src/commerce.js?membership');initializeCommerce();await tick();
 const replacement=card();env.setCards([replacement]);initializeCommerce();
 assert.equal(replacement.button.dataset.inCart,'true');assert.equal(replacement.label.textContent,'View Bag');
});
test('collection replacement waits for open modal closure before detaching its section',async()=>{
 const env=environment();let closed=false,detachedAfterClose=false;let done;const replaced=new Promise(resolve=>done=resolve);
 const modal={hidden:false};const replacement={};const section={dataset:{collectionSection:'main'},setAttribute(){},removeAttribute(){},querySelectorAll:()=>[modal],replaceWith(){detachedAfterClose=closed;env.setSection(null);done();}};env.setSection(section);
 window.KW.closeModal=async(node)=>{assert.equal(node,modal);await tick();closed=true;};globalThis.DOMParser=class{parseFromString(){return {querySelector:()=>replacement};}};
 globalThis.fetch=async(url)=>String(url).endsWith('cart.js')?{ok:true,json:async()=>({items:[],item_count:0})}:{ok:true,text:async()=>'<section></section>'};
 const {initializeCommerce}=await import('../src/commerce.js?modal');initializeCommerce();await tick();
 const target={value:'price-ascending',matches:selector=>selector==='[data-sort]',closest:()=>null};env.listeners.get('change')({target});await replaced;
 assert.equal(detachedAfterClose,true,'modal cleanup must finish while its section is connected');
});
test('variant image selection resolves a deep link and tolerates image query differences',async()=>{
 const {findVariantImageIndex}=await import('../src/commerce.js?images');
 assert.equal(typeof findVariantImageIndex,'function');
 const variants=[{id:2,image:'https://cdn.example.com/blue.jpg?width=1600&v=1'}];
 assert.equal(findVariantImageIndex(variants,'2',['https://cdn.example.com/red.jpg?width=1600','https://cdn.example.com/blue.jpg?v=1&width=1600']),1);
 assert.equal(findVariantImageIndex(variants,'3',['https://cdn.example.com/red.jpg']),0);
});
