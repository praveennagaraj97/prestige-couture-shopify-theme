import {animate} from 'motion';
const initialized=new WeakSet();
let nextId=0;
export function validationMessage(field,labels){
 if(field.required&&!field.value.trim())return labels.required;
 if(field.validity.typeMismatch&&field.type==='email')return labels.email;
 if(!field.validity.valid)return labels.invalid;
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
