# Production checklist — Porsche Reunions

Notes and tasks to run through before or when going to production.

---

## Environment variables

- [ ] `PUBLIC_SANITY_PROJECT_ID` configured in Netlify
- [ ] `PUBLIC_SANITY_DATASET` configured in Netlify (or defaults to `production`)
- [ ] `PUBLIC_SAAS_FORM_URL` removed from Netlify if still present (no longer used)

## Sanity

- [ ] At least one `galleryPhoto` document published and visible in the `production` dataset
- [ ] Photo ordering configured via drag-and-drop in Studio
- [ ] Captions in ES and EN reviewed

## Storystream

- [ ] Submission widget (`ZGNiZDg4ZTdkMjI1ZjgxY2Y4.js`) loads correctly on modal open
- [ ] Published stories widget (`NTU2NmUyMDU2YzMxYTQ3NTZm.js`) loads correctly on scroll into Stories section
- [ ] Both `#stry-wrapper` mount points render the widgets as expected

## Frontend build

- [ ] `npm run build:web` completes without errors
- [ ] Homepage sections render correctly: Hero, Interlude, Quotes, Reunions, Gallery (photos), Stories (Storystream embed)
- [ ] "Escribe tu historia" modal opens and Storystream submission widget renders
- [ ] Language switch (ES / EN) works correctly

## Netlify deploy

- [ ] Build logs show no errors
- [ ] Deploy preview or production URL loads correctly
- [ ] No SSR functions active (all pages are SSG)
