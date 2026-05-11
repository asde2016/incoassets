const svgtofont = require('svgtofont');
const path = require('path');

svgtofont({
  src: path.resolve(process.cwd(), 'iconfont/templates'), // svg path
  dist: path.resolve(process.cwd(), 'assets/fonts/incofont/'), // output path
  fontName: 'inco-icons', // font name
  css: true, // Create CSS files.
  useNameAsUnicode: true,
  svgicons2svgfont: {
    fontHeight: 1000,
    normalize: true,
  },
  website: {
    title: 'incofont',
    version: '0.1.0',
    meta: {
      description: 'Converts SVG fonts to TTF/EOT/WOFF/WOFF2/SVG format.',
      keywords: 'svgtofont,TTF,EOT,WOFF,WOFF2,SVG',
    },
    description: 'Inco Webfonts',
  },
}).then(() => {
  console.log('done!');
});
