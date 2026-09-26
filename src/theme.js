import {leftIcon,rightIcon} from './icons.js';
import {animate, inView} from 'motion';
import {initializeForms} from './forms.js';
import {initializeCommerce} from './commerce.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const initialized=new WeakSet(), cleanups=new Map();
const $all=(selector,root=document)=>[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
const ease=[.22,1,.36,1];
function register(root,cleanup){const key=root.closest?.('.shopify-section')||root;(cleanups.get(key)||cleanups.set(key,[]).get(key)).push(cleanup);}
function frames(value={}){const {transition,...rest}=value;return rest;}
function runMotion(el,spec,instant=false){
 const end=frames(spec.animate);if(!Object.keys(end).length)return;
 if(instant||reduced.matches){animate(el,end,{duration:0});return;}
 const start=frames(spec.initial);if(Object.keys(start).length)animate(el,start,{duration:0});
 const transition=spec.transition||spec.animate?.transition||{};
 const opts={...transition};delete opts.staggerChildren;delete opts.delayChildren;
 const controls=animate(el,end,opts);register(el,()=>controls.cancel());
}
function motions(root){
 $all('[data-motion]',root).forEach(el=>{
  if(initialized.has(el)||el.closest('[data-modal][hidden]'))return;initialized.add(el);
  let spec;try{spec=JSON.parse(el.dataset.motion);}catch{return;}
  if(spec.inView&&!reduced.matches){if(Object.keys(frames(spec.initial)).length)animate(el,frames(spec.initial),{duration:0});const stop=inView(el,()=>{runMotion(el,spec);},{amount:spec.viewport?.amount==='some'?0:spec.viewport?.amount??.2});register(el,stop);}else runMotion(el,spec);
  if(spec.hover&&!reduced.matches){const original={};for(const key of Object.keys(spec.hover))original[key]=spec.animate?.[key]??(key==='scale'?1:0);el.addEventListener('pointerenter',()=>animate(el,frames(spec.hover),{duration:.2}));el.addEventListener('pointerleave',()=>animate(el,original,{duration:.2}));}
  if(spec.tap&&!reduced.matches){el.addEventListener('pointerdown',()=>animate(el,frames(spec.tap),{duration:.1}));const reset=()=>animate(el,frames(spec.animate),{duration:.18});el.addEventListener('pointerup',reset);el.addEventListener('pointercancel',reset);}
 });
}
const openModals=[];let savedOverflow='',savedFocus=null;
function panelFor(modal){return modal.querySelector('[data-modal-panel]')||modal.querySelector('[role=dialog]')||modal.firstElementChild;}
export function openModal(id){
 const modal=document.querySelector(`[data-modal="${CSS.escape(id)}"]`);if(!modal)return;
 if(!modal.hidden&&openModals.includes(modal))return;
 if(!openModals.length){savedOverflow=document.body.style.overflow;savedFocus=document.activeElement;document.body.style.overflow='hidden';}
 modal.hidden=false;openModals.push(modal);modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 const panel=panelFor(modal);const mobile=innerWidth<640,variant=modal.dataset.modalVariant||'bubble';
 const from=variant==='fullscreen'?{opacity:0}:variant==='bottom'?{opacity:0,y:'100%'}:variant==='navigation'?{x:'100%'}:variant==='search'?{opacity:0,y:-18}:mobile?{opacity:0,y:'100%'}:{opacity:0,x:40,scale:.96};
 animate(modal,{opacity:[0,1]},{duration:reduced.matches?0:.2});
 if(panel){animate(panel,from,{duration:0});animate(panel,{opacity:1,x:0,y:0,scale:1},{duration:reduced.matches?0:variant==='search'?.45:variant==='navigation'?.3:.35,ease:variant==='navigation'?[.22,.7,.36,.7]:ease});}
 motions(modal);const target=modal.querySelector('input:not([type=hidden]),button,a[href],select,[tabindex]');(target||modal).focus({preventScroll:true});
 document.querySelectorAll(`[data-open-modal="${CSS.escape(id)}"]`).forEach(el=>el.setAttribute('aria-expanded','true'));
 document.dispatchEvent(new CustomEvent('kw:modal-open',{detail:{id,modal}}));
}
export async function closeModal(modal=openModals.at(-1)){
 if(!modal||modal.dataset.closing)return;modal.dataset.closing='true';
 const panel=panelFor(modal),variant=modal.dataset.modalVariant||'bubble';
 const end=variant==='fullscreen'?{opacity:0}:variant==='bottom'?{opacity:0,y:'100%'}:variant==='navigation'?{x:'100%'}:variant==='search'?{opacity:0,y:-18}:innerWidth<640?{opacity:0,y:'100%'}:{opacity:0,x:40,scale:.96};
 await Promise.all([animate(modal,{opacity:0},{duration:reduced.matches?0:.2}),panel?animate(panel,end,{duration:reduced.matches?0:variant==='search'?.25:.35,ease:variant==='navigation'?[.64,0,.78,0]:ease}):Promise.resolve()]);
 modal.hidden=true;delete modal.dataset.closing;const index=openModals.indexOf(modal);if(index>=0)openModals.splice(index,1);
 document.querySelectorAll(`[data-open-modal="${CSS.escape(modal.dataset.modal)}"]`).forEach(el=>el.setAttribute('aria-expanded','false'));
 if(!openModals.length){document.body.style.overflow=savedOverflow;savedFocus?.focus?.({preventScroll:true});}
}
function accordions(root){
 $all('[data-accordion]',root).forEach(el=>{if(initialized.has(el))return;initialized.add(el);const button=el.querySelector('button'),body=el.querySelector('[data-accordion-body]'),icon=el.querySelector('[data-accordion-icon]');if(!button||!body)return;
 const initial=el.dataset.defaultOpen==='true';body.hidden=!initial;button.setAttribute('aria-expanded',String(initial));
 button.addEventListener('click',async()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));el.classList.toggle('ring-rust/40',open);el.classList.toggle('ring-strong-coffee/10',!open);if(icon)animate(icon,{rotate:open?45:0},{duration:reduced.matches?0:.25,ease:'easeOut'});if(open){body.hidden=false;animate(body,{height:[0,body.scrollHeight],opacity:[0,1]},{duration:reduced.matches?0:.35,ease}).then(()=>{body.style.height='auto';});}else{await animate(body,{height:0,opacity:0},{duration:reduced.matches?0:.3,ease});body.hidden=true;}});
 });
}
function carousels(root){
 $all('[data-carousel],.no-scrollbar.snap-x',root).forEach(el=>{
  if(initialized.has(el)||el.matches('.no-scrollbar')&&el.closest('[data-carousel],[data-gallery]'))return;initialized.add(el);
  const track=el.querySelector('[data-carousel-track]')||el;
  let prev=el.querySelector('[data-carousel-prev]'),next=el.querySelector('[data-carousel-next]');
  if(!prev&&!next&&!el.closest('.home-products')){
   const host=el.parentElement;host.classList.add('kw-carousel-host');
   for(const [dir,label] of [[-1,window.KW.labels.previous],[1,window.KW.labels.next]]){const button=document.createElement('button');button.type='button';button.className=`kw-carousel-arrow kw-carousel-${dir<0?'prev':'next'}`;button.setAttribute('aria-label',label);button.innerHTML=dir<0?leftIcon:rightIcon;host.append(button);register(el,()=>button.remove());if(dir<0)prev=button;else next=button;}
  }
  const states=new WeakMap(),controls=new WeakMap();
  const visibility=(button,visible)=>{if(!button||states.get(button)===visible)return;states.set(button,visible);controls.get(button)?.stop();button.disabled=!visible;if(visible)button.hidden=false;const control=animate(button,{opacity:visible?1:0,scale:visible?1:.7},{duration:reduced.matches?0:.2,ease:'easeOut'});controls.set(button,control);control.then(()=>{if(!states.get(button))button.hidden=true;});};
  prev?.addEventListener('click',()=>track.scrollBy({left:-track.clientWidth*.8,behavior:reduced.matches?'instant':'smooth'}));next?.addEventListener('click',()=>track.scrollBy({left:track.clientWidth*.8,behavior:reduced.matches?'instant':'smooth'}));
  const update=()=>{visibility(prev,track.scrollLeft>0);visibility(next,track.scrollLeft<track.scrollWidth-track.clientWidth-1);};update();track.addEventListener('scroll',update,{passive:true});const ro=new ResizeObserver(update);ro.observe(track);register(el,()=>{ro.disconnect();track.removeEventListener('scroll',update);});
 });
}
function header(root){
 $all('[data-header]',root).forEach(el=>{if(initialized.has(el))return;initialized.add(el);const row=el.querySelector('[data-header-row]'),logo=row?.firstElementChild;let last;
 const update=()=>{const compact=scrollY>40;if(compact===last)return;last=compact;el.classList.toggle('kw-header-compact',compact);if(row)animate(row,{paddingTop:compact?4:8,paddingBottom:compact?4:8},{duration:reduced.matches?0:.3,ease:'easeOut'});if(logo)animate(logo,{scale:compact?.9:1,y:0,opacity:1},{duration:reduced.matches?0:.3,ease:'easeOut'});};update();window.addEventListener('scroll',update,{passive:true});register(el,()=>window.removeEventListener('scroll',update));
 });
 $all('[data-footer-toggle]',root).forEach(button=>{if(initialized.has(button))return;initialized.add(button);button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));const container=button.closest('h3').nextElementSibling;container.classList.toggle('grid-rows-[0fr]',!open);container.classList.toggle('grid-rows-[1fr]',open);container.classList.toggle('mt-2',open);button.querySelector('svg')?.classList.toggle('rotate-180',open);});});
 $all('[data-header] nav a[href],nav[aria-label] a[href]',root).forEach(link=>{const active=new URL(link.href).pathname===location.pathname;link.toggleAttribute('aria-current',active);if(active)link.setAttribute('aria-current','page');});
}
function initialize(root=document){$all('[data-animated-text]',root).forEach(el=>{if(!el.dataset.motion)el.dataset.motion=JSON.stringify({initial:{opacity:0,y:14},animate:{opacity:1,y:0},transition:{duration:.6,ease},inView:true,viewport:{amount:.8}});});motions(root);accordions(root);carousels(root);header(root);initializeCommerce(root);initializeForms(root);}
document.addEventListener('click',event=>{
 const opener=event.target.closest('[data-open-modal]');if(opener){event.preventDefault();const current=opener.closest('[data-modal]');if(current)closeModal(current).then(()=>openModal(opener.dataset.openModal));else openModal(opener.dataset.openModal);return;}
 const closer=event.target.closest('[data-close-modal]');if(closer){const owner=closer.closest('[data-modal]');if(owner){event.preventDefault();closeModal(owner);return;}}
 const modal=event.target.closest('[data-modal]');if(modal&&event.target===modal){closeModal(modal);return;}
 const account=event.target.closest('[data-account-link]');if(account)location.href=window.KW.accountUrl;
 const term=event.target.closest('[data-search-term]');if(term){location.href=window.KW.searchUrl+'?type=product&q='+encodeURIComponent(term.textContent.trim());}
 const searchClose=event.target.closest('[data-search-close]');if(searchClose){const input=searchClose.closest('[data-modal]').querySelector('[data-overlay-query]');if(input.value){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}else closeModal(searchClose.closest('[data-modal]'));}
});
document.addEventListener('keydown',event=>{
 const modal=openModals.at(-1);if(!modal)return;
 if(event.key==='Escape'){event.preventDefault();closeModal(modal);}
 if(event.key==='Tab'){const nodes=[...modal.querySelectorAll('button:not([disabled]),a[href],input:not([type=hidden]),select,textarea,[tabindex="0"]')].filter(n=>n.getClientRects().length&&!n.closest('[hidden]'));const first=nodes[0],last=nodes.at(-1);if(!first){event.preventDefault();return;}if(event.shiftKey&&document.activeElement===first){last.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first.focus();event.preventDefault();}}
});
document.addEventListener('kw:cart-open',()=>openModal('cart'));
document.addEventListener('kw:content-updated',event=>initialize(event.detail?.root||document));
document.addEventListener('kw:cart-updated',event=>{const count=event.detail?.cart?.item_count??0;document.querySelectorAll('[data-cart-count]').forEach(el=>{el.textContent=count>9?'9+':String(count);el.hidden=count===0;});});
document.addEventListener('shopify:section:load',event=>initialize(event.target));
document.addEventListener('shopify:section:unload',event=>{for(const cleanup of cleanups.get(event.target)||[])cleanup();cleanups.delete(event.target);const modal=openModals.find(m=>event.target.contains(m));if(modal)closeModal(modal);});
document.addEventListener('shopify:block:select',event=>{event.target.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});$all('[data-motion]',event.target).forEach(el=>{try{runMotion(el,JSON.parse(el.dataset.motion),true);}catch{}});});
reduced.addEventListener('change',()=>{if(reduced.matches)document.querySelectorAll('[data-motion]').forEach(el=>{try{runMotion(el,JSON.parse(el.dataset.motion),true);}catch{}});});
window.KW={...window.KW,openModal,closeModal,initialize};
initialize();
