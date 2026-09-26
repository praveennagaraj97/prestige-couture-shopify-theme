export function mapRoute(value) {
 let url=value;
 if (/^https?:\/\/(www\.)?krithiweaves\.com(?:\/|$)/.test(url)) url=new URL(url).pathname+new URL(url).search+new URL(url).hash;
 if (!url.startsWith('/') || url.startsWith('//')) return url;
 const [path,tail=''] = url.split(/(?=[?#])/s,2);
 if (path==='/products'||path==='/shop') return '/collections/all'+tail;
 if (path.startsWith('/help/')) return '/pages/help-'+path.slice(6)+tail;
 if (/^\/(about|contact|careers|factories|testimonials|help|returns|shipping|bulk-orders|privacy|terms|cookies)$/.test(path)) return '/pages'+path+tail;
 return url;
}
export const escapeLiquidString = value => value.replaceAll("'",'’');
export const settingLabel = (value,kind='Text') => `${kind}: ${value.replace(/\s+/g,' ').trim()}`.slice(0,70);
