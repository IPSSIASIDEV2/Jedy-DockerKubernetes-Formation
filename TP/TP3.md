# Docker - TP3 : Projet avec Docker Compose 
> **Sommaire du TP** :
>- Cloner le repository
>- Créer le Dockerfile Back
>- Créer le Dockerfile Front
>- Créer le Docker Compose
>- Lancer le projet
>- Ajouter les variables d'environnement
>- Mise en place d'un workflow de production

## 0 - Vérifier l'installation
Nous allons simplement commencer par vérifier que docker compose est bien installé sur notre machine. Pour ce faire, nous allons simplement lancer la commande :
```sh
$ docker-compose version
Docker Compose version v2.2.1
```

## 1 - Cloner le repository

La première étape est de cloner le repo github contenant le projet.

Le repo est disponible sur [ce lien](https://github.com/elie91/Jedy-StarWarsDocker)

Le projet est composé d'un dossier ``back``, contenant l'api `NodeJS Express`, ainsi que d'un dossier `front`, contenant 
une app ``react``

Nous allons utiliser ``Docker Compose`` pour mettre en place l'environnement de travail permettant de faire tourner et communiquer
ces deux apps, avec une base de données `postgres`

## 2 - Création du Dockerfile Front

Pour lancer le front de notre app avec docker-compose, nous allons avoir besoin de passer par un ``Dockerfile`` pour
créer une image personnalisée. Nous avons besoin en effet d'installer les dépendances de l'app et de lancer la commande pour démarrer l'app react

Dans le dossier `front`, créez un fichier `Dockerfile` avec le contenu suivant :  
`````dockerfile
FROM node:alpine
# Spécifie le répertoire par défaut
WORKDIR /app
# Copie le fichier package.json dans le dossier /app du container
COPY package.json ./
# installe les dépendances
RUN npm install
# copie le reste des fichiers dans le container
COPY . .
# expose le port 3000
EXPOSE 3000
# Démarre l'app react
CMD ["npm", "start"]

`````

Vous devriez être familier avec les étapes ci-dessus que l'on a déja vues dans les TP précédents.

## 3 - Création du Dockerfile Back

Pour lancer le back de notre app avec docker-compose, nous allons avoir besoin de passer par un ``Dockerfile`` pour
créer une image personnalisée. 

Dans le dossier `back`, créez un fichier `Dockerfile` avec le contenu suivant :

````dockerfile
FROM node:alpine
WORKDIR "/app"
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "start"]
````

Les étapes sont similaires au Dockerfile du front. De façon générale, les ``Dockerfile`` de développement pour des app `javascript` seront
quasiment toujours identiques.

## 4- Création du Docker Compose

Nous allons maintenant créer le fichier ``docker-compose.yml`` pour créer et organiser nos containers.
Nous allons également créer un service `postgres` pour la base de données de notre app

A la racine du projet, au même niveau que les dossiers ``back`` et `front`, créez un fichier `docker-compose.yml`
avec le contenu suivant :
`````yaml
version: "3.6"
services:
  
  # Service pour la base de données
  database:
    # Utilise l'image de base postgres
    image: postgres:12-alpine
    restart: "on-failure"
    # Map le port 7082 local au port 5432 du container
    ports:
      - 7082:5432

  # service pour le back
  back:
    # Indique de build l'image à partir du Dockerfile qui se trouve dans le dossier back
    build: "back"
    # Map le port 4000 local au port 4000 du container
    ports:
      - 4000:4000
    restart: "on-failure"
    # Indique une dépendance avec le service database
    depends_on:
      - database
    # Définit des variables d'environnement nécessaires au fonctionnement du back
    environment:
      - API_ENTRYPOINT=https://swapi.dev/api
      - JWT_SECRET=MyBestSecret

  # service pour le front
  front:
    build: "front"
    restart: "on-failure"
    # Les deux paramètres suivants sont nécessaires dans le cas d'un container react
    tty: true
    stdin_open: true
    # Map le port 3000 local au port 3000 du container
    ports:
      - 3000:3000
    # Indique une dépendance avec le service back
    depends_on:
      - back
`````

## 5- Lancer le projet

Pour lancer le projet et les containers, lancez la commande suivante :
````shell
$ docker-compose up --build
````

Docker va télécharger l'image `postgres` depuis Docker Hub, construire les images `back` et `front`, puis lancer
les containers.

