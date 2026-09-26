import React, {createContext,useContext} from 'react';
const MotionContext=createContext({initial:'hidden',animate:'show',inView:true,viewport:{once:true,amount:.2}});
const components=new Map();
function component(tag){
 if(components.has(tag))return components.get(tag);
 const Component=({variants,initial,animate,exit,whileInView,viewport,transition,custom,whileHover,whileTap,layout,layoutId,children,...props})=>{
  const inherited=useContext(MotionContext);
  const context={initial:typeof initial==='string'?initial:inherited.initial,animate:typeof whileInView==='string'?whileInView:typeof animate==='string'?animate:inherited.animate,inView:whileInView?true:animate?false:inherited.inView,viewport:viewport??inherited.viewport};
  const resolve=v=>typeof v==='string'?(typeof variants?.[v]==='function'?variants[v](custom):variants?.[v]):v;
  const start=resolve(initial??context.initial),end=resolve(whileInView??animate??context.animate);if(start?.opacity===0&&end&&end.opacity===undefined)end.opacity=1;
  const animation={initial:start,animate:end,transition:{...transition,...end?.transition},inView:context.inView,viewport:context.viewport,hover:whileHover,tap:whileTap,exit:resolve(exit)};
  if(start||end||whileHover||whileTap)props['data-motion']=JSON.stringify(animation);
  for(const k of Object.keys(props))if(k.startsWith('on')||['drag','dragConstraints','dragElastic'].includes(k))delete props[k];
  return React.createElement(MotionContext.Provider,{value:context},React.createElement(tag,props,children));
 };components.set(tag,Component);return Component;
}
export const motion=new Proxy({create:component},{get:(obj,k)=>obj[k]??component(k)});
export const AnimatePresence=({children})=>children;
export const useScroll=()=>({scrollY:{get:()=>0}});
export const useMotionValueEvent=()=>{};
export const useTransform=()=>0;
export const useSpring=()=>0;
export const useReducedMotion=()=>false;
export function Link({href,children,prefetch,scroll,replace,...props}){return <a href={typeof href==='string'?href:href?.pathname} {...props}>{children}</a>;}
export function Image({src,fill,priority,placeholder,blurDataURL,quality,fadeDuration=450,onLoad,style,...props}){const url=typeof src==='string'?src:src?.url??src?.src;return <img {...props} src={url} width={props.width??src?.width??1200} height={props.height??src?.height??1200} loading={priority?'eager':'lazy'} decoding="async" style={{...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{}),...style}} data-image-fade={fadeDuration}/>;}
export const usePathname=()=>'/';
export const useSearchParams=()=>new URLSearchParams();
export const useRouter=()=>({push(){},replace(){}});
export const notFound=()=>{throw Error('notFound');};
export const useCart=()=>({items:[],itemCount:0,isLoading:false,cart:null,openCart(){},closeCart(){},addItem(){}});
export const useToast=()=>({showInfo(){},showSuccess(){},showError(){}});
export const useAnnouncement=()=>({});
export function FaqItem({item,index,defaultOpen=false}){return <div className={`overflow-hidden rounded-2xl bg-white ring-1 transition-colors ${defaultOpen?'ring-rust/40':'ring-strong-coffee/10'}`} data-accordion data-default-open={defaultOpen?'true':'false'} data-motion={JSON.stringify({initial:{opacity:0,y:12},animate:{opacity:1,y:0},transition:{duration:.3,ease:[.22,1,.36,1],delay:.15+index*.08},inView:true,viewport:{amount:.2}})}><button type="button" className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5" aria-expanded={defaultOpen}><span className="font-libre-baskerville text-[15px] font-semibold text-dark-chocolate sm:text-base">{item.question}</span><span data-accordion-icon className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] transition-colors bg-white-chocolate text-rust"><svg viewBox="0 0 448 512" fill="currentColor" width="1em" height="1em"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></span></button><div data-accordion-body className="overflow-hidden"><p className="px-5 pb-5 text-[13px] leading-relaxed text-strong-coffee/80 sm:px-6 sm:pb-6 sm:text-sm">{item.answer}</p></div></div>;}
