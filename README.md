# Menu

Application de planification de repas hebdomadaire (React + Vite), pensée mobile.

## Développement local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (par défaut http://localhost:5173).

## Build de production

```bash
npm run build      # génère le dossier dist/
npm run preview    # sert le build localement pour vérifier
```

## Déploiement sur GitHub Pages

Le dépôt contient un workflow GitHub Actions (`.github/workflows/deploy.yml`) qui
build et déploie automatiquement à chaque push sur `main`.

Une seule chose à faire côté GitHub, une fois :
1. **Settings → Pages → Build and deployment → Source : GitHub Actions**

Ensuite, chaque `git push` sur `main` met le site à jour. L'URL apparaît dans
Settings → Pages et dans l'onglet Actions.

`vite.config.js` utilise `base: "./"` (chemins relatifs), donc l'app fonctionne
que le site soit servi à la racine (`user.github.io`) ou dans un sous-dossier
(`user.github.io/menu/`).

## Données

La persistance utilise `localStorage` lorsqu'elle tourne en statique (les données
restent locales au navigateur/appareil, pas de synchro entre appareils).

## Structure

- `src/App.jsx` — toute l'application (composant + styles)
- `src/main.jsx` — point d'entrée React
- `index.html` — page hôte
