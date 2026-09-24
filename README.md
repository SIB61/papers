# papers — a markdown blog

Write everything as markdown. Every page gets a path, and the path *is* the page.
PV, portfolio, project notes — all in `papers`.

- **Write** at `/write` — full markdown editor with a live preview, WYSIWYG toolbar,
  drag & paste image upload (to Cloudflare R2), and `⌘S` to save.
- **Path** = URL. Set a post's path to `portfolio/cv` and it renders at `/portfolio/cv`.
- **Types**: `draft` and `published` — drafts are only visible to you.
- **Themes**: six flat black-and-white themes (Paper, Contrast, Graphite, Ivory, Noir,
  Ink). Switch them live from the header; the theme is stored per-browser and
  applies to the whole site.

## Requirements

- PostgreSQL running on `localhost:5432` — either a `postgres` role with password
  `postgres`, or a `postgres` role created for a database named `blog_all`.
- Optional: Cloudflare R2 bucket for uploaded images. Without it, the editor works
  but image upload will report that R2 is not configured.

## Setup

```bash
cp .env.example .env.local   # then edit DATABASE_URL / R2 credentials
npm install
npm run db:migrate           # create schema
npm run db:seed              # optional starter pages
npm run dev                  # http://localhost:3000
```

### Database

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blog_all
```

`npm run db:generate` creates migrations when the schema changes
(`lib/db/schema.ts`).

### Images → Cloudflare R2

Fill these in `.env.local`:

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxx.r2.dev   # optional, for public reads
```

Uploads are stored under `uploads/<timestamp>-<id>.<ext>`. The editor inserts
`![alt](<url>)` at your cursor, and you can also just drag images in or paste
them straight from the clipboard.

## How a page becomes a URL

The `slug` column holds the path (`portfolio/cv`). The root catch-all route
(`app/[...slug]`) serves anything that isn't a reserved route. Only `published`
posts are public; drafts return 404 unless you open them with
`?preview=1` (the editor does this for you).

## Structure

```
app/
  page.tsx            # public index (published pages only)
  [...slug]/page.tsx  # renders any page at its path
  write/              # the desk: list + editor
  actions.ts          # server actions (create/update/delete)
  api/upload/         # POST → R2
lib/
  db/                 # drizzle + schema
  themes.ts           # theme registry
```

## Theme system

Themes are plain CSS variable blocks keyed by `html[data-theme="..."]` in
`app/globals.css`. Add a new one by copying a block and registering it in
`lib/themes.ts` (name, swatches, description). The header's theme picker and the
pre-paint init script handle the rest automatically.