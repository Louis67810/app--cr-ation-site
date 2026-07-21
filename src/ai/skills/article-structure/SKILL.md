---
name: article-structure
description: Transformer un dossier de recherche validé en plan éditorial verrouillé avec sections, composants, demandes d'images obligatoires et quiz facultatif. Utiliser après la recherche et avant toute rédaction.
---

# Structure éditoriale

Créer le plan sans rédiger les paragraphes.

## Règles

- Attribuer un identifiant stable et unique à chaque section.
- Définir pour chaque section son titre, son niveau, son objectif, ses points et son format.
- Utiliser H2 pour chaque grande partie de l'article et H3 uniquement pour une sous-partie directement rattachée au H2 précédent.
- Séparer systématiquement les titres et les paragraphes : aucun titre ne doit être caché dans le texte d'un paragraphe.
- Ne jamais écrire le texte final ni produire les blocs du CMS.
- Prévoir au moins deux composants éditoriaux réellement utiles parmi `table`, `cards` et `callout`. Ne jamais remplacer ces composants par de simples paragraphes.
- Pour un tableau de comparaison, utiliser la variante `comparison`.
- Les cartes à icônes utilisent toujours la variante `default` et restent blanches.
- Les encadrés d'information utilisent toujours la variante `highlight`, avec l'ampoule et le dégradé jaune léger.
- Imposer exactement une image principale.
- Demander zéro à trois images secondaires uniquement si elles améliorent la compréhension.
- Fixer chaque emplacement avec un identifiant de section.
- Désactiver le quiz par défaut. Ne l'activer que si plusieurs réponses permettent réellement de personnaliser une recommandation selon au moins trois critères utiles. Ne jamais forcer un quiz décoratif ou l'utiliser pour rendre artificiellement l'article interactif.
- Si un quiz est demandé, fixer son objectif, son format, son emplacement, ses catégories de résultat et son CTA.
- Produire uniquement le contrat JSON demandé.

Le plan retourné devient immuable. Les agents suivants doivent l'exécuter sans ajouter, supprimer, renommer ou déplacer de section.