Dans les logs, une erreur s'affiche pour le service `back` :
`````shell
back_1      | /app/node_modules/sequelize/lib/sequelize.js:281
back_1      |       throw new Error('Dialect needs to be explicitly supplied as of v4.0.0');
back_1      |       ^
back_1      | 
back_1      | Error: Dialect needs to be explicitly supplied as of v4.0.0
back_1      |     at new Sequelize (/app/node_modules/sequelize/lib/sequelize.js:281:13)

`````

Une erreur s'affiche également pour le service `database` : 
`````shell
database_1  | Error: Database is uninitialized and superuser password is not specified.
database_1  |        You must specify POSTGRES_PASSWORD to a non-empty value for the
database_1  |        superuser. For example, "-e POSTGRES_PASSWORD=password" on "docker run".

`````

En effet, si l'on regarde le fichier qui crée la connexion à la base de données, à savoir 
le fichier `back/lib/db.js`, celui ci essaye de créer la connexion en utilisant une variable
d'environnement :

`````javascript
const sequelize = new Sequelize(process.env.DATABASE_URL);
`````

Or nous n'avons pas défini cette variable.
Il faut donc passer cette valeur lors de la création du container.
La variable ``DATABASE_URL`` doit respecter le format suivant :

`postgres://user:password@host:port/dbname`

Egalement, l'image `postgres` s'attend à avoir les variables `POSTGRES_PASSWORD` et `POSTGRES_USER` définies.


## 6- Variables d'environnement

Modifiez donc les services ``database`` et `back` du `docker-compose` :

````yaml
database:
    image: postgres:12-alpine
    ports:
      - 7082:5432
    environment:
      - POSTGRES_DB=star_wars
      - POSTGRES_USER=star_wars_user
      - POSTGRES_PASSWORD=star_wars_password
  
back:
    build: "back"
    ports:
      - 4000:4000
    depends_on:
      - database
    environment:
      - API_ENTRYPOINT=https://swapi.dev/api
      - JWT_SECRET=MyBestSecret
      - DATABASE_URL=postgres://star_wars_user:star_wars_password@database:5432/star_wars
````

Attention, dans le cas de Docker, le `hote` de la base de données doit être identique au nom du service `docker-compose`
qui crée la base de données.

Relancez maintenant la commande `docker-compose up --build`. Normalement, aucune erreur ne s'affiche.

On constate que les tables de la base se créent et les services `back` et `front` se lancent sans problème.

On peut vérifier que les containers sont bien en cours d'éxecution en lançant la commande : 

````shell
$ docker-compose ps  
starwarsdocker_back_1       "docker-entrypoint.s…"   back                running             0.0.0.0:4000->4000/tcp
starwarsdocker_database_1   "docker-entrypoint.s…"   database            running             0.0.0.0:7082->5432/tcp
starwarsdocker_front_1      "docker-entrypoint.s…"   front               running             0.0.0.0:3000->3000/tcp
````

Rendez-vous sur votre navigateur à l'URL `http://localhost:3000/`, le port 3000 étant celui exposé par le service `front`.

Créez un compte, puis naviguez sur l'app.

## 7- Volumes Database

Tout d'abord, stoppez les containers en cours avec la commande `docker-compose down`

Relancez ensuite les containers avec la commande `docker-compose up -d`

Naviguez sur l'app, cliquez sur le boutton déconnexion, puis essayez de vous reconnecter avec le compte précédemment crée.

Une erreur s'affiche, ce compte n'existe pas dans le base.

En réalité, c'est logique. En effet, nous n'avons pas mis en place de `volumes` sur le service `database`.

Les `volumes` sont le mécanisme préféré pour conserver les données générées et utilisées par les conteneurs Docker.

Il faut donc créer des volumes, qui vont sauvegarder sur notre machine les données générées par postgres.

Tout d'abord, stoppez les containers en cours.

Puis, modifiez le service `database` : 

````yaml
  database:
    image: postgres:12-alpine
    ports:
      - 7082:5432
    # sauvegarde les données de la db qui sont stockés dans le dossier data/postgres
    # dans le volume database
    volumes:
      - database:/data/postgres
    environment:
      # Indique à postgres d'utiliser les données persistés dans le dossier data
      - PGDATA=/data/database
      - POSTGRES_DB=star_wars
      - POSTGRES_USER=star_wars_user
      - POSTGRES_PASSWORD=star_wars_password
````

Ajoutez à la fin du fichier, au même niveau que ``services``, le contenu suivant : 

````yaml
volumes:
  database:
````

Cela indique au Docker Compose la liste des volumes que nous utilisons.

