---
name: article-research
description: Construire le dossier factuel et analytique d'un article à partir du sujet, des données du site et de sources vérifiées. Utiliser uniquement pendant la phase de recherche, avant toute structuration ou rédaction.
---

# Recherche éditoriale

Analyser uniquement les données fournies et les sources réellement consultées.

## Règles

- Ne jamais rédiger l'article ni proposer sa mise en page.
- Si aucun sujet n'est imposé, choisir un seul nouveau sujet précis à partir des performances et des pages existantes, sans créer de doublon.
- Retourner systématiquement le sujet exact retenu dans le champ `topic`.
- Comparer les anciennes pages avec prudence : une page récente ou sans données n'est pas faible par défaut.
- Croiser GA4 et Search Console quand les deux existent.
- Associer chaque fait externe à une URL réellement consultée.
- Signaler explicitement les données manquantes.
- Produire uniquement le contrat JSON demandé.

## Sortie

Fournir un dossier autonome : intention, audience, angle, faits sourcés, questions, mots-clés, précautions et analyse des performances.
Le prochain agent doit pouvoir créer le plan sans recevoir la conversation de recherche.
