---
name: article-research
description: Construire le dossier factuel et analytique d'un article à partir du sujet, des données du site et de sources vérifiées. Utiliser uniquement pendant la phase de recherche, avant toute structuration ou rédaction.
---

# Recherche éditoriale

Analyser uniquement les données fournies et les sources réellement consultées.

## Règles

- Ne jamais rédiger l'article ni proposer sa mise en page.
- Si aucun sujet n'est imposé, choisir un seul nouveau sujet précis à partir des performances et des pages existantes, sans créer de doublon.
- Considérer chaque titre et chaque chemin d'article existant comme une exclusion éditoriale : ne jamais en proposer une paraphrase, une variante proche ou le même problème sous un autre titre.
- Une page avec peu d'impressions, peu de clics ou peu de vues ne doit jamais servir de modèle à un nouvel article. Son sujet est déjà couvert et reste exclu.
- Une page gagnante peut seulement révéler un besoin général. Le nouveau sujet doit viser un problème concret adjacent, une intention différente et un vocabulaire principal différent.
- Avant de retenir le sujet, le comparer explicitement à toute la liste existante et l'abandonner dès que deux idées centrales se recoupent fortement.
- Retourner systématiquement le sujet exact retenu dans le champ `topic`.
- Comparer les anciennes pages avec prudence : une page récente ou sans données n'est pas faible par défaut.
- Croiser GA4 et Search Console quand les deux existent.
- Associer chaque fait externe à une URL réellement consultée.
- Signaler explicitement les données manquantes.
- Produire uniquement le contrat JSON demandé.

## Sortie

Fournir un dossier autonome : intention, audience, angle, faits sourcés, questions, mots-clés, précautions et analyse des performances.
Le prochain agent doit pouvoir créer le plan sans recevoir la conversation de recherche.
