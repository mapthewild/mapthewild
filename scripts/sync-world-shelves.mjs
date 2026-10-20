import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
import {adaptWorldReader} from './adapt-world-reader.mjs';

// Only the reviewed public runtime is included. Never recurse through the
// shelf workspace: it also holds source material and private Readwise data.
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The reviewed Nowbrary source is nowbrary.com's folder, named in full so the copy
// works from any checkout of this site. NOWBRARY_SOURCE points it elsewhere.
const source = resolve(process.env.NOWBRARY_SOURCE || resolve(homedir(), 'Documents/mapthewild/nowbrary-shelf/experience'));
const manifest = await readFile(resolve(source, '../build/PUBLISH-MANIFEST.txt'), 'utf8');
const entries = manifest.split('\n').filter(line => /^[a-f0-9]{64}  /.test(line)).map(line => [line.slice(0,64), line.slice(66)]);
if (!entries.length) throw new Error('No reviewed shelf files found.');
const checked = [];
for (const [expected, path] of entries) {
  if (path.startsWith('/') || path.split('/').includes('..')) throw new Error('Invalid shelf path.');
  const data = await readFile(resolve(source, path));
  const hash = createHash('sha256').update(data).digest('hex');
  if (hash !== expected) throw new Error(`Review the shelf manifest before syncing ${path}.`);
  checked.push({path, data});
}
for (const {path, data} of checked) {
  const destination = resolve(project, 'public/world/nowbrary', path);
  await mkdir(dirname(destination), {recursive: true});
  await writeFile(destination, path==='reader/shelf.js'?adaptWorldReader(data.toString('utf8')):data);
}
console.log(`Copied ${checked.length} reviewed public shelf files; adapted only the embedded reader's motion preference.`);
// Derive only the public bindings and reader labels needed by the harbour scene.
const html=await readFile(resolve(source,'gallery.html'),'utf8');
const data=JSON.parse(html.match(/<script id="gallery-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const readerKeys=['id','name','page','contemporary','look','masthead'];
const bookKeys=['id','title','author','volIndex','thick','tall','depth','row','cloth','ink','tex','kind','grain'];
const shelves=data.readers.map(reader=>({...Object.fromEntries(readerKeys.map(key=>[key,reader[key]??null])),books:reader.books.map(book=>Object.fromEntries(bookKeys.map(key=>[key,book[key]??null])))}));
await writeFile(resolve(project,'public/world/shelves.json'),JSON.stringify(shelves));
console.log('Derived the harbour shelf bindings from the reviewed gallery.');
