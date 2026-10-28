// Copy the approved assets. The integrated visit.js and sound.js are maintained in public/
// and must not be overwritten by the earlier study.
// This script writes local files only. It does not publish or use an account.
import {copyFile,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const study=resolve(site,'../design-explorations/territories/blog-update');
const dest=resolve(site,'public/world/connected/studies');
const visit='journey-storyboard/future-dads-art/visit';
const files=[
 'world-g/vendor/three.module.js','world-g/vendor/three.core.js','world-g/vendor/BufferGeometryUtils.js',
 'world-g/assets/boat-painted-materials-v1.png','world-g/assets/traveller-painted-face-v1.png',
 'world-g/shore-depth/painted-boat-palette.js',
 'journey-storyboard/asset-study/shore-layout/motion/painted-boat.js',
 'journey-storyboard/asset-study/shore-layout/motion/art/shore-empty-v1.png',
 'journey-storyboard/asset-study/shore-layout/motion/art/traveller-poses-v1.png',
 'journey-storyboard/future-dads-art/two-styles/art/comic-island-v1.png',
 'journey-storyboard/asset-study/shared-map/art/nowbrary-map-v1.png',
 'journey-storyboard/asset-study/shared-map/art/future-dads-map-v1.png',
 'journey-storyboard/future-dads-art/two-styles/art/comic-radio-v1.png',
 'journey-storyboard/future-dads-art/radio-approach/sound-profile.mjs',
 'journey-storyboard/future-dads-art/radio-approach/audio/whats-in-a-song.m4a',
 'connected-places/assets/fonts/AmaticSC-Bold.ttf','connected-places/assets/fonts/ebgaramond.woff2',
 ...['frames.mjs','boat-depth.mjs','art/boarding-v1.png','art/walking-front-back-v4.png','art/walking-v2.png'].map(p=>visit+'/character/'+p)
];
for(const item of await readdir(resolve(study,visit),{withFileTypes:true}))if(item.isFile()&&/\.(html|css|js|mjs)$/.test(item.name)&&!['visit.js','sound.js'].includes(item.name))files.push(visit+'/'+item.name);
for(const item of await readdir(resolve(study,visit,'audio')))if(/\.(mp3|m4a)$/.test(item))files.push(visit+'/audio/'+item);
for(const file of files){await mkdir(dirname(resolve(dest,file)),{recursive:true});await copyFile(resolve(study,file),resolve(dest,file));}
const boat=await readFile(resolve(study,'journey-storyboard/asset-study/shore-layout/motion/painted-boat.js'),'utf8');
const palette=await readFile(resolve(study,'world-g/shore-depth/painted-boat-palette.js'),'utf8');
const target=resolve(site,'src/lib/world/illustrated');await mkdir(target,{recursive:true});
await writeFile(resolve(target,'boat.js'),'// Synced by scripts/sync-future-dads-study.mjs\n'+boat.replace("'../../../../world-g/vendor/three.module.js'","'three'").replace("'../../../../world-g/vendor/BufferGeometryUtils.js'","'three/addons/utils/BufferGeometryUtils.js'").replace("'../../../../world-g/shore-depth/painted-boat-palette.js'","'./palette.js'"));
await writeFile(resolve(target,'palette.js'),'// Synced by scripts/sync-future-dads-study.mjs\n'+palette.replace("'../vendor/three.module.js'","'three'"));
console.log(`Copied ${files.length} local runtime files and synced the illustrated boat.`);
