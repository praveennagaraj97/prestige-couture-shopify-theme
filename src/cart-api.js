/** Shopify Ajax cart writes are serialized; only server-confirmed state is published. */
export function createCartAPI({fetch: request=globalThis.fetch,root=globalThis.Shopify?.routes?.root || '/',onUpdate=()=>{},errorMessage='We could not update your bag. Please try again.'}={}) {
 root=root.replace(/\/?$/,'/');let tail=Promise.resolve();
 const call=async(path,body)=>{let response,data;try{response=await request(root+path,{credentials:'same-origin',headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});data=await response.json();}catch{throw Error(errorMessage);}if(!response.ok)throw Error(typeof data.description==='string'?data.description:errorMessage);return data;};
 const read=()=>call('cart.js');
 const enqueue=(work)=>{const result=tail.then(async()=>{try{await work();const cart=await read();await onUpdate(cart);return cart;}catch(error){try{await onUpdate(await read());}catch{}throw error;}});tail=result.catch(()=>{});return result;};
 const validQuantity=(quantity)=>{if(!Number.isInteger(quantity)||quantity<0)throw Error('Invalid quantity');};
 return {read,add:(id,quantity=1,properties)=>enqueue(()=>{validQuantity(quantity);if(!quantity)throw Error('Invalid quantity');return call('cart/add.js',{items:[{id,quantity,...(properties?{properties}:{})}]});}),
 change:(key,quantity)=>enqueue(()=>{validQuantity(quantity);return call('cart/change.js',{id:key,quantity});}),
 discount:(codes)=>enqueue(()=>call('cart/update.js',{discount:codes.join(',')})),
 swap:(key,variantId)=>enqueue(async()=>{
  const before=await read(),line=before.items.find(item=>item.key===key);if(!line)throw Error(errorMessage);if(String(line.variant_id)===String(variantId))return;
  if(before.items.some(item=>item.key!==key&&String(item.variant_id)===String(variantId)))throw Error('That option is already in your bag.');
  const added=await call('cart/add.js',{items:[{id:variantId,quantity:line.quantity,properties:line.properties,...(line.selling_plan_allocation?{selling_plan:line.selling_plan_allocation.selling_plan.id}:{})}]});
  const addedLine=(Array.isArray(added.items)?added.items:[added]).find(item=>String(item.variant_id??item.id)===String(variantId));
  if(addedLine&&Number(addedLine.quantity)<line.quantity){if(addedLine.key)try{await call('cart/change.js',{id:addedLine.key,quantity:0});}catch{}throw Error(`Only ${addedLine.quantity} available. Your current option was kept.`);}
  try{await call('cart/change.js',{id:key,quantity:0});}catch(error){
   const current=await read();const originalKeys=new Map(before.items.map(item=>[item.key,item.quantity]));
   const added=current.items.find(item=>String(item.variant_id)===String(variantId)&&item.quantity>(originalKeys.get(item.key)||0));
   if(added){try{await call('cart/change.js',{id:added.key,quantity:originalKeys.get(added.key)||0});}catch{throw Error(errorMessage);}}
   throw error;
  }
 })};
}

/** Return cart state for instant quantity/count feedback while Shopify confirms prices. */
export function optimisticQuantity(cart,key,quantity){
 const current=cart.items.find(item=>item.key===key);if(!current)return cart;
 const delta=quantity-current.quantity;
 const items=quantity===0?cart.items.filter(item=>item.key!==key):cart.items.map(item=>item.key===key?{...item,quantity}:item);
 return {...cart,item_count:Math.max(0,(Number(cart.item_count)||0)+delta),items};
}

/** Ajax exposes all applied codes, including codes allocated to individual lines. */
export function applicableDiscountCodes(cart){
 const unique=new Map();for(const discount of cart.discount_codes||[]){if(discount.applicable&&!unique.has(discount.code.toLowerCase()))unique.set(discount.code.toLowerCase(),discount.code);}return [...unique.values()];
}
