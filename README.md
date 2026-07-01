# Maïga Smash — version Next.js (essai)

Version expérimentale de l'app de gestion de stock, réécrite en Next.js + React.
Elle se connecte à la **même base Supabase** que la version Streamlit — donc les
mêmes données, pas de double saisie. Les deux versions peuvent tourner en même
temps sans se gêner.

## Ce qui est reproduit

- Connexion (rôle Employé/Patron + case "rester connecté 7 jours")
- Stock : KPI, recherche en direct, filtre catégorie, quantités éditables
  (champ direct + boutons −/+), mise à jour **vraiment instantanée**
- Scanner : caméra ou saisie manuelle de code-barres
- Historique des mouvements
- Produits : catalogue en libre-service (ajout/modif/suppression), réservé au
  rôle Patron
- Admin : export CSV, réservé au rôle Patron

## 1. Installer les dépendances (une seule fois)

Ouvre un terminal dans ce dossier :

```bash
npm install
```

## 2. Configurer les identifiants

Copie le fichier d'exemple :

```bash
cp .env.local.example .env.local
```

Puis ouvre `.env.local` et remplis avec :
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_KEY` : les mêmes valeurs
  que dans les Secrets de ton app Streamlit
- `EMPLOYE_PASSWORD` / `PATRON_PASSWORD` : les mots de passe actuels
- `COOKIE_SECRET` : une longue chaîne aléatoire (génère-en une avec
  `python3 -c "import secrets; print(secrets.token_hex(32))"`)

## 3. Tester en local

```bash
npm run dev
```

Ouvre http://localhost:3000 dans ton navigateur.

## 4. Mettre en ligne (déploiement gratuit sur Vercel)

1. Crée un nouveau dépôt GitHub (ex: `maiga-next`), pousse ce dossier dedans
   (comme tu l'as fait pour `maiga`)
2. Va sur [vercel.com](https://vercel.com), connecte-toi avec ton compte
   GitHub
3. **Add New → Project**, sélectionne le repo `maiga-next`
4. Avant de cliquer sur Deploy, ouvre **Environment Variables** et ajoute les
   mêmes variables que dans ton `.env.local` (une par une)
5. **Deploy** — ça prend 1-2 minutes

Vercel te donne une URL du type `maiga-next.vercel.app`. C'est celle-là que tu
mets sur l'écran d'accueil du téléphone.

## Différences importantes avec la version Streamlit

- **Sécurité des identifiants Supabase** : ici, la clé Supabase est utilisée
  directement depuis le navigateur (normal avec Next.js + Supabase). Ça veut
  dire qu'il faut activer les règles de sécurité (RLS) côté Supabase avant un
  vrai lancement public, sinon n'importe qui pourrait lire/modifier la base
  en regardant le code source du site. Sur la version Streamlit, la clé
  restait côté serveur uniquement. **Demande-moi si tu veux qu'on configure
  les RLS.**
- Le scanner caméra n'a pas encore été testé sur autant d'appareils que la
  version Streamlit (qui a eu plus d'itérations) — teste-le en priorité sur
  ton téléphone.
- Il n'y a pas encore de mode hors-ligne ni de notifications push — possible
  plus tard si besoin.
