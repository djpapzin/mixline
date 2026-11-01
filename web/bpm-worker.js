import {detectBpm} from './bpm.js';
self.onmessage=e=>{try{self.postMessage({grid:detectBpm(e.data.samples,e.data.sampleRate)});}catch{self.postMessage({grid:null});}};
