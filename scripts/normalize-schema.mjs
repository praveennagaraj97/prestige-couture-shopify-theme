import fs from 'node:fs';
const defaults=new Map();
for(const file of fs.readdirSync('sections').filter(f=>f.endsWith('.liquid'))){const text=fs.readFileSync('sections/'+file,'utf8');if(!text.includes('{% schema %}'))continue;const [html,rest]=text.split('{% schema %}');const schema=JSON.parse(rest.split('{% endschema %}')[0]);const values={section:{},blocks:{}};
 function clean(settings,target){for(const s of settings||[]){if(s.type==='url'&&s.default!==undefined){target[s.id]=s.default;delete s.default;}}}
 clean(schema.settings,values.section);const names=new Set();for(const [i,b]of(schema.blocks||[]).entries()){if(names.has(b.name))b.name=(b.name.slice(0,20)+' '+(i+1)).slice(0,25);names.add(b.name);values.blocks[b.type]={};clean(b.settings,values.blocks[b.type]);}
 defaults.set(file.slice(0,-7),values);fs.writeFileSync('sections/'+file,html+'{% schema %}\n'+JSON.stringify(schema,null,2)+'\n{% endschema %}\n');}
for(const directory of ['templates','sections'])for(const file of fs.readdirSync(directory).filter(f=>f.endsWith('.json'))){const p=directory+'/'+file;const data=JSON.parse(fs.readFileSync(p,'utf8'));for(const section of Object.values(data.sections||{})){const d=defaults.get(section.type);if(!d)continue;section.settings={...d.section,...section.settings};for(const b of Object.values(section.blocks||{}))b.settings={...d.blocks[b.type],...b.settings};}fs.writeFileSync(p,JSON.stringify(data,null,2));}
console.log('Normalized schema and seeded configured URL settings.');
