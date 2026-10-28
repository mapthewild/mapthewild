export const HEARING_THRESHOLD=.24;
export function soundProfile(progress,clear=false,volume=.25){
 const p=Math.min(1,Math.max(0,progress)),v=Math.min(1,Math.max(0,volume));
 const x=Math.max(0,(p-HEARING_THRESHOLD)/(1-HEARING_THRESHOLD));
 return {audible:p>=HEARING_THRESHOLD,gain:p<HEARING_THRESHOLD?0:v*(clear?.8:.055+.745*Math.pow(x,1.65)),cutoff:clear?18000:900+15100*x*x,pan:clear?0:.3*(1-x)};
}
