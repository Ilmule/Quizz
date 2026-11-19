# 🧠 quiz.exe

> Un site de création et de passage de quizz, avec coloration de code, images, formules mathématiques et audio.

---

## 🤖 À propos de ce projet 

**L'intégralité du code, de la configuration et de cette documentation a été écrite par une intelligence artificielle** (Claude, d'Anthropic), à la demande et avec les retours d'un utilisateur humain au fil d'une conversation. Aucune ligne de code n'a été copiée depuis un tutoriel ou un autre projet : tout a été généré sur mesure pour ce besoin précis.

Concrètement, cela veut dire :
- Le code n'a **pas été écrit, relu ligne par ligne, ni audité par un développeur humain professionnel**. Il fonctionne, mais peut contenir des approximations propres à un projet de petite taille.
- Les choix techniques (Supabase, structure des tables, bibliothèques utilisées) ont été faits pour **rester simples, gratuits et faciles à comprendre pour un débutant**, pas pour être la solution la plus robuste ou la plus optimisée possible.
- Si tu modifies ce projet toi-même (humain ou IA), merci de garder cette note à jour pour que les prochaines personnes qui ouvrent ce dépôt sachent à quoi s'attendre.

Ce README a volontairement été écrit de façon très détaillée, pour qu'une personne qui débute en programmation puisse comprendre comment le site fonctionne, pas seulement comment l'installer.

---

## 📋 Sommaire

