import test from 'node:test';
import assert from 'node:assert/strict';
import {validationMessage} from '../src/forms.js';
const labels={required:'Required',email:'Invalid email',invalid:'Invalid value'};
test('contact validation rejects whitespace-only required fields and emails without a valid domain',()=>{
 assert.equal(validationMessage({required:true,value:'  ',validity:{valid:true}},labels),'Required');
 assert.equal(validationMessage({required:true,value:'a@',type:'email',validity:{valid:false,typeMismatch:true}},labels),'Invalid email');
 assert.equal(validationMessage({value:'hello@example',type:'email',validity:{valid:true}},labels),'Invalid email');
 assert.equal(validationMessage({value:'hello@.com',type:'email',validity:{valid:true}},labels),'Invalid email');
 assert.equal(validationMessage({value:'hello@example.com',type:'email',validity:{valid:false,typeMismatch:true}},labels),'Invalid email');
 assert.equal(validationMessage({value:'hello@example.com',type:'email',validity:{valid:true}},labels),'');
 assert.equal(validationMessage({value:'',required:false,validity:{valid:true}},labels),'');
});
