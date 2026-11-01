#!/usr/bin/env python3
"""Local Mixline prototype. Audio is processed locally, never uploaded externally."""
import json, math, os, subprocess, tempfile, threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
PORT=int(os.environ.get('MIXLINE_PORT','8790'))
ROOT=Path(__file__).resolve().parent
FFMPEG=Path(os.environ.get('MIXLINE_FFMPEG','/Applications/Ultimate Vocal Remover.app/Contents/Resources/ffmpeg'))
BUSY=threading.BoundedSemaphore(1)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT/'web'),**kw)
    def reply(self,status,value):
        data=json.dumps(value).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
    def do_POST(self):
        if self.headers.get('Host') not in (f'127.0.0.1:{PORT}',f'localhost:{PORT}') or self.headers.get('Origin') not in (f'http://127.0.0.1:{PORT}',f'http://localhost:{PORT}'):
            return self.reply(403,{'error':'Local same-origin requests only.'})
        if self.path!='/api/stretch':return self.reply(404,{'error':'Not found'})
        try:
            rate=float(self.headers.get('X-Tempo-Ratio','nan'));length=int(self.headers.get('Content-Length','0'))
            if not math.isfinite(rate) or not .5<=rate<=2 or not 0<length<=100*1024**2:raise ValueError()
        except ValueError:return self.reply(400,{'error':'Choose audio under 100 MB and a tempo ratio between 0.5 and 2.'})
        if not BUSY.acquire(blocking=False):return self.reply(429,{'error':'Another track is being matched. Please wait.'})
        try:
            audio=self.rfile.read(length)
            if len(audio)!=length:return self.reply(400,{'error':'Incomplete audio'})
            with tempfile.TemporaryDirectory(prefix='mixline-') as temp:
                source=Path(temp)/'input.audio';target=Path(temp)/'matched.wav';source.write_bytes(audio)
                result=subprocess.run([str(FFMPEG),'-nostdin','-v','error','-threads','2','-i',str(source),'-t','1800','-vn','-filter_threads','2','-af',f'atempo={rate:.9f}','-ar','44100','-ac','2','-c:a','pcm_s16le',str(target)],capture_output=True,timeout=240)
                if result.returncode:return self.reply(422,{'error':'Could not process that audio file. Try MP3, WAV or M4A.'})
                data=target.read_bytes()
            self.send_response(200);self.send_header('Content-Type','audio/wav');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
        except subprocess.TimeoutExpired:self.reply(504,{'error':'Tempo matching timed out. Try a shorter track.'})
        except (BrokenPipeError,ConnectionResetError):pass
        except Exception:self.reply(500,{'error':'Tempo processing unavailable. Check the local FFmpeg installation.'})
        finally:BUSY.release()
    def log_message(self,*args):pass
if __name__=='__main__':
    print(f'Mixline: http://127.0.0.1:{PORT}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
