# Mixline

A separate timeline editor for DJ mixes. DeckFlow files, services and deployments are unchanged.

## Use online

The web release runs entirely in your browser: add or drop audio files, correct each song's original BPM, choose a project BPM and click **Match all songs**. Arrange overlapping songs, drag the clip body to reposition it, drag the lower edges to trim and the green top handles to set fades. Precise source in/out and fade values are available above the playlist. Export produces a stereo 44.1 kHz / 16-bit WAV.

Audio files are not uploaded. Browser-based FFmpeg `atempo` preserves pitch while matching BPM. The audio engine downloads about 31 MB on first use. Processing speed and maximum mix size depend on your device; a desktop browser is recommended for long mixes. Preview starts muted; exports remain audible. Reloading clears the session; project saving is not implemented.

BPM detection is an estimate and may require manual correction. Beat phase is estimated, not a guaranteed downbeat grid. No fixed song-count limit; each file may be up to 30 minutes / 100 MB. Audio decoding, stretching and export use browser memory. Use audio you have permission to mix and export.

## Development

Requires Node 22. Run `npm ci`, `npm test`, `npm run build` and `npm run preview`. Vite builds `web/` into `dist/` using relative asset paths, including FFmpeg and the BPM worker. No server or secrets are needed for the web release. Main is deployed to GitHub Pages by `.github/workflows/pages.yml` after tests and build succeed; pull requests run checks without deploying.

The optional Mac prototype remains available with `python3 server.py` at http://127.0.0.1:8790. Only that exact local port uses the native FFmpeg endpoint. It defaults to the existing Ultimate Vocal Remover app bundle; override `MIXLINE_FFMPEG` or `MIXLINE_PORT` if needed. Other ports/hostnames use browser processing. Temporary native processing files are cleaned after each request.

## Third-party software

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Test audio and personal songs are excluded from this repository.
