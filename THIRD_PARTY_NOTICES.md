# Third-party software

- `@ffmpeg/ffmpeg` 0.12.15: MIT, https://github.com/ffmpegwasm/ffmpeg.wasm. Its license is included in the npm package.
- `@ffmpeg/core` 0.12.10: GPL-2.0-or-later, https://github.com/ffmpegwasm/ffmpeg.wasm/releases. Source and build scripts: https://github.com/ffmpegwasm/ffmpeg.wasm. FFmpeg source: https://github.com/FFmpeg/FFmpeg/tree/n5.1.4. Build dependencies and patches are listed in the upstream build scripts. The core is unmodified; install the exact version in package-lock.json to obtain the distributed ESM/WASM files.
- BPM estimation was adapted from the user's DeckFlow implementation. Mixline is independently hosted and does not connect to DeckFlow services.

Dependency license files are installed by `npm ci`. The unmodified FFmpeg package license is copied into the public build alongside the engine.
