/* Content is laid out into finite sheets before a turn begins. A source passage
   can span sheets; its identity, marks and word order survive every reflow. */
window.BookReader = class BookReader {
  constructor(left,right,nav) {
    this.left=left;this.right=right;this.nav=nav;
    this.previous=nav.querySelector('[data-previous]');this.next=nav.querySelector('[data-next]');this.status=nav.querySelector('[data-position]');
    this.contents=this.element('select','reader-contents');this.contents.setAttribute('aria-label','Book contents');this.contents.hidden=true;
    this.contents.addEventListener('change',()=>nav.dispatchEvent(new CustomEvent('reader-jump',{detail:Number(this.contents.value)})));
    nav.append(this.contents);
    this.saved=new Map();this.position=0;this.anchor={source:0,offset:0};this.transition=null;
    this.measure=document.createElement('div');this.measure.className='open-book reader-measure';
    this.measure.setAttribute('aria-hidden','true');this.measure.inert=true;document.body.append(this.measure);
  }
  entriesFor(book) {
    let entries;
    if(Array.isArray(book.pages)&&book.pages.length)entries=book.pages.map(p=>({...p}));
    else entries=[{kind:'personal',text:book.why||''},...(book.highlights||[]).map(h=>({head:h.head||[h.chapter,h.page!=null?`Page ${h.page}`:h.location].filter(Boolean).join(' · '),scan:h.scan,flow:[{line:h.text||'',kinds:['underline']},...(h.note?[{note:h.note}]:[])]}))];
    if(!book.openOnPassage&&!['card','personal'].includes(entries[0]?.kind))entries.unshift({kind:'personal',text:book.why||''});
    return entries.map((e,sourceIndex)=>({...e,sourceIndex}));
  }
  open(book,g) {
    this.book=book;this.sources=this.entriesFor(book);this.transition=null;
    this.contents.replaceChildren();this.contents.hidden=!book.contents;
    if(book.contents)for(const entry of [{sourceIndex:-1,head:book.contentsTitle||'About this article'},...this.sources]){
      const option=this.element('option','',entry.head);option.value=entry.sourceIndex;this.contents.append(option);
    }
    this.anchor=this.saved.get(book.id)||{source:book.titlePage?-1:0,offset:0};
    this.resize(g);this.paint();
  }
  resize(g) {
    this.rendered=new Map();this.waitingForPaint=false;
    this.mobile=g.mobile;this.width=g.width;this.height=g.height;
    const dialog=this.left.closest('dialog');this.measure.dataset.variant=dialog.dataset.variant||'0';
    for(const property of ['--handwriting','--spine-color','--annotation-color','--annotation-ink'])this.measure.style.setProperty(property,dialog.style.getPropertyValue(property));
    this.measure.dataset.historical=dialog.dataset.historical||'';
    this.measure.dataset.binding=this.book.look?.kind||'';
    Object.assign(this.measure.style,{width:g.width+'px',height:g.height+'px'});
    this.pages=this.paginate();
    const match=this.pages.findIndex(p=>p.sourceIndex===this.anchor.source && p.start<=this.anchor.offset && (p.end>this.anchor.offset || p.start===p.end));
    this.position=Math.max(0,match);
    if(!this.mobile && this.position>0)this.position=1+2*Math.floor((this.position-1)/2);
    Object.assign(this.nav.style,{left:(g.openLeft+(g.mobile?24:60))+'px',top:(g.top+g.height+30)+'px',width:(g.width-(g.mobile?48:76))+'px'});
  }
  element(tag,cls,text) {const el=document.createElement(tag);el.className=cls;if(text!=null)el.textContent=text;return el;}
  link(url,label) {
    try {const u=new URL(url);if(!['https:','http:'].includes(u.protocol))return null;const a=this.element('a','source-link',label);a.href=u.href;a.target='_blank';a.rel='noopener';return a;}catch{return null;}
  }
  tokensFor(entry) {
    if(entry.ink || entry.english || Array.isArray(entry.key)) {
      const items=[],add=(field,value,extra={})=>{if(value)items.push({field,value,...extra});};
      const translated=()=>{
        add('label',entry.englishFirst?'In English':'English translation');
        if(entry.englishInk)for(const item of entry.englishInk) {
          const kind=Object.keys(item).find(k=>['print','hand','struck','struckHand'].includes(k));
          add('translation',item[kind],{kind});
        } else add('translation',entry.english);
      };
      if(entry.englishFirst)translated();
      if(entry.ink)for(const item of entry.ink) {
        const kind=Object.keys(item).find(k=>['print','hand','struck','struckHand'].includes(k));
        add('document',item[kind],{kind,later:item.later});
      } else {
        if(entry.englishFirst)add('label',entry.originalLabel||'In French');
        add('original',entry.text);
      }
      if(!entry.englishFirst&&entry.english)translated();
      add('source',entry.source);add('where',entry.where);
      for(const key of Array.isArray(entry.key)?entry.key:[entry.key])add('key',key);
      const legend=entry.legend||(entry.ink?this.book.inkKey:null);
      if(legend?.length)add('legend',legend.map(item=>item[1]).join(' · '),{legendItems:legend});
      if(entry.english&&this.book.englishBy)add('source','English: '+this.book.englishBy);
      if(entry.detail)add('image',' ',{detail:entry.detail});
      return items.flatMap((item,run)=>(item.field==='image'||item.field==='legend'?[item.value]:(item.value.match(/\S+\s*|\s+/gu)||[''])).map(value=>({...item,value,run,rich:true})));
    }
    const items=entry.kind==='card'||entry.kind==='personal'
      ? ['text','source','key'].filter(k=>typeof entry[k]==='string').map(k=>({field:k,value:entry[k]}))
      : (entry.flow||[...(entry.marks||[]).map(m=>({line:m.text,kinds:[m.kind||'underline']})),...(entry.note?[{note:entry.note}]:[])]).map(item=>({field:item.line!==undefined?'line':item.note!==undefined?'note':'gap',value:item.line??item.note??'',kinds:item.kinds||[],ink:item.ink}));
    const tokens=[];
    for(const [run,item] of items.entries()) {
      const words=item.field==='gap'?['']:(item.value.match(/\S+\s*|\s+/gu)||['']);
      for(const word of words)tokens.push({...item,run,value:word});
    }
    return tokens;
  }
  fragment(entry,tokens,start,end,part) {
    const page={...entry,start,end,part,parts:1,flow:[]};
    if(entry.kind==='personal'||entry.kind==='card')for(const k of ['text','source','key'])delete page[k];
    let previous=null;
    for(const token of tokens.slice(start,end)) {
      if(previous?.run===token.run)previous.value+=token.value;
      else {previous={...token};page.flow.push(previous);}
    }
    if(tokens[start]?.rich) {
      page.richFlow=page.flow;delete page.flow;
    } else if(entry.kind==='personal'||entry.kind==='card') {
      for(const item of page.flow)page[item.field]=(page[item.field]||'')+item.value;
      delete page.flow;
    } else page.flow=page.flow.map(item=>item.field==='gap'?{gap:true}:{[item.field]:item.value,kinds:item.kinds,run:item.run,ink:item.ink});
    return page;
  }
  usage(page) {
    const sheet=this.content(page);this.measure.replaceChildren(sheet);
    const body=sheet.querySelector('.sheet-text');
    const rect=body?.getBoundingClientRect(),available=rect?sheet.getBoundingClientRect().bottom-48-rect.top:0;
    return {height:rect?.height||0,available};
  }
  fits(page) {const u=this.usage(page);return u.height<=u.available;}
  paginate() {
    const leaves=[];
    for(const entry of this.sources) {
      const tokens=this.tokensFor(entry),parts=[];let start=0;
      // Prefer whole passage/annotation groups. Split a group only when it
      // cannot fit by itself, then leave its note with the nearest source line.
      const boundaries=[];
      for(let i=1;i<=tokens.length;i++)if(i===tokens.length || tokens[i].run!==tokens[i-1].run) {
        const field=tokens[i-1].field;
        if(field==='note'||field==='key'||i===tokens.length||(tokens[i-1].rich&&['document','original','translation','source','where','legend'].includes(field)))boundaries.push(i);
      }
      if(!tokens.length){parts.push(this.fragment(entry,tokens,0,0,0));}
      while(start<tokens.length) {
        const part=parts.length;
        let lo=start,hi=tokens.length;
        while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(this.fits(this.fragment(entry,tokens,start,mid,part)))lo=mid;else hi=mid-1;}
        let end=Math.max(start+1,lo);
        if(end<tokens.length) {
          const complete=boundaries.filter(n=>n>start&&n<=end).at(-1);
          if(complete)end=complete;
          else {
            const runEnds=[];
            for(let i=start+1;i<=end;i++)if(i===tokens.length||tokens[i].run!==tokens[i-1].run)runEnds.push(i);
            const near=runEnds.filter(n=>n>start+(end-start)*.65).at(-1);if(near)end=near;
            if(tokens[end]?.field==='note' && tokens[end-1]?.field==='line') {
              let lineStart=end-1;while(lineStart>start&&tokens[lineStart-1].run===tokens[end-1].run)lineStart--;
              if(lineStart>start)end=lineStart;
            }
          }
        }
        // Balance the printed context around a whole attached note.
        // A fixed word reserve can exceed a narrow leaf and produce repeated
        // one-word pages. Never back the cut up to the current page's start.
        if(this.book.attachedNotes && end<tokens.length) {
          const noteStart=tokens.findIndex((token,index)=>index>=start&&token.field==='note');
          if(noteStart>start){
            let noteEnd=noteStart+1;while(noteEnd<tokens.length&&tokens[noteEnd].run===tokens[noteStart].run)noteEnd++;
            if(end<noteEnd){
              let tail=start,limit=noteStart;
              while(tail<limit){const mid=Math.floor((tail+limit)/2);if(this.fits(this.fragment(entry,tokens,mid,noteEnd,part)))limit=mid;else tail=mid+1;}
              if(tail>start&&tail<noteStart){
                const balanced=Math.max(tail,Math.floor((start+noteStart)/2));
                const sentence=tokens.findIndex((token,index)=>index>=balanced&&index<=noteStart-10&&/[.!?][”’"')]*\s*$/.test(tokens[index-1]?.value||''));
                const cut=sentence>=0?sentence:balanced;
                if(cut<end)end=cut;
              }
            }
          }
        }
        parts.push(this.fragment(entry,tokens,start,end,part));start=end;
      }
      // Do not strand a sentence on an otherwise empty continuation sheet.
      if(parts.length>1) {
        const j=parts.length-2,a=parts[j],b=parts[j+1],last=this.usage(b);
        if(last.height<last.available*.4) {
          let best=Infinity,pair=null;
          const candidates=boundaries.filter(n=>n>a.start&&n<b.end);
          if(['wikipedia','essay'].includes(entry.origin)){
            for(let cut=a.start+1;cut<b.end;cut++)if(tokens[cut].run!==tokens[cut-1].run||/[.!?][”’"')]*\s*$/.test(tokens[cut-1].value))candidates.push(cut);
          }
          for(const cut of candidates) {
            if(this.book.attachedNotes&&tokens[cut]?.field==='note')continue;
            const left=this.fragment(entry,tokens,a.start,cut,j),right=this.fragment(entry,tokens,cut,b.end,j+1);
            const l=this.usage(left),r=this.usage(right),score=Math.abs(l.height-r.height);
            if(l.height<=l.available && r.height<=r.available && score<best){best=score;pair=[left,right];}
          }
          if(pair)parts.splice(j,2,...pair);
        }
      }
      for(const page of parts){page.parts=parts.length;page.index=leaves.length;leaves.push(page);}
    }
    if(this.mobile&&this.book.titlePage?.length){
      leaves.unshift({kind:'title',sourceIndex:-1,start:0,end:0,part:0,parts:1});
      leaves.forEach((page,index)=>page.index=index);
    }
    this.measure.replaceChildren();return leaves;
  }
  content(page) {
    const root=this.element('div','reading-content reader-sheet');
    root.dataset.entry=page.index??'';root.dataset.source=page.sourceIndex??'';root.dataset.part=page.part??0;root.dataset.parts=page.parts??1;root.dataset.kind=page.kind||'passage';root.dataset.origin=page.origin||'';
    if(page.kind==='blank'){root.setAttribute('aria-hidden','true');return root;}
    if(page.kind==='title') {
      if(this.book.titlePage?.length) {
        root.classList.add('reader-title','edition-title');
        const type=this.element('div','edition-type');
        for(const [style,text] of this.book.titlePage) {
          const safe=style.split(' ').filter(c=>['xs','s','m','l','xl','wide','bold','it','pencil','hand','struck','gap','push','rule','orn'].includes(c)).map(c=>'type-'+c).join(' ');
          type.append(this.element('div',safe,text||''));
        }
        root.append(type);
        if(this.book.credit){
          root.classList.add('has-credit');
          const credit=this.element('footer','edition-credit');credit.append(this.element('p','',this.book.credit.text));
          const links=this.element('p','credit-links');
          for(const item of this.book.credit.links||[]){const a=this.link(item.href,item.label);if(a)links.append(a);}
          credit.append(links);root.append(credit);
        }
        if(this.book.link){const a=this.link(this.book.link.href,this.book.link.label||'About this copy ↗');if(a){a.classList.add('edition-source');a.title=this.book.link.text||'About this copy';root.append(a);}}
        return root;
      }
      root.classList.add('reader-title');root.append(this.element('h2','reader-book-title',this.book.title),this.element('p','reader-author',this.book.author));
      if(this.book.meta)root.append(this.element('p','reader-meta',this.book.meta));
      if(this.book.link){const a=this.link(this.book.link.href,this.book.link.text||'Source');if(a)root.append(a);}
      return root;
    }
    const body=this.element('div','sheet-text');
    if(page.richFlow) {
      root.append(this.element('p','running-book',this.book.title),this.element('h2','source-heading',(page.head||'About this copy')+(page.part?' · continued':'')));
      let paragraph=null,previous='';
      for(const item of page.richFlow) {
        if(item.legendItems){
          const legend=this.element('p','historical-legend');
          for(const [kind,text] of item.legendItems)legend.append(this.element('span','ink-'+kind,text));
          body.append(legend);paragraph=null;previous='';continue;
        }
        if(item.field==='image') {
          const figure=this.element('figure','manuscript-detail'),img=document.createElement('img');
          img.src=item.detail.src;img.alt=item.detail.alt||'';img.width=item.detail.w;img.height=item.detail.h;
          figure.append(img,this.element('figcaption','',item.detail.caption));body.append(figure);paragraph=null;previous='';continue;
        }
        const inline=['document','translation'].includes(item.field);
        if(!inline||!paragraph||previous!==item.field){paragraph=this.element('p','historical-'+item.field);body.append(paragraph);}
        const span=this.element('span','ink-'+(item.kind||'print')+(item.later?' ink-later':''),item.value);
        span.dataset.run=item.run;
        if(item.kind==='struck'||item.kind==='struckHand')span.setAttribute('aria-label','Crossed out: '+item.value);
        paragraph.append(span);if(inline)paragraph.append(document.createTextNode(' '));previous=item.field;
      }
    } else if(page.kind==='personal'||page.kind==='card') {
      root.append(this.element('h2','page-heading',this.book.title));
      if(page.part)body.append(this.element('p','continued-label','continued'));
      if(page.text)body.append(this.element(page.kind==='card'&&page.printed?'blockquote':'p',page.kind==='personal'?'marginalia':page.printed?'intro-quote':'annotation',page.text));
      if(page.source)body.append(this.element('p','entry-source',page.source));
      if(page.key)body.append(this.element('p','entry-key',page.key));
    } else {
      const running=this.element('p','running-book');running.append(this.element('span','',this.book.title));
      if(page.part)running.append(this.element('span','continued-label','continued'));
      else if(page.isExcerpt)running.append(this.element('span','continued-label','excerpt'));
      root.append(running,this.element('h2','source-heading',page.head||''));
      const flow=this.element('div','excerpt-flow');let group=null,scored=false;
      for(const item of page.flow||[]) {
        if(item.line!==undefined) {
          const score=(item.kinds||[]).includes('score'),check=(item.kinds||[]).includes('check');
          if(!group||score!==scored||check||item.kinds?.includes('paragraph')||(this.book.verse&&/^[\W_]*[A-Z]/.test(item.line))){group=this.element('p','excerpt-lines'+(score?' scored':'')+(check?' checked':'')+(item.ink?' in-ink':''));flow.append(group);scored=score;}
          const line=this.element('span','source-line',['readwise','wikipedia','essay'].includes(page.origin)?item.line.trim():item.line);line.dataset.run=item.run??'';
          for(const kind of item.kinds||[])if(['underline','box','strike'].includes(kind))line.classList.add('mark-'+kind);
          group.append(line,document.createTextNode(' '));
        } else {
          group=null;
          if(item.note!==undefined){const aside=this.element('aside','annotation'+(item.ink?' in-ink':''));aside.dataset.run=item.run??'';aside.append(this.element('span','sr-only','Note: '),document.createTextNode(page.origin==='readwise'?item.note.trim():item.note));flow.append(aside);}
          else if(item.gap)flow.append(this.element('p','passage-gap','…'));
        }
      }
      body.append(flow);
    }
    root.append(body);
    const footer=this.element('footer','folio-footer');
    if(page.scan){const a=this.link(page.scan,page.scanLabel||'Source page ↗');if(a)footer.append(a);}
    else footer.append(this.element('span','',''));
    if(page.part<page.parts-1)footer.append(this.element('span','continues','continues →'));
    footer.append(this.element('span','folio-number',page.index==null?'':String(page.index+1)));root.append(footer);
    return root;
  }
  spread(position=this.position) {
    const title={kind:'title'};
    if(this.mobile)return [position?this.pages[position-1]:title,this.pages[position]];
    return position===0?[title,this.pages[0]]:[this.pages[position],this.pages[position+1]||{kind:'blank'}];
  }
  destination(direction,position=this.position) {
    if(direction<0 && position===0)return null;
    const p=this.mobile?position+direction:direction>0?(position===0?1:position+2):(position<=1?0:position-2);
    return p<0||p>=this.pages.length?null:p;
  }
  remember() {if(this.book)this.saved.set(this.book.id,{...this.anchor});}
  goToSource(source) {
    if(!this.book.contents||this.transition||this.waitingForPaint)return false;
    const target=source===-1?0:this.pages.findIndex(p=>p.sourceIndex===source);
    if(target<0)return false;
    this.position=!this.mobile&&target>0?1+2*Math.floor((target-1)/2):target;
    this.anchor={source,offset:0};this.remember();this.paint();return true;
  }
  mount(host,page) {
    const key=`${page.kind||'passage'}:${page.index??''}`;
    let el=this.rendered.get(key);
    if(!el) {
      el=this.content(page);this.rendered.set(key,el);
      el.addEventListener('pointerdown',()=>{if(page.sourceIndex!=null && !this.transition){this.anchor={source:page.sourceIndex,offset:page.start};this.remember();}});
    }
    // Keep the already-exposed sheet and its paint layer alive at landing.
    if(host.firstElementChild!==el)host.replaceChildren(el);
    host.setAttribute('aria-label',page.kind==='title'?this.book.title:page.head||this.book.title);
  }
  paint() {
    const [left,right]=this.spread();this.mount(this.left,left);this.mount(this.right,right);
    this.left.inert=this.mobile;this.right.inert=false;this.sync();
  }
  sync() {
    const busy=!!this.transition || this.waitingForPaint;
    this.previous.disabled=busy||this.destination(-1)===null;this.next.disabled=busy||this.destination(1)===null;this.nav.hidden=this.pages.length<2;
    const end=this.mobile?this.position:Math.min(this.position+1,this.pages.length-1);
    this.status.textContent=this.position===0?(this.book.startLabel||(this.book.openOnPassage&&!this.mobile?'Selected passages':'About this book')):end===this.position?`Page ${this.position+1} of ${this.pages.length}`:`Pages ${this.position+1}–${end+1} of ${this.pages.length}`;
    if(this.contents){this.contents.disabled=busy;if(this.book.contents)this.contents.value=String(this.position===0?-1:this.anchor.source);}
    this.nav.dataset.cursor=this.position;this.nav.dataset.total=this.pages.length;
    this.left.closest('dialog').dataset.reading=Math.max(this.position,this.transition?.to??0)>0?'passages':'introduction';
  }
  snapshot(page) {const frame=this.element('div','page-snapshot');frame.append(this.content(page));return frame;}
  prepare(direction) {
    if(this.transition)return this.transition.direction===direction?this.transition:null;
    const to=this.destination(direction);if(to===null)return null;
    const before=this.spread(),after=this.spread(to);
    this.transition={direction,to,front:this.snapshot(direction>0?before[1]:after[1]),back:this.snapshot(direction>0?after[0]:before[0])};
    if(direction>0)this.mount(this.right,after[1]);else this.mount(this.left,after[0]);
    this.left.inert=true;this.right.inert=true;this.sync();return this.transition;
  }
  finish(commit) {
    if(commit&&this.transition){this.position=this.transition.to;const p=this.pages[this.position];this.anchor={source:p.sourceIndex,offset:p.start};this.remember();}
    this.transition=null;this.paint();
  }
};
