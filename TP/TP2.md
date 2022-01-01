# Docker - TP2 : Premier projet avec Docker
> **Objectifs du TP** :
>- Créer un serveur web NodeJs
>- Créer un Dockerfile
>- Copier les fichiers
>- Mapper un port
>- Vérifier les fichiers au sein du container
>-  Optimiser le processus de build


## 1- Création du serveur NodeJS

Dans un nouveau dossier, créez les deux fichiers suivants: 

* Un fichier ``package.json``, qui contient les dépendances de notre projet: 

````json
{
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.17.2"
  }
}

````

* Un fichier `index.js` qui contient le contenu suivant: 

````javascript
const express = require('express');

// initialise le serveur
const app = express();

// envoie une réponse
app.get('/', (req, res) => {
  res.send('Hello world');
})

// écoute sur le port 8000
app.listen(8000, () => {
  console.log('Listening on port 8000')
})

````

Ce serveur nécessite d'avoir `nodejs` et `npm` installé sur votre machine. Cependant, grâce à Docker, cela n'est pas nécessaire.

Nous allons en effet créer un container dans lequel `nodejs` et `npm` seront installés

## 2- Création du Dockerfile

Créez dans votre dossier un fichier Dockerfile. La première étape est de spécifier une image de base.

Idéalement, il nous faudrait une image de base qui installe NodeJs dans notre container. Dans le cas contraire, il faudra lancer des commandes 
personnalisées pour installer Nodejs.

Heureusement, il existe des images de bases pour NodeJs, que vous trouverez dans le Docker Hub sur [ce lien](https://hub.docker.com/_/node).

Comme vous le voyez, il existe plusieurs tags pour une image: `alpine`, `buster`, `stretch`, etc...

Dans le monde de Docker, `alpine` signifie que l'image est légère et compacte, et contient le strict minimum pour lancer NodeJS.

Placez donc le contenu suivant dans le Dockerfile: 

`````dockerfile
# Spécifie l'image de base
FROM node:17-alpine

# Spécifie le répertoire par défaut utilisé pour la suite
WORKDIR /usr/app

# installe les dépendances
RUN npm install

# commande par défaut
CMD ["npm", "start"]

`````

Puis créez le container en lançant la commande: `docker build -t <votre_tag> .`

Comme on peut le voir, `npm` est bien présent dans le container, et la commande `npm install` se lance sans problème.
Cependant, une erreur s'affiche : 

````shell
#6 1.105 npm ERR! code ENOENT
#6 1.106 npm ERR! syscall open
#6 1.106 npm ERR! path /usr/app/package.json
#6 1.108 npm ERR! errno -2
#6 1.109 npm ERR! enoent ENOENT: no such file or directory, open '/usr/app/package.json'
````

En effet, le fichier ``package.json`` n'existe pas au sein du container. C'est également le cas pour le fichier `index.js`.

Il faut donc les copier depuis notre dossier vers le container.


## 3- Copier les fichiers

Nous allons donc ajouter l'étape qui va copier les fichiers dans le container: 

````dockerfile
# Spécifie l'image de base
FROM node:17-alpine

# Spécifie le répertoire par défaut utilisé pour la suite
WORKDIR /usr/app

# copie les fichiers du répertoire courant (./) dans le répertoire courant du container (/usr/app)
COPY ./ ./

# installe les dépendances
RUN npm install

# commande par défaut
CMD ["npm", "start"]
````

Relancez ensuite la commande de build, puis la commande pour run le container: `docker run <votre_tag>`:

````shell
$ docker run elie91/nodewebapp       

> start
> node index.js

Listening on port 8000

````

Ouvrez votre navigateur et rendez-vous sur la page localhost:8000. Comme vous le constatez, cette page est inaccessible.

En effet, il n'existe pas actuellement de ports ouverts permettant la communication entre le container et votre machine. 
Le container peut communiquer de lui-même avec l'extérieur, comme cela a été le cas quand il a téléchargé les dépendances avec la commande npm install.

Cependant, il faut spécifier manuellement un port permettant de diriger les requêtes entrantes vers le container.

## 4- Mapper un port

Pour mapper un port, on peut ajouter l'option `-p` à la commande `docker run`: 

`````shell
$ docker run -p 5000:8000 <votre_tag>
`````

Cette option signifie : Redirige les requêtes sur le port 5000 local vers le port 8000 au sein du container.
Il n'est pas obligé de spécifier le même port local que celui au sein du container.

Lancez la commande et vérifier que le serveur est bien accessible sur le navigateur à l'URL localhost:5000.

Félicitations, le serveur est bien accessible

## 5- Vérifier les fichiers au sein du container

On peut vérifier les fichiers présents dans le container en surchargeant la commande par défaut à la création du container: 
`````shell
$ docker run -it elie91/nodewebapp sh
/usr/app # ls
Dockerfile         index.js           node_modules       package-lock.json  package.json

`````

Comme vous le constatez, nous sommes bien dans le dossier `usr/app`, spécifié comme répertoire de travail dans le Dockerfile, et les fichiers sont bien présents à l'intérieur

## 6- Optimisation du build

Imaginons maintenant que nous voulons modifier notre serveur, par exemple pour ajouter une route: 

`````javascript
const express = require('express');

// initialise le serveur
const app = express();

// envoie une réponse
app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/about', (req, res) => {
  res.send('Hello from about page');
})

// écoute sur le port 8000
app.listen(8000, () => {
  console.log('Listening on port 8000')
})

`````

Comme vous vous en doutez, pour que ce changement soit répercuté au sein du container, il faut le build de nouveau. Relancez donc la commande de build.

On constate qu'étant donné que l'instruction ``COPY`` a été modifié, car il y'a un changement dans les fichiers à copier, Docker relance les instructions suivantes
et réinstalle les dépendances du projet alors que celles ci n'ont pas changées.

Cette situation n'est pas idéale. Idéalement, on voudrait que ce soit seulement quand les dépendances ont changées que la commande `npm install` s'éxecute de nouveau.

Pour cela, modifiez le ``Dockerfile`` par :  

`````dockerfile
# Spécifie l'image de base
FROM node:17-alpine

# Spécifie le répertoire par défaut utilisé pour la suite
WORKDIR /usr/app

# copie uniquement le fichier package.json qui contient les dépendances
COPY ./package.json ./

# installe les dépendances
# De cette façon, c'est uniquement lorsque le fichier package.json est modifié que cette commande n'utilise pas le cache et réinstalle les
# dépendances
RUN npm install

# copie le reste des fichiers
COPY ./ ./

# commande par défaut
CMD ["npm", "start"]

`````

Ainsi, nous nous assurons de ne pas lancer de `npm install` qui ne servirait à rien. Essayez de modifier votre fichier `index.js`, puis de 
relancer la commande de build. 

La commande `npm install` ne sera pas déclenché à nouveau et utilisera bien le cache

Fin du TP


