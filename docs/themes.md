# Weekly Themes

Source of truth for Inpaintly's weekly drops. Humans edit this file. Claude
syncs any changes into `src/lib/themes.json` (the file the app actually
reads). Do **not** edit `themes.json` by hand.

## How the schedule works

- **One theme per week.** Changes every Monday (`week_of` date = that Monday).
- **Four prompts per theme.** They appear as the 4 tiles on the theme picker.
- **One sample image per prompt.** Lives at `/public/samples/<slug>/<id>.jpg`
  and renders inside each tile. Sample generation is a separate pipeline
  (see `docs/sample-generation.md` once built).
- **`active_week`** at the top of `themes.json` controls which week shows.
  To flip to next week's drop, bump that single field + redeploy.

## Prompt-writing guide

Each prompt has four fields:

- **id** — short unique slug, e.g. `gno-1`. Never renumber existing IDs;
  past generations reference them.
- **label** — what appears on the tile. 1-3 words. Noun phrase.
- **prompt** — the actual text sent to flux-fill-pro. Be specific about:
  *subject, fabric/material, colour, lighting, style of photography*.
  Avoid the word "person" — the model already knows the masked region is
  a person. End with "professional photography, sharp focus" or similar
  quality booster.
- **negative_prompt** — things to avoid. Always include
  `blurry, distorted, extra limbs, deformed hands, bad anatomy, low quality, cartoon, painting, text, watermark`
  for outfits/people; shorten for background/accessory prompts.

## Active schedule

| Week of | Slug | Display name | Status |
|---|---|---|---|
| 2026-04-20 | `girls-night-out` | Girls Night Out | **ACTIVE** |
| 2026-04-27 | `bollywood-glam` | Bollywood Glam | queued |
| 2026-05-04 | `ceo-headshot` | CEO Headshot | queued |
| 2026-05-11 | `beach-sunset` | Beach Sunset | queued |

---

## Week of 2026-04-20 — Girls Night Out

> Rooftop vibes, sequins, neon, main character energy

| id | Label | Prompt |
|---|---|---|
| `gno-1` | Sequin Dress | An elegant silver sequin mini dress with thin straps, sparkling under warm golden club lighting, smooth fabric draping, professional fashion photography, sharp focus, 8k detail |
| `gno-2` | Little Black Dress | A form-fitting little black cocktail dress, classic silhouette, satin finish, lit by moody rooftop bar lighting with bokeh city lights, editorial fashion photography |
| `gno-3` | Rooftop Bar | A luxurious rooftop bar at sunset, city skyline in the background, string lights, blurred people in the distance, golden hour, cinematic shallow depth of field |
| `gno-4` | Gold Jewelry | Chunky gold statement earrings and layered necklaces, warm reflective metallic highlights, styled on the subject's neckline, high-end fashion jewelry photography |

## Week of 2026-04-27 — Bollywood Glam

> Ornate, regal, unforgettable

| id | Label | Prompt |
|---|---|---|
| `bwg-1` | Red Lehenga | A vibrant red and gold embroidered lehenga choli, intricate zari work, sheer dupatta draped elegantly, traditional Indian wedding outfit, ornate detailing, professional photography |
| `bwg-2` | Regal Sherwani | A cream-and-gold embroidered sherwani with matching safa turban, ornate buttons, intricate threadwork, groom portrait, rich textures, soft window light |
| `bwg-3` | Palace Courtyard | An ornate Mughal palace courtyard with marble pillars, red sandstone arches, hanging lanterns, warm evening light, shallow depth of field, cinematic |
| `bwg-4` | Bridal Jewelry | A complete bridal jewelry set: maang tikka on the forehead, elaborate gold jhumkas, layered gold necklaces with rubies and emeralds, nath nose ring, ornate, reflective |

## Week of 2026-05-04 — CEO Headshot

> LinkedIn-ready, studio quality, confidence

| id | Label | Prompt |
|---|---|---|
| `ceo-1` | Navy Suit | A tailored navy blue suit with crisp white dress shirt, silk tie in burgundy, clean lapels, professional corporate portrait lighting, sharp focus on fabric texture |
| `ceo-2` | Executive Blazer | A charcoal grey fitted blazer over a white silk blouse, minimalist professional women's executive outfit, sharp tailoring, studio headshot lighting, confident professional aesthetic |
| `ceo-3` | Modern Office | A modern glass-walled corporate office with soft bokeh, floor-to-ceiling windows showing city skyline, clean minimalist interior, neutral tones, professional corporate headshot backdrop |
| `ceo-4` | Premium Watch | A luxury silver chronograph watch on the wrist, subtle metallic lapel pin, professional executive styling details, sharp focus, high-end product photography quality |

## Week of 2026-05-11 — Beach Sunset

> Golden hour escape, salt and sand

| id | Label | Prompt |
|---|---|---|
| `bs-1` | Linen Beach Shirt | A relaxed cream linen button-up shirt, breezy fabric with rolled sleeves, open collar, sun-bleached texture, warm golden hour beach lighting, cinematic depth |
| `bs-2` | Flowing Maxi Dress | A flowing white cotton maxi dress with delicate embroidery on the hem, gentle breeze motion, flattering A-line silhouette, barefoot beach vacation aesthetic, golden hour |
| `bs-3` | Tropical Beach | A pristine tropical beach at sunset, turquoise water, white sand, palm trees, distant sailboats, warm orange-pink sky, cinematic shallow depth of field, travel photography |
| `bs-4` | Boho Accessories | A wide-brimmed straw sun hat, delicate gold layered necklaces, a natural rattan beach bag, bohemian beach vacation styling, warm golden light, fashion editorial |

---

## Template for new weeks

Copy-paste this block at the bottom, fill in, tell Claude to sync.

```
## Week of YYYY-MM-DD — <Display Name>

> <one-line description — appears above the tiles>

| id | Label | Prompt |
|---|---|---|
| `<slug>-1` | <Outfit or thing 1> | <prompt text> |
| `<slug>-2` | <Outfit or thing 2> | <prompt text> |
| `<slug>-3` | <Setting or backdrop> | <prompt text> |
| `<slug>-4` | <Accessory or detail> | <prompt text> |
```

Typical pattern: **2 outfits + 1 setting + 1 accessory** — gives users a
range of inpainting options (body, background, detail). You can deviate
when a theme demands it.
