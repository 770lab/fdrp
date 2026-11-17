# FDRP — maquette 770LAB

Proposition de site pour **Financière du Rond-Point (FDRP)**, expert-comptable à Paris 8e.
En ligne sur https://770lab.com/fdrp/ — **maquette non officielle** (noindex, bandeau 770LAB).

## Hero « des papiers au bilan »
- `img/seq/` : 241 images (12 i/s) tirées de 4 vidéos Seedance enchaînées entre 5 plans clés
  (papiers en vrac → pile → livre en cuir « Financière du Rond-Point » → bilan → étagère).
- `img/seq/manifest.json` : `count`, `pad`, `ext`, `v`. **Bumper `v`** dès qu'on remplace les images
  (Cloudflare et les navigateurs gardent 4 h les anciennes).
- `js/site.js` : scrub au scroll sur canvas, 5 temps de texte, compteurs (500+, 20+, 9 = chiffres du site actuel).
  En portrait, `FOCUS` recadre chaque plan sur l'action.
- Vidéos sources : `~/fdrp-sources/` (hors dépôt).

## « Vos questions » (une publication Instagram = une page)
1. Ajouter une entrée dans `data/questions.json` (question, réponse courte, corps HTML, source, lien du post).
2. `python3 tools/build_questions.py` → `questions/*.html`, `questions/index.html`, `sitemap.xml`.
3. Ajouter la carte sur l'accueil si c'est une des 3 plus récentes.

Chaque page : titre = la question, réponse courte, réponse développée, source officielle, JSON-LD `FAQPage`.
À l'installation sur le domaine du cabinet : `INDEXABLE = True` et `SITE = "https://financieredurondpoint.com"`
dans `tools/build_questions.py`, puis retirer le bandeau et le noindex de `index.html`.

## Typographie
Titres en **Inter Tight**, texte en **Inter**. Jamais Fraunces ni d'autre serif « fantaisie », jamais d'italique
(propriétaire, 13/11/2026). Test : `python3 -m unittest discover -s tests`.