1. [Ce que fait le site](#-ce-que-fait-le-site)
2. [Stack technique](#-stack-technique)
3. [Architecture générale](#-architecture-générale)
4. [Structure des fichiers](#-structure-des-fichiers)
5. [Schéma de la base de données](#-schéma-de-la-base-de-données)
6. [Les types de questions](#-les-types-de-questions)
7. [Installation en local](#-installation-en-local)
8. [Déploiement sur GitHub Pages](#-déploiement-sur-github-pages)
9. [Sécurité : comment ça marche](#-sécurité--comment-ça-marche)
10. [Limites connues](#-limites-connues)
11. [Idées d'évolutions possibles](#-idées-dévolutions-possibles)
12. [Dépannage (erreurs courantes)](#-dépannage-erreurs-courantes)

---

## 🎮 Ce que fait le site

**Côté joueur (visiteur, sans compte) :**
- Voir la liste de tous les quizz disponibles, avec leur titre et leur thème.
- Lancer un quizz et répondre à ses questions une par une.
- Les 4 réponses proposées (1 vraie + 3 fausses) sont **mélangées aléatoirement à chaque question**, donc la bonne réponse n'est jamais au même endroit.
- Voir son score à la fin et pouvoir rejouer immédiatement.

**Côté administrateur (toi, connecté avec email + mot de passe) :**
- Créer de nouveaux quizz (titre + thème).
- Ajouter des questions à un quizz, en choisissant parmi 5 types de contenu (voir plus bas).
- Supprimer des questions ou des quizz entiers.
- Un seul compte admin existe (le tien) ; personne d'autre ne peut créer de compte via le site (voir la partie Sécurité).

---

## 🛠 Stack technique

| Brique | Rôle | Pourquoi ce choix |
|---|---|---|
| **React 18** | Bibliothèque pour construire l'interface | Standard de l'industrie, énormément de documentation disponible |
| **Vite** | Outil qui assemble et sert le site | Beaucoup plus rapide que les anciens outils (Create React App) |
| **@vitejs/plugin-react-swc** | Compile le code React avec SWC au lieu de Babel | SWC est écrit en Rust, donc le démarrage et la compilation sont plus rapides |
| **Tailwind CSS v4** | Styles visuels via des classes utilitaires | Évite d'écrire des fichiers CSS séparés, cohérence visuelle rapide |
| **shadcn/ui** (adapté) | Composants d'interface (boutons, champs, cartes) | Composants simples, lisibles, que l'on possède et modifie directement (ce ne sont pas des packages externes à mettre à jour) |
| **lucide-react** | Icônes (cadenas, corbeille, etc.) | Léger et cohérent visuellement |
| **Supabase** | Base de données + authentification + stockage de fichiers | Alternative gratuite et open-source à Firebase, avec une vraie base PostgreSQL derrière |
| **Prism.js** | Coloration syntaxique du code dans les questions | Librairie légère, ne nécessite aucun serveur, n'exécute jamais le code affiché |
| **KaTeX** | Affichage des formules mathématiques (LaTeX) | Plus rapide que MathJax pour un usage simple |
| **GitHub Actions + GitHub Pages** | Hébergement et mise en ligne automatique | Gratuit, et republie le site automatiquement à chaque `git push` |

---

## 🏗 Architecture générale

Le site est une **Single Page Application (SPA)** : une seule page HTML (`index.html`) charge un script JavaScript qui affiche tout le contenu dynamiquement, sans recharger la page à chaque clic.

```
┌─────────────────────┐        requêtes API         ┌──────────────────────┐
│   Navigateur (toi)   │ ───────────────────────────▶ │       Supabase        │
│   React + Vite       │ ◀─────────────────────────── │  (base de données,    │
│   (ce dépôt)          │        réponses JSON         │   authentification,   │
└─────────────────────┘                               │   stockage fichiers)  │
                                                        └──────────────────────┘
```

- Le site **n'a pas de serveur à lui** (pas de Node.js qui tourne en permanence). C'est un ensemble de fichiers statiques (HTML/CSS/JS) qui, une fois chargés dans le navigateur, parlent directement à Supabase via Internet.
- C'est pour ça qu'il peut être hébergé gratuitement sur GitHub Pages : GitHub se contente de distribuer des fichiers, sans rien calculer.
- Toute la "logique métier" (qui a le droit de lire ou d'écrire quoi) est définie dans Supabase, via des règles appelées **Row Level Security (RLS)** — voir la partie Sécurité.

---

## 📁 Structure des fichiers

```
quiz-geek/
├── src/
│   ├── main.jsx                  → point d'entrée, monte React dans la page
│   ├── App.jsx                   → TOUT le site : écrans joueur + admin (voir détail ci-dessous)
│   ├── index.css                 → thème visuel (couleurs, police, animations)
│   ├── lib/
│   │   ├── supabase.js           → connexion à Supabase + fonction d'envoi de fichiers
│   │   └── utils.js              → fonctions utilitaires (ex: mélange aléatoire des réponses)
│   └── components/
│       ├── QuestionMedia.jsx     → affiche une question selon son type (texte/code/image/formule/audio)
│       └── ui/                   → composants d'interface réutilisables (bouton, champ, carte, menu déroulant)
├── public/                       → fichiers statiques bruts (vide pour l'instant)
├── index.html                    → la seule page HTML du site
├── vite.config.js                → configuration de Vite (plugins React/SWC et Tailwind)
├── components.json               → configuration shadcn/ui
├── package.json                  → liste des dépendances et scripts (npm install / npm run dev / npm run build)
├── .env.example                  → modèle du fichier de clés secrètes (à copier en .env)
├── .gitignore                    → fichiers que Git ne doit jamais envoyer (node_modules, .env, dist)
├── supabase.sql                  → script complet pour créer la base de données en partant de zéro
├── supabase_update_1.sql         → script de migration pour ajouter les types de questions à une base déjà existante
└── .github/workflows/deploy.yml  → instructions pour que GitHub republie le site automatiquement
```

### Détail de `App.jsx`

Ce fichier contient plusieurs "composants" React, chacun responsable d'un écran :

| Composant | Rôle |
|---|---|
| `Home` | Liste des quizz disponibles (écran d'accueil) |
| `PlayQuiz` | Déroulement d'une partie : question actuelle, choix des réponses, score |
| `Login` | Formulaire de connexion admin |
| `Dashboard` | Tableau de bord admin : création de quizz, ajout/suppression de questions |
| `App` | Composant racine : gère la navigation entre les écrans et vérifie si quelqu'un est connecté |

---

## 🗄 Schéma de la base de données

Deux tables principales, plus un espace de stockage de fichiers.

### Table `quizzes`
| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique généré automatiquement |
| `title` | text | Titre du quizz |
| `theme` | text | Thème/catégorie (affiché avec un `#`) |
| `created_at` | timestamptz | Date de création (automatique) |

### Table `questions`
| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | Identifiant unique |
| `quiz_id` | uuid | Référence vers le quizz auquel appartient la question (`on delete cascade` : si le quizz est supprimé, ses questions le sont aussi) |
| `type` | text | `text`, `code`, `image`, `math` ou `audio` |
| `question` | text | Selon le type : le texte de la question, le code source, le texte LaTeX de la formule, ou une légende optionnelle |
| `language` | text | Langage de programmation (si `type = 'code'`), ex: `javascript`, `python`... |
| `media_url` | text | Adresse publique de l'image ou du fichier audio (si `type = 'image'` ou `'audio'`) |
| `correct` | text | La bonne réponse |
| `wrong` | text[] | Tableau de 3 mauvaises réponses (contrainte : exactement 3) |
| `created_at` | timestamptz | Date de création |

### Stockage (`storage.buckets`)
Un bucket nommé `quiz-media`, public en lecture, qui contient les images et fichiers audio envoyés par l'admin.

### Row Level Security (RLS)
Chaque table a des règles qui définissent qui peut faire quoi :
- **Lecture (`select`)** : autorisée pour tout le monde, y compris les visiteurs non connectés → c'est ce qui permet de jouer sans compte.
- **Écriture (`insert`, `update`, `delete`)** : autorisée uniquement pour les utilisateurs **authentifiés** (donc toi, une fois connecté).

---

## 🧩 Les types de questions

Le menu déroulant dans le formulaire d'ajout de question propose 5 supports :

| Type | Ce que l'admin remplit | Ce que voit le joueur |
|---|---|---|
| 📝 **Texte** | Une phrase | La question affichée normalement |
| 💻 **Code** | Le code source + un langage choisi dans une liste | Le code affiché avec une coloration syntaxique (comme dans un éditeur), **jamais exécuté** |
| 🖼️ **Image** | Un fichier image + une légende optionnelle | L'image affichée, avec sa légende si elle existe |
| 📐 **Formule mathématique** | Une formule écrite en syntaxe LaTeX (ex: `x^2 + y^2 = z^2`) | La formule rendue visuellement comme dans un manuel de maths |
| 🎵 **Audio** | Un fichier son + une légende optionnelle | Un lecteur audio intégré, avec sa légende si elle existe |

Les réponses (1 bonne + 3 mauvaises) restent toujours du texte simple, quel que soit le type de la question.

**Important sur le code :** la coloration est purement visuelle (faite par la bibliothèque Prism.js dans le navigateur). Le site n'exécute jamais le code d'une question, que ce soit côté navigateur ou côté serveur — il n'y a d'ailleurs pas de serveur capable de le faire.

---

## 💻 Installation en local

### Prérequis
- [Node.js](https://nodejs.org) (version 18 ou plus récente)
- Un compte [Supabase](https://supabase.com) (gratuit)

### Étapes

1. **Créer la base de données Supabase**
   - Crée un nouveau projet sur supabase.com.
   - Dans *SQL Editor*, colle et exécute le contenu de `supabase.sql`.
   - Dans *Authentication → Users*, crée ton compte admin (email + mot de passe).
   - Dans *Authentication → Providers → Email*, désactive "Allow new users to sign up" (sinon n'importe qui pourrait créer un compte admin).
   - Dans *Project Settings → API*, note le *Project URL* et la *Publishable key* (anciennement appelée "clé anon").

2. **Configurer le projet**
   ```bash
   cp .env.example .env
   ```
   Puis édite `.env` et remplace les valeurs :
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
   ```

3. **Installer les dépendances et lancer le site**
   ```bash
   npm install
   npm run dev
   ```
   Le site est accessible à l'adresse affichée dans le terminal (en général `http://localhost:5173`).

### Script de build (pour la mise en ligne)
```bash
npm run build
```
Cette commande génère un dossier `dist/` contenant les fichiers statiques prêts à être hébergés n'importe où (GitHub Pages, Netlify, Vercel, un serveur web classique...).

---

## 🚀 Déploiement sur GitHub Pages

Le fichier `.github/workflows/deploy.yml` automatise tout : à chaque `git push` sur la branche `main`, GitHub construit le site et le publie.

1. Pousse ce dossier sur un dépôt GitHub (`git init`, `git add .`, `git commit`, `git push`).
2. Dans *Settings → Secrets and variables → Actions*, crée deux secrets :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (mêmes valeurs que dans ton fichier `.env` local)
3. Dans *Settings → Pages*, choisis la source **"GitHub Actions"**.
4. Dans l'onglet *Actions*, vérifie que le robot termine avec une coche verte.
5. Ton site est en ligne à l'adresse `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.

---

## 🔐 Sécurité : comment ça marche

Un point qui surprend souvent : **la clé Supabase utilisée dans le site (`VITE_SUPABASE_ANON_KEY`) est visible par n'importe qui** qui ouvre les outils de développement de son navigateur. Ce n'est **pas un problème**, et voici pourquoi :

- Cette clé, dite "publishable" ou "anon", est **conçue pour être publique**. Elle ne donne aucun pouvoir par elle-même.
- La vraie sécurité vient des **règles RLS** définies dans `supabase.sql` : elles disent explicitement à la base de données "n'importe qui peut lire, mais seul un compte connecté peut écrire".
- Il existe une autre clé, la **clé "secrète" (service_role)**, qui elle donne un accès total sans aucune restriction. **Cette clé ne doit JAMAIS apparaître dans le code du site** (elle n'est d'ailleurs utilisée nulle part dans ce projet).
- Le mot de passe admin n'est jamais stocké dans le code : il est géré entièrement par le système d'authentification de Supabase, qui le stocke de façon chiffrée (hashée).

---

## ⚠️ Limites connues

Ce projet a été conçu pour être simple et gratuit, pas pour un usage professionnel à grande échelle. Quelques limites à avoir en tête :

- **Un seul rôle admin** : il n'y a pas de système de permissions avancé (plusieurs admins avec des droits différents, par exemple).
- **Pas de limite de taille affichée pour les fichiers** envoyés (images/audio) : le plan gratuit de Supabase offre 1 Go de stockage au total, au-delà il faudra passer à un plan payant ou faire le ménage.
- **Pas de modification d'une question existante** : actuellement on peut seulement ajouter ou supprimer, pas éditer une question déjà créée.
- **Pas de minuteur, de niveaux de difficulté ou de classement** des scores entre joueurs.
- Le code n'a pas été testé avec des outils de test automatisés (pas de suite de tests).

---

## 💡 Idées d'évolutions possibles

- Ajouter un bouton "Modifier" sur chaque question.
- Ajouter un minuteur par question.
- Ajouter un classement des meilleurs scores par quizz (nécessiterait une nouvelle table `scores`).
- Permettre plusieurs comptes admin avec des quizz séparés par auteur.
- Ajouter la vidéo (lien YouTube intégré) comme nouveau type de question.
- Ajouter une recherche/filtre par thème sur la page d'accueil.

---

## 🩹 Dépannage (erreurs courantes)

| Message d'erreur | Cause probable | Solution |
|---|---|---|
| `'vite' is not recognized...` | `npm install` n'a pas été lancé, ou pas dans le bon dossier | Vérifie que tu es dans le dossier avec `package.json`, puis lance `npm install` |
| `Could not find the table 'public.quizzes'...` | Le script `supabase.sql` n'a pas (encore) été exécuté | Va dans Supabase → SQL Editor, colle `supabase.sql`, clique sur Run |
| `remote: Permission to .../... denied` | Le dépôt GitHub visé n'appartient pas au compte connecté sur l'ordinateur | Vérifie l'adresse avec `git remote -v`, corrige avec `git remote set-url origin ...` |
| Page blanche après déploiement | Les secrets GitHub Actions n'ont pas été renseignés avant le premier déploiement | Ajoute les secrets puis relance le workflow ("Re-run all jobs") dans l'onglet Actions |
| `The symbol "X" has already been declared` | Conflit de nom entre deux imports dans le code | Renommer l'un des deux éléments (déjà corrigé dans ce projet pour `Play`) |

---

*Document généré par une intelligence artificielle (Claude, Anthropic), en octobre/novembre 2026, dans le cadre d'une conversation guidée par un utilisateur humain.*
