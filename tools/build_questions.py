#!/usr/bin/env python3
"""Génère questions/<slug>.html et questions/index.html à partir de data/questions.json.

Une publication Instagram = une entrée du JSON. Ajouter une entrée puis relancer :
    python3 tools/build_questions.py
Tant que la démo vit sur 770lab.com, chaque page porte noindex (maquette non officielle).
Passer INDEXABLE = True seulement une fois installé sur le domaine du cabinet.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEXABLE = False
SITE = "https://770lab.com/fdrp"  # à remplacer par https://financieredurondpoint.com à l'installation

HEAD = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="robots" content="{robots}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:type" content="article">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23211d17'/%3E%3Ctext x='16' y='21.5' font-family='Georgia,serif' font-size='13' font-weight='700' fill='%23e1b874' text-anchor='middle'%3EFD%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/site.css?v=2">
  <script type="application/ld+json">{jsonld}</script>
</head>
<body>
  <div class="demo-bar" role="note">Maquette proposée par <a href="https://770lab.com">770LAB</a> à Financière du Rond-Point — ce n'est pas le site officiel du cabinet (<a href="https://financieredurondpoint.com/">financieredurondpoint.com</a>).</div>
  <header class="nav is-solid">
    <div class="shell">
      <a href="../" class="brand" aria-label="FDRP, Financière du Rond-Point"><b>FDRP<i>.</i></b><span>Financière du Rond-Point</span></a>
      <nav class="nav-links" aria-label="Navigation principale">
        <a href="../#expertises">Expertises</a>
        <a href="./" {qactive}>Vos questions</a>
        <a href="../#equipe">Équipe</a>
        <a href="../#contact">Contact</a>
      </nav>
      <a href="../#contact" class="btn nav-cta">Devis<span class="lg"> personnalisé</span></a>
    </div>
  </header>
"""

FOOT = """  <footer class="footer">
    <div class="shell">
      <p>© 2026 Financière du Rond-Point · 16 rue de Courcelles, 75008 Paris</p>
      <p>Maquette non officielle réalisée par <a href="https://770lab.com">770LAB</a>.</p>
    </div>
  </footer>
</body>
</html>
"""

CTA = """      <div class="cta-box">
        <p>Une question sur votre situation ?<br>Nos experts vous répondent.</p>
        <a class="btn" href="../#contact">Écrivez-nous <span aria-hidden="true">→</span></a>
      </div>
"""


def card(q, prefix=""):
    return (
        f'        <a class="qcard" href="{prefix}{q["slug"]}.html">\n'
        f'          <span class="tag">{html.escape(q["tag"])}</span>\n'
        f'          <h3>{html.escape(q["question"])}</h3>\n'
        f'          <p>{html.escape(q["teaser"])}</p>\n'
        f'          <span class="more">Lire la réponse →</span>\n'
        f'        </a>\n'
    )


def page(q, others):
    jsonld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "datePublished": q["date"],
        "mainEntity": [{
            "@type": "Question",
            "name": q["question"],
            "acceptedAnswer": {"@type": "Answer", "text": q["short"]},
        }],
    }
    title = q["question"] + " | FDRP expert-comptable Paris 8e"
    if not INDEXABLE:
        title = "[Maquette] " + title
    out = HEAD.format(
        title=html.escape(title),
        desc=html.escape(q["description"]),
        robots="index, follow" if INDEXABLE else "noindex, nofollow",
        canonical=f'{SITE}/questions/{q["slug"]}.html',
        jsonld=json.dumps(jsonld, ensure_ascii=False),
        qactive='class="is-active"',
    )
    source = (
        f'      <p class="source"><strong>Source officielle :</strong> {html.escape(q["source"])}</p>\n'
        if q.get("source") else '      <p class="source"></p>\n'
    )
    out += (
        '  <main class="article">\n    <div class="shell">\n'
        '      <nav class="crumbs" aria-label="Fil d\'Ariane"><a href="../">Accueil</a><span>/</span><a href="./">Vos questions</a></nav>\n'
        f'      <h1>{html.escape(q["question"])}</h1>\n'
        f'      <p class="meta">{html.escape(q["tag"])} · Publié le <time datetime="{q["date"]}">{q["date_fr"]}</time></p>\n'
        '      <div class="answer"><p class="eyebrow">La réponse courte</p>\n'
        f'        <p>{html.escape(q["short"])}</p></div>\n'
        f'      <div class="prose">{q["body"]}</div>\n'
        + source +
        f'      <p class="insta">Cette question a d\'abord été posée sur <a href="{q["insta"]}" rel="noopener">notre Instagram @fdrp.expertcomptable</a>.</p>\n'
        + CTA +
        '      <section class="related"><h2>D\'autres questions de clients</h2>\n        <div class="qgrid">\n'
        + "".join(card(o) for o in others) +
        '        </div></section>\n'
        '    </div>\n  </main>\n'
    )
    return out + FOOT


