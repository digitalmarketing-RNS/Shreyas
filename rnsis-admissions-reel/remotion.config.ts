import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(17);
Config.setPixelFormat('yuv420p');
// Tagged BT.709, limited (TV) range: what Instagram and phone players expect.
Config.setColorSpace('bt709');
Config.setAudioBitrate('320k');
Config.setConcurrency(3);
// Point at a local Chrome/Chromium headless shell when Remotion can't download its own,
// e.g. REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
