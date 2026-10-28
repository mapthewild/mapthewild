import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,within} from '@testing-library/react';
import PodcastListener from './PodcastListener';
import {FUTURE_DADS_EPISODES} from '../../lib/world/future-dads-episodes';

const paused=new WeakMap<HTMLMediaElement,boolean>();
beforeEach(()=>{
  HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  HTMLDialogElement.prototype.close=function(){this.open=false;};
  vi.spyOn(HTMLMediaElement.prototype,'paused','get').mockImplementation(function(){return paused.get(this)??true;});
  vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(function(){paused.set(this,false);this.dispatchEvent(new Event('play'));return Promise.resolve();});
  vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(function(){if(!this.paused){paused.set(this,true);this.dispatchEvent(new Event('pause'));}});
});
afterEach(()=>{cleanup();vi.restoreAllMocks();Reflect.deleteProperty(HTMLDialogElement.prototype,'showModal');Reflect.deleteProperty(HTMLDialogElement.prototype,'close');});

describe('listening-place playback',()=>{
  it('keeps the same audio playing when the list closes or reopens, with usable room controls',()=>{
    const onClose=vi.fn();
    const view=render(<PodcastListener active open onClose={onClose}/>);
    const player=view.container.querySelector('audio')!;
    expect(player.volume).toBe(.25);
    Object.defineProperty(player,'duration',{value:300,configurable:true});
    fireEvent.loadedMetadata(player);
    fireEvent.click(view.getByRole('button',{name:'Play episode'}));
    act(()=>{player.currentTime=37;fireEvent.timeUpdate(player);});
    fireEvent.click(view.getByRole('button',{name:'Back to the listening place ×'}));
    expect(onClose).toHaveBeenCalledOnce();
    view.rerender(<PodcastListener active open={false} onClose={onClose}/>);
    expect(view.container.querySelector('audio')).toBe(player);
    expect(player.paused).toBe(false);
    expect(player.currentTime).toBe(37);
    const room=within(view.getByRole('region',{name:'Episode player'}));
    expect(room.getByRole('heading').textContent).toBe(FUTURE_DADS_EPISODES[0].title);
    fireEvent.change(room.getByRole('slider',{name:'Episode position'}),{target:{value:'85'}});
    expect(player.currentTime).toBe(85);
    fireEvent.change(room.getByRole('slider',{name:'Episode volume'}),{target:{value:'.4'}});
    expect(player.volume).toBe(.4);
    fireEvent.click(room.getByRole('button',{name:'Pause episode'}));
    expect(player.paused).toBe(true);
    fireEvent.click(room.getByRole('button',{name:'Play episode'}));
    view.rerender(<PodcastListener active open onClose={onClose}/>);
    expect(player.paused).toBe(false);
    expect(view.container.querySelectorAll('audio')).toHaveLength(1);
    fireEvent.click(view.getByRole('button',{name:new RegExp('^Eric - This is a life experience 8')}));
    expect(player.paused).toBe(false);
    expect(player.currentTime).toBe(85);
  });

  it('stops on leaving the listening place and remembers each episode position',()=>{
    const onClose=vi.fn(),view=render(<PodcastListener active open onClose={onClose}/>);
    const first=view.container.querySelector('audio')!;
    fireEvent.click(view.getByRole('button',{name:'Play episode'}));
    act(()=>{first.currentTime=63;fireEvent.timeUpdate(first);});
    fireEvent.click(view.getByRole('button',{name:/^What's in a song\? 12/}));
    const second=view.container.querySelector('audio')!;
    expect(first.paused).toBe(true);
    expect(second).not.toBe(first);
    expect(second.volume).toBe(.25);
    fireEvent.click(view.getByRole('button',{name:'Play episode'}));
    view.rerender(<PodcastListener active={false} open={false} onClose={onClose}/>);
    expect(second.paused).toBe(true);
    expect(view.queryByRole('region',{name:'Episode player'})).toBeNull();
    view.rerender(<PodcastListener active open onClose={onClose}/>);
    fireEvent.click(view.getByRole('button',{name:/^Eric - This is a life experience 8/}));
    const returned=view.container.querySelector('audio')!;
    Object.defineProperty(returned,'duration',{value:300,configurable:true});
    fireEvent.loadedMetadata(returned);
    expect(returned.currentTime).toBe(63);
    expect(returned.paused).toBe(true);
  });
});
