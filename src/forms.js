import {animate} from 'motion';
const initialized=new WeakSet();
let nextId=0;
function fieldLabel(field){
 const name=(field.name||'').toLowerCase();
 if(field.type==='email'||name.includes('email'))return 'email address';
 if(field.type==='tel'||name.includes('phone'))return 'phone number';
 if(name.includes('organisation')||name.includes('organization')||name.includes('brand'))return 'organisation or brand name';
 if(name.includes('[name]')||name==='name')return 'name';
 if(field.tagName==='TEXTAREA'||name.includes('body'))return 'message';
 if(field.tagName==='SELECT')return (field.options[0]?.textContent||'option').trim().toLowerCase();
 return (field.getAttribute('aria-label')||field.placeholder||'value').replace(/\s*\*+\s*$/,'').trim().toLowerCase();
}
function requiredMessage(field){
 const label=fieldLabel(field);
 if(label==='email address')return 'Please enter your email address.';
 if(label==='phone number')return 'Please enter your phone number.';
 if(label==='organisation or brand name')return 'Please enter your organisation or brand name.';
 if(label==='name')return 'Please enter your name.';
 if(label==='message')return 'Please enter a message.';
 if(field.tagName==='SELECT'&&label.includes('quantity'))return 'Please select an approximate order quantity.';
 if(field.tagName==='SELECT'&&label.includes('needed by'))return 'Please select when you need the order.';
 if(field.tagName==='SELECT')return `Please choose an option for ${label}.`;
 return `Please enter your ${label}.`;
}
export function validationMessage(field,labels){
 if(field.required&&!field.value.trim())return requiredMessage(field);
 if(field.type==='email'&&field.value&&!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(field.value.trim()))return labels.email;
 if(field.validity.typeMismatch&&field.type==='email')return labels.email;
 if(!field.validity.valid)return `Please check your ${fieldLabel(field)} and try again.`;
 return '';
}
export function initializeForms(root=document){
 root.querySelectorAll('form[action*="/contact"]').forEach(form=>{
  if(initialized.has(form))return;initialized.add(form);form.noValidate=true;
  const fields=[...form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]),textarea,select')];
  const labels=window.KW.validation;
  const messages=new Map();
  const validate=field=>{
   const message=validationMessage(field,labels);let error=messages.get(field);
   if(!error){const wrapper=document.createElement('div');wrapper.className='kw-field';field.before(wrapper);wrapper.append(field);error=document.createElement('p');error.id=`kw-field-error-${++nextId}`;error.className='kw-field-error';error.hidden=true;wrapper.append(error);messages.set(field,error);}
   error.textContent=message;error.hidden=!message;
   field.setAttribute('aria-invalid',String(Boolean(message)));
   const described=(field.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==error.id);if(message)described.push(error.id);if(described.length)field.setAttribute('aria-describedby',described.join(' '));else field.removeAttribute('aria-describedby');
   if(message&&!matchMedia('(prefers-reduced-motion: reduce)').matches)animate(error,{opacity:[0,1],y:[6,0]},{duration:.25,ease:[.22,1,.36,1]});
   return !message;
  };
  form.addEventListener('submit',event=>{let first;for(const field of fields)if(!validate(field)&&!first)first=field;if(first){event.preventDefault();first.focus();return;}const button=event.submitter||form.querySelector('[data-contact-submit]');if(button){button.classList.add('kw-form-loading');button.disabled=true;button.setAttribute('aria-busy','true');}});
  for(const field of fields){field.addEventListener('blur',()=>{if(field.value||messages.has(field))validate(field);});field.addEventListener('input',()=>{if(messages.has(field))validate(field);});}
 });
}
