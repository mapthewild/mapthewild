// Keep the reviewed source untouched. Only the embedded harbour copy receives
// this motion preference; content, annotations and normal readers are unchanged.
export function adaptWorldReader(source){
  const original="const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');";
  if(source.split(original).length!==2)throw new Error('Reader motion adapter needs review: source anchor changed.');
  return source.replace(original,"const reducedMotion = matchMedia(embedded && new URLSearchParams(location.search).get('motion') === 'off' ? 'all' : '(prefers-reduced-motion: reduce)');");
}
