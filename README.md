# CraftVia Web

Source code for the CraftVia project website. The site is built with Astro and deployed to Cloudflare Workers.

- `/` — English, canonical
- `/ja/` — Japanese translation

The website introduces the project and links to project documentation and hardware repositories. Detailed technical specifications belong in `craftvia-docs` or the relevant hardware repository, not in this repository.

## Local development

```sh
npm install
npm run dev
```

The development server is normally available at `http://localhost:4321`.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the Cloudflare build locally |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run sync-products` | Synchronize product metadata and representative images |
| `npm run generate-types` | Generate Wrangler environment types |

## Product metadata

The hardware overview is generated from `product.json` in the Core-S G031, Station-S, and MakerCard-S repositories. `npm run dev`, `npm run build`, and `npm run deploy` run the synchronization automatically before starting their main command.

During local development, the synchronization script prefers sibling repositories next to `craftvia-web`. When those repositories are not present, such as in a standalone public build, it retrieves the canonical metadata and representative WebP images from the corresponding GitHub repositories. Publish the hardware repositories before deploying a web build that depends on new metadata.

Generated metadata and copied images are build inputs under `src/generated/` and `public/generated/`; they are intentionally excluded from Git.

## Deployment

Authenticate once with `npx wrangler login`, then run:

```sh
npm run deploy
```

For automated deployment, connect this repository to Cloudflare Workers Builds. Use `npm run build` as the build command and `npx wrangler deploy` as the deploy command.

## Language policy

English is the source of truth. Japanese content is maintained as an official translation and should be updated in the same change whenever practical. If the two versions differ, the English version takes precedence.

See [README.ja.md](README.ja.md) for Japanese.
