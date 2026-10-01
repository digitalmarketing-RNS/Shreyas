import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Raleway is the school website's typeface. Loaded from public/fonts (copied from
// @fontsource/raleway, OFL licence); loadFont delays rendering until the files are ready.
const weights = ['500', '600', '700', '800', '900'];

export const fontsReady = Promise.all([
  ...weights.map((weight) =>
    loadFont({family: 'Raleway', url: staticFile(`fonts/raleway-latin-${weight}-normal.woff2`), weight}),
  ),
  loadFont({family: 'Raleway', url: staticFile('fonts/raleway-latin-500-italic.woff2'), weight: '500', style: 'italic'}),
]);
