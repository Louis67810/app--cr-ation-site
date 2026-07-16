This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Atelier editorial local

Le tableau de bord contient un pipeline automatique en trois phases :

1. recherche web et constitution d'un dossier source ;
2. structuration du titre, de l'angle et du plan H2/H3 ;
3. redaction de l'article et ajout du brouillon au CMS.

Pour faire tourner les agents sur le PC plutot que dans une fonction Vercel :

1. ajoutez `OPENROUTER_API_KEY` dans `.env.local` (voir `.env.example`) ;
2. double-cliquez sur `Lancer-Atelier-Local.cmd`, ou lancez `npm run local` ;
3. gardez la fenetre ouverte pendant la journee ;
4. utilisez l'onglet **Agents IA** ouvert automatiquement sur `localhost:3000`.

Dans ce mode, les appels longs sont executes par Node.js sur le PC. Supabase ne sert qu'a authentifier l'utilisateur, charger le projet et sauvegarder le brouillon final. Fermer la fenetre arrete le serveur local.

Une page ouverte sur le domaine Vercel execute necessairement ses routes sur Vercel. Pour qu'un clic sur la page hebergee declenche un PC eteint ou situe derriere une box, il faudrait ajouter un worker local et une petite file de travaux distante. Le mode local evite cette infrastructure et reste le plus simple pour une utilisation a la journee.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
