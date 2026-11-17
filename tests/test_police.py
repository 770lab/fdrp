"""Rejoue le signalement 371a515994b2 : la police « IA » (Fraunces) et l'italique ne doivent revenir nulle part.

Lancer : python3 -m unittest discover -s tests
"""
import pathlib, re, unittest

RACINE = pathlib.Path(__file__).resolve().parent.parent
FICHIERS = [p for p in RACINE.rglob("*") if p.suffix in {".html", ".css", ".js", ".py"} and "tests" not in p.parts and ".git" not in p.parts]
INTERDITES = re.compile(r"fraunces|playfair|cormorant|dm\s*serif|instrument\s*serif|syne", re.I)


class Police(unittest.TestCase):
    def test_aucune_police_ia(self):
        for p in FICHIERS:
            texte = p.read_text(encoding="utf-8")
            self.assertIsNone(INTERDITES.search(texte.split("*/", 1)[-1] if p.suffix == ".css" else texte), f"police refusée dans {p.relative_to(RACINE)}")

    def test_jamais_italique(self):
        for p in FICHIERS:
            self.assertNotRegex(p.read_text(encoding="utf-8"), r"font-style\s*:\s*italic|ital,", f"italique dans {p.relative_to(RACINE)}")

    def test_titres_en_inter_tight(self):
        css = (RACINE / "css" / "site.css").read_text(encoding="utf-8")
        self.assertIn('--serif:"Inter Tight"', css)


if __name__ == "__main__":
    unittest.main()
