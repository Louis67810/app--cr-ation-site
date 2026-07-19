# Données réelles pour l’agent de recherche

L’agent lit `project_page_performance` au lancement de la phase `research`. Cette table peut être alimentée par n8n, Make ou un autre serveur qui récupère GA4, Google Search Console et AgenceFlow.

## Configuration

1. Appliquer `supabase/migrations/20260719090000_editorial_page_performance.sql`.
2. Configurer `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur.
3. Choisir une longue valeur aléatoire pour `ANALYTICS_INGEST_SECRET`.
4. Dans n8n, envoyer un `POST` vers `/api/integrations/editorial-performance` avec l’en-tête `Authorization: Bearer VOTRE_SECRET`.

## Exemple de payload

```json
{
  "ownerId": "uuid-du-proprietaire",
  "projectKey": "paysagiste",
  "periodStart": "2026-06-20",
  "periodEnd": "2026-07-19",
  "pages": [
    {
      "path": "/blog/quand-tailler-haies",
      "title": "Quand tailler ses haies ?",
      "firstSeenAt": "2026-05-02T08:30:00Z",
      "googleAnalytics": {
        "sessions": 120,
        "engagementSeconds": 96,
        "pageViews": 148,
        "totalUsers": 103,
        "sessionsPerUser": 1.16,
        "active28DayUsers": 88
      },
      "searchConsole": {
        "clicks": 31,
        "impressions": 2400,
        "ctr": 0.0129,
        "position": 8.4
      },
      "agenceflow": {
        "viewsLastWeek": 42,
        "visitorsLastWeek": 35,
        "sessionsLastWeek": 39,
        "clicksLastWeek": 8,
        "formSubmitsLastWeek": 2,
        "avgDurationSeconds": 104,
        "maxScrollDepth": 82,
        "lastSeenAt": "2026-07-19T10:00:00Z",
        "dailyStats": []
      },
      "customSignals": {
        "crmQualifiedLeads": 2,
        "newsletterSignups": 5
      }
    }
  ]
}
```

Les champs manquants deviennent `0`, mais l’agent reçoit aussi l’état des connexions. Il doit donc signaler une donnée absente au lieu de conclure qu’une page est mauvaise.

## Mode démo économique

```env
AI_DEMO_MODE=true
OPENROUTER_DEMO_MODEL=qwen/qwen3-4b:free
OPENROUTER_DEMO_WEB_SEARCH=false
```

Ce réglage force toutes les phases texte, y compris la structure, la rédaction et le quiz, sur le modèle de démonstration. La recherche web reste désactivée afin de ne pas facturer le moteur de recherche. Les vraies données historiques déjà importées restent utilisées.
