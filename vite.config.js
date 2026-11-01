import {defineConfig} from 'vite';
export default defineConfig({root:'web',base:'./',build:{outDir:'../dist',emptyOutDir:true},worker:{format:'es'},optimizeDeps:{exclude:['@ffmpeg/ffmpeg','@ffmpeg/util']}});
