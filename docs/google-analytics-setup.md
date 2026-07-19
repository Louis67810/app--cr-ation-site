# Connexion directe à Google Analytics et Search Console

Le projet récupère lui-même les statistiques avec `POST /api/analytics`. Aucun workflow n8n n’est nécessaire. Le bouton **Synchroniser les statistiques** du dashboard appelle cette route, puis les mêmes données sont utilisées par l’agent de recherche éditorial.

## 1. Préparer Google Cloud

1. Créer ou choisir un projet dans Google Cloud Console.
2. Activer **Google Analytics Data API** et **Google Search Console API**.
3. Créer un compte de service, puis générer une clé JSON.
4. Dans GA4, ouvrir **Administration → Gestion des accès à la propriété** et ajouter l’adresse e-mail du compte de service avec le rôle Lecteur.
5. Dans Search Console, ajouter la même adresse comme utilisateur de la propriété avec un accès en lecture.

## 2. Variables d’environnement

Copier les valeurs suivantes dans `.env.local` pour le local et dans les variables du projet Vercel pour la production :

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=analytics-reader@mon-projet.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SUPABASE_SERVICE_ROLE_KEY=...
```

Les clés Google sont communes à l’application. L’identifiant numérique GA4, l’identifiant de mesure `G-...` et la propriété Search Console sont enregistrés séparément dans **Dashboard → Paramètres** pour chaque projet.

Ces variables sont exclusivement serveur : ne jamais ajouter le préfixe `NEXT_PUBLIC_`.

## 3. Préparer Supabase

Exécuter les migrations `20260719090000_editorial_page_performance.sql`, `20260719100000_direct_google_analytics.sql` puis `20260719110000_project_analytics_connections.sql`.

## 4. Synchroniser

Pour chaque projet, ouvrir **Dashboard → Paramètres**, enregistrer ses identifiants Google, puis ouvrir **Statistiques** et cliquer sur **Synchroniser les statistiques**. La synchronisation couvre les 90 derniers jours, avec deux jours de décalage pour utiliser les données Search Console finalisées.
