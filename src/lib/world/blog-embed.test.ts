import {afterEach,describe,it,expect,vi} from 'vitest';
import {isBlogEmbed,parentVisibility,pageDelta,simulationState,keepsScrollLocal,blogTouchGesture,connectBlogEmbed,forwardsPageKey} from './blog-embed';

afterEach(()=>{document.body.replaceChildren();vi.restoreAllMocks();});

describe('Blog Explore input and suspension',()=>{
  it('requires an explicit embedded blog request and an actual parent frame',()=>{
    expect(isBlogEmbed('https://example.test/explore/',true)).toBe(false);
    expect(isBlogEmbed('https://example.test/explore/?embedded=blog',false)).toBe(false);
    expect(isBlogEmbed('https://example.test/explore/?embedded=blog',true)).toBe(true);
  });
  it('only accepts visibility from the same-origin parent and a boolean payload',()=>{
    const parent={} as Window,origin='https://example.test';
    const event={source:parent,origin,data:{type:'mtw:page-visibility',visible:false}};
    expect(parentVisibility(event,parent,origin)).toBe(false);
    expect(parentVisibility({...event,data:{...event.data,visible:true}},parent,origin)).toBe(true);
    expect(parentVisibility({...event,origin:'https://elsewhere.test'},parent,origin)).toBeNull();
    expect(parentVisibility({...event,source:{} as Window},parent,origin)).toBeNull();
    expect(parentVisibility({...event,data:{...event.data,visible:'true'}},parent,origin)).toBeNull();
    expect(parentVisibility({...event,data:null},parent,origin)).toBeNull();
  });
  it('does not release the book suspension when the blog becomes visible again',()=>{
    expect(simulationState(false,false)).toBe('paused-page');
    expect(simulationState(false,true)).toBe('paused-page');
    expect(simulationState(true,true)).toBe('paused-book');
    expect(simulationState(true,false)).toBe('running');
  });
  it('normalizes wheel units without introducing invalid page deltas',()=>{
    expect(pageDelta(-60,0,844)).toBe(-60);expect(pageDelta(3,1,844)).toBe(48);
    expect(pageDelta(1,2,844)).toBe(844);expect(pageDelta(NaN,0,844)).toBe(0);
  });
  it('lets taps select places but consumes a single-finger page swipe',()=>{
    const gesture=blogTouchGesture();gesture.down(1,100,200,false);
    expect(gesture.move(1,102,202)).toEqual({consume:false,deltaY:0});expect(gesture.up(1)).toBe(false);
    gesture.down(2,100,200,false);
    expect(gesture.move(2,100,170)).toEqual({consume:true,deltaY:30});
    expect(gesture.move(2,100,130)).toEqual({consume:true,deltaY:40});expect(gesture.up(2)).toBe(true);
  });
  it('preserves native pinch movement and holds the gesture until all fingers lift',()=>{
    const gesture=blogTouchGesture();gesture.down(1,100,200,false);gesture.down(2,150,200,false);
    expect(gesture.move(1,70,150)).toEqual({consume:false,deltaY:0});
    expect(gesture.move(2,180,220)).toEqual({consume:false,deltaY:0});expect(gesture.up(2)).toBe(true);
    expect(gesture.move(1,70,140)).toEqual({consume:true,deltaY:0});expect(gesture.up(1)).toBe(true);
    gesture.down(3,70,140,false);expect(gesture.move(3,70,110)).toEqual({consume:true,deltaY:30});expect(gesture.up(3)).toBe(true);
  });
  it('keeps panel swipes and boundary scrolling local, including every open dialog',()=>{
    const root=document.createElement('main');root.innerHTML='<canvas></canvas><section class="world-landing"><button>Step ashore</button></section><section class="shelf-titles"><button>Book</button></section>';
    document.body.append(root);
    expect(keepsScrollLocal(root.querySelector('.world-landing button'),root)).toBe(true);
    expect(keepsScrollLocal(root.querySelector('.shelf-titles button'),root)).toBe(true);
    expect(keepsScrollLocal(root.querySelector('canvas'),root)).toBe(false);
    const gesture=blogTouchGesture();gesture.down(1,100,200,true);expect(gesture.move(1,100,100)).toEqual({consume:false,deltaY:0});expect(gesture.up(1)).toBe(false);
    const dialog=document.createElement('dialog');dialog.open=true;root.append(dialog);
    expect(keepsScrollLocal(root.querySelector('canvas'),root)).toBe(true);
  });
  it('forwards background wheel scrolling but reserves Ctrl-wheel for world zoom',()=>{
    const root=document.createElement('main');root.innerHTML='<canvas></canvas><section class="world-landing"></section>';document.body.append(root);
    const post=vi.spyOn(window,'postMessage').mockImplementation(()=>{}),zoom=vi.fn();
    const bridge=connectBlogEmbed(root,vi.fn(),zoom);expect(post).toHaveBeenCalledWith({type:'mtw:page-ready'},location.origin);post.mockClear();
    const wheel=new WheelEvent('wheel',{deltaY:80,bubbles:true,cancelable:true});root.querySelector('canvas')!.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);expect(post).toHaveBeenCalledWith({type:'mtw:page-scroll',deltaY:80},location.origin);expect(zoom).not.toHaveBeenCalled();
    post.mockClear();root.querySelector('canvas')!.dispatchEvent(new WheelEvent('wheel',{deltaY:-40,ctrlKey:true,bubbles:true,cancelable:true}));
    expect(post).not.toHaveBeenCalled();expect(zoom).toHaveBeenCalledWith(Math.exp(.04));
    zoom.mockClear();
    for(const modifier of ['shiftKey','altKey','metaKey'])root.querySelector('canvas')!.dispatchEvent(new WheelEvent('wheel',{deltaY:80,[modifier]:true,bubbles:true,cancelable:true}));
    expect(post).not.toHaveBeenCalled();expect(zoom).not.toHaveBeenCalled();
    const panelWheel=new WheelEvent('wheel',{deltaY:80,bubbles:true,cancelable:true});root.querySelector('.world-landing')!.dispatchEvent(panelWheel);
    expect(panelWheel.defaultPrevented).toBe(false);expect(post).not.toHaveBeenCalled();bridge.dispose();
  });
  it('forwards page keys only from the background and preserves button and reader keys',()=>{
    for(const key of ['PageUp','PageDown','Home','End',' ']){
      const event={key,ctrlKey:false,altKey:false,metaKey:false};
      expect(forwardsPageKey(event,false,false)).toBe(true);expect(forwardsPageKey(event,true,false)).toBe(key!==' ');expect(forwardsPageKey(event,false,true)).toBe(false);
      expect(forwardsPageKey({...event,ctrlKey:true},false,false)).toBe(false);
    }
    expect(forwardsPageKey({key:'Escape',ctrlKey:false,altKey:false,metaKey:false},false,false)).toBe(false);
  });
  it('leaves the page from an ordinary focused button while preserving its Space action',()=>{
    const root=document.createElement('main');root.innerHTML='<button>Zoom in</button><section class="world-landing" tabindex="-1"></section>';document.body.append(root);
    const post=vi.spyOn(window,'postMessage').mockImplementation(()=>{}),bridge=connectBlogEmbed(root,vi.fn(),vi.fn());post.mockClear();
    const pageKey=new KeyboardEvent('keydown',{key:'PageUp',shiftKey:true,bubbles:true,cancelable:true});root.querySelector('button')!.dispatchEvent(pageKey);
    expect(pageKey.defaultPrevented).toBe(true);expect(post).toHaveBeenCalledWith({type:'mtw:page-key',key:'PageUp',shiftKey:true},location.origin);post.mockClear();
    const space=new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true});root.querySelector('button')!.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);expect(post).not.toHaveBeenCalled();
    Object.defineProperty(root.querySelector('.world-landing'),'scrollHeight',{value:200});
    Object.defineProperty(root.querySelector('.world-landing'),'clientHeight',{value:100});
    root.querySelector('.world-landing')!.dispatchEvent(new KeyboardEvent('keydown',{key:'PageDown',bubbles:true,cancelable:true}));
    expect(post).not.toHaveBeenCalled();bridge.dispose();
  });
  it('lets page keys leave fitting panels while retaining true panel scrolling at both ends',()=>{
    const root=document.createElement('main');root.innerHTML='<section class="world-landing" tabindex="-1"></section><section class="shelf-titles" tabindex="-1"></section>';document.body.append(root);
    const post=vi.spyOn(window,'postMessage').mockImplementation(()=>{}),bridge=connectBlogEmbed(root,vi.fn(),vi.fn());post.mockClear();
    for(const panel of root.querySelectorAll<HTMLElement>('section')){
      panel.dispatchEvent(new KeyboardEvent('keydown',{key:'PageUp',bubbles:true,cancelable:true}));
      expect(post).toHaveBeenCalledWith({type:'mtw:page-key',key:'PageUp',shiftKey:false},location.origin);post.mockClear();
      // Wheel and touch remain contained even when all panel contents fit.
      expect(keepsScrollLocal(panel,root)).toBe(true);
      Object.defineProperty(panel,'scrollHeight',{value:300});Object.defineProperty(panel,'clientHeight',{value:100});
      for(const scrollTop of [0,200]){
        panel.scrollTop=scrollTop;panel.dispatchEvent(new KeyboardEvent('keydown',{key:scrollTop?'PageDown':'PageUp',bubbles:true,cancelable:true}));
        expect(keepsScrollLocal(panel,root,true)).toBe(true);expect(post).not.toHaveBeenCalled();
      }
    }
    const dialog=document.createElement('dialog');dialog.open=true;root.append(dialog);
    document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'PageUp',bubbles:true,cancelable:true}));
    expect(post).not.toHaveBeenCalled();bridge.dispose();
  });
  it('contains native overscroll only while the embedded bridge is installed',()=>{
    const root=document.createElement('main');document.body.append(root);
    const previous=document.body.style.overscrollBehavior,bridge=connectBlogEmbed(root,vi.fn(),vi.fn());
    expect(document.body.style.overscrollBehavior).toBe('none');expect(document.documentElement.style.overscrollBehavior).toBe('none');
    expect(document.querySelector('style[data-mtw-blog-input]')?.textContent).toContain('overscroll-behavior:contain');
    bridge.dispose();expect(document.body.style.overscrollBehavior).toBe(previous);expect(document.querySelector('style[data-mtw-blog-input]')).toBeNull();
  });
});
