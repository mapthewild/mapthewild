/** Distance-driven gait. During stance, root travel and foot travel cancel. */
export const STRIDE = 1.05;
export const STANCE = .62;
export function footfall(distance:number,side:0|1){
  const phase=((distance/STRIDE+side*.5)%1+1)%1;
  const reach=STRIDE*STANCE/2;
  if(phase<STANCE)return{forward:reach-phase*STRIDE,lift:0,pitch:0,planted:true};
  const swing=(phase-STANCE)/(1-STANCE);
  return{forward:-reach+2*reach*(.5-.5*Math.cos(Math.PI*swing)),lift:.16*Math.sin(Math.PI*swing),pitch:-.25*Math.sin(Math.PI*swing),planted:false};
}

/** Solve a bent knee in the forward/up plane; both bone lengths remain constant. */
export function kneeBetween(hip:[number,number],ankle:[number,number],upper=.445,lower=.445):[number,number]{
  const dy=ankle[0]-hip[0],dz=ankle[1]-hip[1],d=Math.max(.0001,Math.hypot(dy,dz));
  const a=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a));
  return[hip[0]+dy*a/d+dz*h/d,hip[1]+dz*a/d-dy*h/d];
}
