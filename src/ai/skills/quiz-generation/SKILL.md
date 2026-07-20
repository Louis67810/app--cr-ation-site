---
name: quiz-generation
description: Générer la configuration d'un quiz interactif quand le plan éditorial verrouillé le demande. Utiliser uniquement lorsque quizRequest.enabled vaut true.
---

# Quiz éditorial

Créer un outil de décision utile, jamais un simple divertissement.

## Règles

- Respecter l'objectif, le format, les catégories, le CTA et l'emplacement fixés par le plan.
- Produire trois à six questions et deux à cinq résultats.
- Pour un quiz visuel, produire exactement deux choix par question avec un prompt et un alt précis.
- Pour un diagnostic ou une recommandation, produire deux à quatre choix.
- Ne jamais modifier le plan de l'article.
- Ne jamais écrire de code React : produire la configuration du moteur de quiz existant.
- Produire uniquement le contrat JSON demandé.
