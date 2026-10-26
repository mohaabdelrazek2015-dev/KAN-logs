import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;
const pages = ['index', 'services', 'about', 'news', 'contact', 'tracking', '404'];

// Small HTML plugin:
//   <!-- @include header page="services" -->  -> contents of src/partials/header.html
//   <img data-photo="ship-sea" ...>           -> src, srcset, width and height from src/images.json
function kanHtml() {
  const partial = (name) => readFileSync(resolve(root, 'src/partials', `${name}.html`), 'utf8');
  const images = () => JSON.parse(readFileSync(resolve(root, 'src/images.json'), 'utf8'));

  return {
    name: 'kan-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const manifest = images();

        html = html.replace(/<!--\s*@include\s+(\w+)(?:\s+page="(\w+)")?\s*-->/g, (_, name, page) =>
          partial(name).replace(/\{\{current:(\w+)\}\}/g, (__, key) =>
            key === page ? ' aria-current="page"' : '',
          ),
        );

        return html.replace(/<img\b([^>]*?)\sdata-photo="([\w-]+)"([^>]*)>/g, (_, before, name, after) => {
          const photo = manifest[name];
          if (!photo) throw new Error(`Unknown photo "${name}" (run npm run images)`);
          const srcset = photo.widths.map((w) => `/images/${name}-${w}.webp ${w}w`).join(', ');
          const fallback = photo.widths.find((w) => w >= 1200) ?? photo.widths.at(-1);
          return `<img${before} src="/images/${name}-${fallback}.webp" srcset="${srcset}" width="${photo.width}" height="${photo.height}"${after}>`;
        });
      },
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [kanHtml()],
  // keep the /*! credit comment in the minified CSS
  esbuild: { legalComments: 'inline' },
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(root, `${p}.html`)])),
      output: { banner: '/*! KAN Logistics website | Designed & developed by Mohammed Abdelrazek */' },
    },
  },
});
