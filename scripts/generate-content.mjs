import {readFile,writeFile,readdir,copyFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import {mapRoute,settingLabel} from './content-utils.mjs';
const inventory=[];
const title=v=>v.replace(/(^|-)(\w)/g,(_,p,c)=>(p?' ':'')+c.toUpperCase());
const literal=v=>"'"+v.replaceAll('&','&amp;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;')+"'";
const tokens=new Map();let tokenNumber=0;
function token(content){const t=`KWLIQUIDTOKEN${++tokenNumber}END`;tokens.set(t,content);return t;}
function untoken(content){for(let i=0;i<4;i++)for(const [t,s] of tokens)content=content.replaceAll(t,s);return content;}
function contentKey($,node){return $(node).text().trim().replace(/\s+/g,' ')+'|'+$(node).find('img').map((_,n)=>$(n).attr('src')).get().join('|');}
function sourceFallback(src){if(src.startsWith('/assets/'))return `{{ '${src.slice(8)}' | asset_url }}`;return src;}
function edit($,node,settings,scope,prefix=''){
 const existing=new Map(settings.map(s=>[s._key,s.id]));
 function field(kind,value,label){
  const key=kind+':'+value;if(existing.has(key))return `${scope}.${existing.get(key)}`;
  const id=(kind==='image'?'image':kind==='url'?'link':kind==='textarea'?'copy':'text')+'_'+(settings.length+1);
  const s={type:kind==='image'?'image_picker':kind,id,label:settingLabel(label||value,kind==='image'?'Image':kind==='url'?'Link':'Text'),_key:key};
  if(kind!=='image'&&kind!=='url'&&value.trim())s.default=value;
  if(kind==='url'&&(/^https?:\/\//.test(value)||value.startsWith('/')))s.default=value;
  settings.push(s);existing.set(key,id);return `${scope}.${id}`;
 }
 const nodes=[node,...$(node).find('*').toArray()];
 for(const n of nodes){const e=$(n);if(n.type!=='tag')continue;
  if(n.name==='img'){
   const src=e.attr('src');if(src){const ref=field('image',src,e.attr('alt')||prefix+' image');const fallback=sourceFallback(src);e.attr('src',token(`{% if ${ref} != blank %}{{ ${ref} | image_url: width: 2000 }}{% else %}${fallback}{% endif %}`));}
  }
  for(const attr of ['href','alt','aria-label','placeholder','title']){
   const value=e.attr(attr);if(!value||value.startsWith('KWLIQUID'))continue;
   if(attr==='href'&&value.startsWith('#'))continue;
   const normalized=attr==='href'?mapRoute(value):value;
   if(attr==='href'&&normalized.includes('shopify.com/')){e.attr(attr,token("{{ routes.account_url }}"));continue;}
   const kind=attr==='href'?'url':'text';const ref=field(kind,normalized,attr==='href'?(e.text().trim()||prefix+' destination'):normalized);
   e.attr(attr,token(`{{ ${ref} | default: ${literal(normalized)} | escape }}`));
  }
  for(const textNode of e.contents().toArray()){
   if(textNode.type!=='text'||!textNode.data.trim()||['script','style','svg','path','title'].includes(n.name))continue;
   const value=textNode.data;if(value.includes('KWLIQUID'))continue;
   const trimmed=value.trim();const ref=field(value.length>90?'textarea':'text',trimmed,prefix?`${prefix} — ${trimmed}`:trimmed);
   textNode.data=token(value.match(/^\s*/)[0]+`{{ ${ref} | default: ${literal(trimmed)} | escape }}`+value.match(/\s*$/)[0]);
  }
 }
}
function repeated($,n){
 const children=$(n).children().toArray().filter(n=>n.type==='tag');if(children.length<2)return false;
 if($(n).closest('svg,form,button,[data-accordion]').length)return false;
 if(['ul','ol'].includes(n.name))return children.every(c=>c.name==='li');
 if(!['div','section'].includes(n.name))return false;
 if(children.some(c=>!['div','section','article','a','figure'].includes(c.name)))return false;
 const cls=children.map(c=>new Set(($(c).attr('class')||'').split(' ').filter(Boolean)));
 if(cls.some(c=>c.size<2))return false;
 return cls.slice(1).every(c=>[...c].filter(k=>cls[0].has(k)).length/Math.min(c.size,cls[0].size)>=.65);
}
function hydrateForms($,name){
 $('form:not([role=search])').each((idx,form)=>{
  const f=$(form);let count=0;
  f.find('input,textarea,select').each((_,el)=>{const e=$(el);if(e.attr('type')==='checkbox')return;const label=e.attr('placeholder')||e.prev('label').text()||'Field '+(++count);let key=e.attr('type')==='email'?'email':el.name==='textarea'?'body':/name/i.test(label)?'name':/phone/i.test(label)?'phone':label.replace(/[^a-zA-Z0-9 ]/g,'').trim();e.attr('name',`contact[${key}]`);e.attr('aria-label',label);if(el.name==='textarea'&&!e.attr('placeholder'))e.attr('aria-label','Message');});
  const id=`Contact-${name}-${idx}`;f.attr('id',id);
  const attrs=Object.entries(form.attribs).filter(([k])=>!['action','method','id'].includes(k)).map(([k,v])=>`${k}="${v.replaceAll('"','&quot;')}"`).join(' ');
  f.before(token(`{% form 'contact', id: '${id}' %}<div ${attrs}>`));
  f.prepend(token(`{% if form.posted_successfully? %}<p role="status">{{ section.settings.form_success | escape }}</p>{% endif %}{% if form.errors %}<div role="alert">{{ form.errors | default_errors }}</div>{% endif %}`));
  f.after(token('</div>{% endform %}'));f.replaceWith(f.contents());
 });
}
async function section(name,html,label){
 const $=cheerio.load(html,{decodeEntities:false},false);$('link[rel="preload"]').remove();
 $('[data-open-modal=cart]').append('<span data-cart-count hidden class="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[10px] font-semibold text-white"></span>');
 const settings=[],blocks=[],defaults={},order=[],reused=new Map();
 if(name==='site-header'){
  $('header').attr('data-header','');$('header > div').first().attr('data-header-row','');
  $('[aria-label="Open navigation menu"]').attr('data-open-modal','navigation').attr('aria-expanded','false').removeAttr('style').removeAttr('data-motion');
  const aside=$('#mobile-navigation');aside.attr('data-modal-panel','');const backdrop=aside.prev();backdrop.attr('data-close-modal','').removeAttr('aria-hidden');backdrop.add(aside).wrapAll('<div data-modal="navigation" data-modal-variant="navigation" hidden></div>');
  $('[aria-label="Close navigation menu"]').attr('data-close-modal','');
  const navModal=$('[data-modal=navigation]');navModal.remove();$('header').after(navModal);
  $('button').each((_,el)=>{const label=$(el).attr('aria-label')||$(el).text().trim();if(label==='Cart')$(el).attr('data-open-modal','cart');if(label==='Search')$(el).attr('data-open-modal','search');if(label==='Account')$(el).attr('data-account-link','');});
 }
 if(name==='site-footer'){$('button[aria-expanded]').attr('data-footer-toggle','');$('button[aria-label=Cart]').attr('data-open-modal','cart');}
 if(name==='search-overlay'){const outer=$.root().children().first();outer.children().first().attr('data-close-modal','');outer.attr('data-modal','search').attr('data-modal-variant','search').attr('hidden','');$('[role=dialog]').attr('data-modal-panel','');$('[role=search]').attr('action',token('{{ routes.search_url }}')).attr('method','get').prepend('<input type="hidden" name="type" value="product">');$('input[type=text]').attr('name','q').attr('data-overlay-query','');$('button[aria-label=Close]').attr('data-search-close','');$('button.rounded-full').attr('data-search-term','');}
 $('[data-open-modal=cart]').append('<span data-cart-count hidden class="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[10px] font-semibold text-white"></span>');
 // Topmost repeated content groups become editor blocks. Distinct visual patterns
 // retain their own case branch, so no responsive markup is approximated.
 function walk(node){
  if(repeated($,node)){
   const children=$(node).children().toArray();const branches=[];const types=[];
   for(const child of children){
    const key=contentKey($,child);if(!key||key==='|')continue;
    let block=reused.get(key);if(!block){
     const id='item_'+(blocks.length+1);let heading=$(child).find('h2,h3,h4').first().text()||$(child).find('img').first().attr('alt')||$(child).text().trim()||'Content item';
     heading=heading.replace(/\s+/g,' ').trim().slice(0,24);
     block={type:id,name:heading||'Content item',settings:[]};blocks.push(block);reused.set(key,block);defaults[id]={type:id,settings:{}};order.push(id);
    }
    edit($,child,block.settings,'block.settings',block.name);
    $(child).attr('data-editor-block',token('{{ block.id }}')).attr('data-shopify-block',token('{{ block.shopify_attributes }}'));
    let markup=$.html(child).replace(/ data-shopify-block="([^"]+)"/g,' $1');
    branches.push(`{% when '${block.type}' %}${markup}`);types.push(block.type);
   }
   if(branches.length){$(node).empty().append(token(`{% for block in section.blocks %}{% case block.type %}${branches.join('\n')}{% endcase %}{% endfor %}`));return;}
  }
  for(const child of $(node).children().toArray())walk(child);
 }
 for(const node of $.root().children().toArray())walk(node);
 const hasForm=$('form:not([role=search])').length>0;
 hydrateForms($,name);
 for(const node of $.root().children().toArray())edit($,node,settings,'section.settings');
 if(hasForm)settings.push({type:'text',id:'form_success',label:'Form success message',default:'Thank you! Your message has been sent. We will get back to you soon.'});
 const clean=s=>{const {_key,...data}=s;return data;};
 const schema={name:label.slice(0,25),tag:'section',class:'kw-section',settings:settings.map(clean),...(blocks.length?{blocks:blocks.map(b=>({...b,settings:b.settings.map(clean)})),max_blocks:50}:{}),presets:[{name:label.slice(0,25),...(blocks.length?{blocks:order.map(type=>({type}))}:{})}]};
 if(settings.length>50||blocks.some(b=>b.settings.length>50))throw Error(`${name}: too many settings ${settings.length}/${blocks.map(b=>b.settings.length)}`);
 const body=untoken($.root().html());
 await writeFile(`sections/${name}.liquid`,`{% comment %} Source-parity migration: ${label}. Content controls preserve the source layout. {% endcomment %}\n${body}\n{% schema %}\n${JSON.stringify(schema,null,2)}\n{% endschema %}\n`);
 inventory.push({section:name,label,settings:schema.settings,blocks:schema.blocks||[]});
 return {type:name,settings:{},...(blocks.length?{blocks:defaults,block_order:order}:{})};
}
for(const [file,name,label] of [['header','site-header','Header'],['footer','site-footer','Footer'],['search','search-overlay','Search overlay'],['announcement','announcement-bar','Announcement']])await section(name,await readFile('.tmp/shell-'+file+'.html','utf8'),label);
const homeNames=['hero','testimonials','stories','about','how','style-it','connect'];
const home={};for(const n of homeNames)home[n]=await section('home-'+n,await readFile('.tmp/home-'+n+'.html','utf8'),title(n));
const homeTemplate={sections:{hero:home.hero,featured:{type:'home-products',settings:{heading:'Featured Products',mode:'featured'}},best:{type:'home-products',settings:{heading:'Best Sellers',mode:'best'}},...Object.fromEntries(Object.entries(home).filter(([k])=>k!=='hero'))},order:['hero','featured','best','testimonials','stories','about','how','style-it','connect']};
await writeFile('templates/index.json',JSON.stringify(homeTemplate,null,2));
for(const file of (await readdir('.tmp')).filter(f=>f.startsWith('page-')&&f.endsWith('.html'))){
 const slug=file.slice(5,-5),$=cheerio.load(await readFile('.tmp/'+file,'utf8'),{},false);$('link[rel="preload"]').remove();
 const nodes=$('main').length?$('main').children().toArray():$.root().children().toArray();const sections={},order=[];
 for(let i=0;i<nodes.length;i++){const n=nodes[i],id='content_'+(i+1);const label=$(n).find('h1,h2').first().text()||title(slug)+' '+(i+1);const name=`${slug.slice(0,22)}-${i+1}`;sections[id]=await section(name,$.html(n),label.trim()||title(slug));order.push(id);}
 await writeFile(`templates/page.${slug}.json`,JSON.stringify({sections,order},null,2));
}
await writeFile('docs/content-inventory.json',JSON.stringify(inventory,null,2));
console.log(`Generated ${inventory.length} schema-backed sections from the source DOM.`);
