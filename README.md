# KAN Logistics website

Source for [kanlogs.com](https://kanlogs.com), built by Mohammed Abdelrazek.

It's a plain static site (HTML, CSS and a bit of JS) bundled with Vite. The scroll animations use GSAP and Lenis, and the globe on the homepage is drawn on a canvas, no map library.

## Running it

You need Node 20.19+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` puts the production files in `dist/`.

## Where things are

Each page is its own HTML file in the root (`index.html`, `services.html`, ...). The header and footer live in `src/partials/` and get pulled into every page at build time through the `<!-- @include header -->` comments. All the styling is in `src/styles/main.css` and the scripts are in `src/js/`.

For photos I use `<img data-photo="name">` instead of a normal src, and the build fills in the responsive sizes. To add or swap a photo, drop it in `assets-src/photos/` and run `npm run images` (this needs Python with Pillow).

## Contact form

The form posts to the PocketBase `enquiries` collection that's on the current Hostinger setup (`/hcgi/platform`). That path doesn't exist on Vercel, so the form will show an error there until it points somewhere else. Set `VITE_API_BASE` to the new backend URL in Vercel's environment variables and redeploy.

## Deploying

It's connected to Vercel, so pushing to `main` is enough. The settings are in `vercel.json`. There's also a `.htaccess` in `public/` in case it ever goes on Apache hosting.

Photo, video and font licences are in [CREDITS.md](CREDITS.md).
