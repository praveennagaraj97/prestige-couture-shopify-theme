export function findVariantForOption(variants,currentId,index,value){
 const current=variants.find(variant=>String(variant.id)===String(currentId));
 if(!current?.options)return null;
 const options=[...current.options];
 options[index]=value;
 return variants.find(variant=>variant.available&&variant.options?.every((option,optionIndex)=>option===options[optionIndex]))||null;
}
