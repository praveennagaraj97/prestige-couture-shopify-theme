export function isActiveNavigationPath(targetPath,currentPath){
 const normalize=path=>path.replace(/\/$/,'')||'/';
 const target=normalize(targetPath),current=normalize(currentPath);
 return target===current||(target==='/collections/all'&&(/^\/collections\//.test(current)||/^\/products\//.test(current)));
}
