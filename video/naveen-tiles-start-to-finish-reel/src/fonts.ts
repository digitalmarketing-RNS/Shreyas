import { continueRender, delayRender, staticFile } from 'remotion';

const faces: { family: string; file: string; descriptors?: FontFaceDescriptors }[] = [
  { family: 'Anton', file: 'fonts/Anton-Regular.ttf' },
  { family: 'Inter', file: 'fonts/Inter.ttf', descriptors: { weight: '100 900' } },
  { family: 'Archivo', file: 'fonts/Archivo.ttf', descriptors: { weight: '100 900', stretch: '62% 125%' } },
];

const handle = delayRender('Loading fonts');
Promise.all(
  faces.map(async ({ family, file, descriptors }) => {
    const face = new FontFace(family, `url(${staticFile(file)}) format('truetype')`, descriptors);
    document.fonts.add(await face.load());
  }),
)
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error('Font load failed', err);
    continueRender(handle);
  });