Lancez de nouveau la commande `docker-compose up --build`

Essayez de nouveau la manipulation du dessus ; comme vous le constatez, même si vous créez un compte, puis stoppez les containers, puis les relancez,
vous pouvez toujours vous connecter avec votre compte, cela grâce aux volumes.

On peut vérifier que les volumes ont bien été créé avec la commande : 

````shell
$ docker volume ls
DRIVER    VOLUME NAME
local     0890b5fd2e8b0f06fa2f15b566cffc67486cedf483dfa0edf56b81861465f192
local     starwarsdocker_database
````
On constate que notre volume est bien présent.

Vous pouvez supprimer les volumes avec la commande `docker volume prune`

## 8 - Volumes Back et Front

Essayez maintenant en ayant les logs des containers sur votre terminal de modifier un fichier du back ou du front.

On constate que la modification n'est pas prise en compte, et que le back ou le front ne se relance pas.

La encore, il s'agit d'un problème lié aux volumes.

Il faut trouvez un moyen de dire à Docker: dés qu'un fichier est modifié sur ma machine, répercute ce changement au sein du container.

Pour cela, modifiez les services `back` et `front`:

`````yaml
  back:
    build: "back"
    ports:
      - 4000:4000
    depends_on:
      - database
    restart: "on-failure"
    # Indique à Docker de répercuter les changements intervenants dans le dossier front
    # au sein du dossier app du container
    volumes:
      - "./front:/app"
    environment:
      - API_ENTRYPOINT=https://swapi.dev/api
      - JWT_SECRET=MyBestSecret
      - DATABASE_URL=postgres://star_wars_user:star_wars_password@database:5432/star_wars

  front:
    build: "front"
    tty: true
    stdin_open: true
    restart: "on-failure"
    # Indique à Docker de répercuter les changements intervenants dans le dossier back
    # au sein du dossier app du container
    volumes:
      - "./back:/app"
    ports:
      - 3000:3000
    depends_on:
      - back
`````

Stoppez les containers, puis lancez-les de nouveau avec la commande de build.

Deux nouvelles erreurs s'affichent : 

````shell
back_1      | > front@0.1.0 start
back_1      | > react-scripts start
back_1      | 
back_1      | sh: react-scripts: not found
back_1 exited with code 127
front_1     | 
front_1     | > back@1.0.0 start
front_1     | > node index.js
front_1     | 
front_1     | node:internal/modules/cjs/loader:930
front_1     |   throw err;
front_1     |   ^
front_1     | 
front_1     | Error: Cannot find module 'express'

````

Les services `back` et `front` ne trouvent plus leurs dépendances.

Effectivement, avec l'instruction `volumes`, nous avons dit à docker que le container doit utiliser les 
fichiers qui se trouvent dans les dossiers `back` et `front` en local.

Or nous n'avons pas lancé la commande `npm install` en local (Le dossier `node_modules` n'est pas présent sur notre machine)

Le container ne trouve donc pas les dépendances. A ce stade, deux solutions existent : 

* Installer les dépendances en local sur notre machine, qui seront copiés au sein du container
* Dire à Docker de ne pas tenter de récupérer les dépendances sur notre machine mais d'utiliser les `node_modules` qui
sont présents dans le container

Les deux options sont valables. Pour la première, il suffit de lancer un coup de `npm install` dans les dossiers back et front.

Pour la deuxième, modifier les services comme ceci : 

`````yaml
  back:
    build: "back"
    ports:
      - 4000:4000
    depends_on:
      - database
    restart: "on-failure"
    volumes:
      
      # Signifie à Docker : ne tente pas de récupérer les node_modules sur notre machine
      # mais utilise ceux au sein du container
      - "/app/node_modules"
      
      # Signifie à Docker : Récupérer les fichiers du dossier front et répercute-les au sein du container
      - "./front:/app"
        
      # si on met des deux points, cela signifie surcharge, sinon cela signifie ne surcharge pas
        
    environment:
      - API_ENTRYPOINT=https://swapi.dev/api
      - JWT_SECRET=MyBestSecret
      - DATABASE_URL=postgres://star_wars_user:star_wars_password@database:5432/star_wars

  front:
    build: "front"
    tty: true
    stdin_open: true
    restart: "on-failure"
    volumes:
      - "/app/node_modules"
      - "./back:/app"
    ports:
      - 3000:3000
    depends_on:
      - back
`````

Stoppez les containers, puis lancez-les de nouveau avec la commande de build.
