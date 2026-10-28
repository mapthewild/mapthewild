// Per-tab reading anchors. Reflow can change page numbers, so save the source passage and offset.
(() => {
 const Reader=window.BookReader;if(!Reader)return;
 const open=Reader.prototype.open,remember=Reader.prototype.remember;
 const key=book=>'journey:book:'+location.pathname+':'+book.id;
 Reader.prototype.open=function(book,g){try{const a=JSON.parse(sessionStorage.getItem(key(book))||'null');if(a&&Number.isInteger(a.source)&&a.source>=-1&&Number.isInteger(a.offset)&&a.offset>=0)this.saved.set(book.id,a);}catch{}return open.call(this,book,g);};
 Reader.prototype.remember=function(){const result=remember.apply(this,arguments);try{sessionStorage.setItem(key(this.book),JSON.stringify(this.anchor));}catch{}return result;};
})();