def hub(qs):
    title = "Vos questions, nos réponses | FDRP expert-comptable Paris 8e"
    if not INDEXABLE:
        title = "[Maquette] " + title
    jsonld = {
        "@context": "https://schema.org", "@type": "CollectionPage", "name": "Vos questions, nos réponses",
        "hasPart": [{"@type": "FAQPage", "name": q["question"], "url": f'{SITE}/questions/{q["slug"]}.html'} for q in qs],
    }
    out = HEAD.format(
        title=html.escape(title),
        desc="Les vraies questions des clients de Financière du Rond-Point : TVA, notes de frais, impôts locaux… Une réponse claire et sourcée à chaque fois.",
        robots="index, follow" if INDEXABLE else "noindex, nofollow",
        canonical=f"{SITE}/questions/",
        jsonld=json.dumps(jsonld, ensure_ascii=False),
        qactive='class="is-active"',
    )
    out += (
        '  <main class="article">\n    <div class="shell" style="max-width:1180px">\n'
        '      <nav class="crumbs" aria-label="Fil d\'Ariane"><a href="../">Accueil</a><span>/</span><span>Vos questions</span></nav>\n'
        '      <h1>Vos questions, <em style="font-style:italic;color:var(--accent);font-weight:400">nos réponses.</em></h1>\n'
        '      <p class="meta" style="max-width:60ch;font-size:16px">Chaque semaine, une vraie question de client sur Instagram. Ici, la réponse complète, avec les références utiles.</p>\n'
        '      <div class="qgrid" style="margin-top:40px">\n'
        + "".join(card(q) for q in qs) +
        '      </div>\n' + CTA +
        '    </div>\n  </main>\n'
    )
    return out + FOOT


def main():
    qs = json.loads((ROOT / "data/questions.json").read_text(encoding="utf-8"))
    for q in qs:  # espaces insécables : « 15,90 € », « − 5,50 € » ne se coupent jamais
        for k in ("short", "teaser", "description", "body", "question"):
            q[k] = q[k].replace(" €", "\u00a0€").replace("− ", "−\u00a0").replace(" %", "\u00a0%")
    qs.sort(key=lambda q: q["date"], reverse=True)
    out_dir = ROOT / "questions"
    out_dir.mkdir(exist_ok=True)
    for q in qs:
        others = [o for o in qs if o["slug"] != q["slug"]][:3]
        (out_dir / f'{q["slug"]}.html').write_text(page(q, others), encoding="utf-8")
    (out_dir / "index.html").write_text(hub(qs), encoding="utf-8")
    urls = [f"{SITE}/", f"{SITE}/questions/"] + [f'{SITE}/questions/{q["slug"]}.html' for q in qs]
    dates = [qs[0]["date"], qs[0]["date"]] + [q["date"] for q in qs]
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n" for u, d in zip(urls, dates))
        + "</urlset>\n", encoding="utf-8")
    print(f"{len(qs)} pages + index -> {out_dir}")


if __name__ == "__main__":
    main()
