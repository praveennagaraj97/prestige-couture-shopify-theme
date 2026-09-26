import {build} from 'esbuild';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve('.'),website=path.resolve('../website'),shim=path.join(root,'scripts/render-shims.jsx');
await mkdir('.tmp',{recursive:true});
process.loadEnvFile(path.join(website,'.env'));
const names=['hero','testimonials','stories','about','how','style-it','connect'];
const pages=['about','factories','careers','testimonials','contact','help','returns','shipping','bulk-orders','privacy','terms','cookies'];
let entry=`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {writeFile} from 'node:fs/promises'; import {getHomePageContent} from '${website}/src/services/home.service'; import {getAnnouncementBarContent} from '${website}/src/services/announcement-bar.service';\n`;
for(let i=0;i<names.length;i++) entry+=`import Home${i} from '${website}/src/components/home/${names[i]}';\n`;
for(let i=0;i<pages.length;i++) entry+=`import Page${i} from '${website}/src/app/${pages[i]}/page';\n`;
entry+=`import Topic from '${website}/src/components/help/topic/topic-page';import {helpTopics} from '${website}/src/components/help/topic/topic-data';\n`;
entry+=`import Header from '${website}/src/layout/header';import Footer from '${website}/src/layout/footer';import MobileFooter from '${website}/src/layout/footer/mobile-footer-drawer';import SearchOverlay from '${website}/src/layout/header/search-overlay';import Announcement from '${website}/src/components/shared/announcement-bar';\n`;
entry+=`const cms=await getHomePageContent();const announcement=await getAnnouncementBarContent();await writeFile('${root}/.tmp/content.json',JSON.stringify({cms,announcement},null,2));await writeFile('${root}/.tmp/shell-header.html',renderToStaticMarkup(React.createElement(Header)));await writeFile('${root}/.tmp/shell-footer.html',renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(Footer),React.createElement(MobileFooter))));await writeFile('${root}/.tmp/shell-search.html',renderToStaticMarkup(React.createElement(SearchOverlay,{isOpen:true,onClose(){}})));await writeFile('${root}/.tmp/shell-announcement.html',renderToStaticMarkup(React.createElement(Announcement,{content:announcement?.content})));const c=cms.homePageContent;const props=[{content:c?.hero},{cmsTestimonials:c?.testimonials},{cmsStories:c?.stories},{content:c?.about},{content:c?.how},{content:c?.styleIt},{}];const names=${JSON.stringify(names)};const home=[${names.map((_,i)=>`Home${i}`).join(',')}];for(let i=0;i<home.length;i++)await writeFile('${root}/.tmp/home-'+names[i]+'.html',renderToStaticMarkup(React.createElement(home[i],props[i])));\n`;
entry+=`const pages=[${pages.map((_,i)=>`Page${i}`).join(',')}];const pageNames=${JSON.stringify(pages)};for(let i=0;i<pages.length;i++)await writeFile('${root}/.tmp/page-'+pageNames[i]+'.html',renderToStaticMarkup(React.createElement(pages[i])));for(const topic of helpTopics)await writeFile('${root}/.tmp/page-help-'+topic.slug+'.html',renderToStaticMarkup(React.createElement(Topic,{topic})));`;
const shimNames={'motion/react':null,'next/link':'Link','next/image':'Image','next/navigation':null,'@/components/shared/image':'Image','@/contexts/cart-context':null,'@/contexts/toast-context':null,'@/components/contact/faq/faq-item':'FaqItem'};
await build({stdin:{contents:entry,resolveDir:root,sourcefile:'render-entry.jsx',loader:'jsx'},outfile:'.tmp/render.mjs',bundle:true,platform:'node',format:'esm',banner:{js:"import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);"},packages:'external',jsx:'automatic',plugins:[{name:'source',setup(b){
 b.onResolve({filter:/.*/},args=>{
  if(args.path==='server-only')return {path:'empty',namespace:'empty'};
  if(Object.hasOwn(shimNames,args.path))return {path:args.path,namespace:'shim'};
  if(args.path==='./faq-item' && args.importer.includes('/contact/faq/'))return {path:'@/components/contact/faq/faq-item',namespace:'shim'};
  if(args.path.startsWith('@/')){const p=path.join(website,'src',args.path.slice(2));return {path:[p,p+'.tsx',p+'.ts',p+'/index.tsx',p+'/index.ts'].find(f=>existsSync(f)&&!existsSync(f+'/index.tsx')&&!existsSync(f+'/index.ts'))??p};}
  if(args.path==='@shopify/storefront-api-client')return {path:require.resolve(args.path,{paths:[website]}),external:true};
  if(args.path.startsWith('react-icons'))return {path:require.resolve(args.path,{paths:[website]})};
 });
 b.onLoad({filter:/.*/,namespace:'empty'},()=>({contents:'export {}'}));
 b.onLoad({filter:/.*/,namespace:'shim'},args=>({contents:`export * from '${shim}';${shimNames[args.path]?`export {${shimNames[args.path]} as default} from '${shim}';`:''}`,resolveDir:root}));
 b.onLoad({filter:/mobile\.nav\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8')).replace('useState(false)','useState(true)'),loader:'tsx'}));
 b.onLoad({filter:/\.(png|jpg|jpeg|webp|svg)$/},async args=>{const name=path.basename(args.path).replace(/\s+/g,'-');await copyFile(args.path,path.join(root,'assets',name));let info={width:1200,height:1200};try{info=await require(path.join(website,'node_modules/sharp'))(args.path).metadata();}catch{}return {contents:`export default ${JSON.stringify({src:'/assets/'+name,width:info.width,height:info.height})}`};});
}}]});
await import(path.join(root,'.tmp/render.mjs')+'?'+Date.now());
console.log('Rendered source home and content pages with source motion metadata.');
