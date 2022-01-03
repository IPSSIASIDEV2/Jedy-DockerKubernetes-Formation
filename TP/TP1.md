# Docker - TP1 : Découverte de Docker
> **Objectifs du TP** :
- Apprendre à manipuler des containers
- Apprendre à manipuler des images


## 1- Vérification de l'installation

Nous allons simplement commencer par vérifier que Docker est bien installé sur notre machine. Pour ce faire, nous allons simplement lancer la commande :
```sh
$ docker version
```
## 2- Créer son premier container

`Docker Hub` est une librairie d'images Docker en ligne. 
Comme expliqué durant le cours, lorsque que l'on crée un container à partir d'une image, ``Docker Server`` va récupérer cette image depuis le `Docker Hub`, 
la télécharger, et la mettre en cache sur notre machine.

Nous allons maintenant créer notre premier container basé sur l'image `hello-world`, disponible sur le Docker Hub. Pour cela, lancez la commande suivante : 
```sh
$ docker run hello-world
```

Le terminal affiche les lignes suivantes: 
```shell
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
2db29710123e: Pull complete
Digest: sha256:2498fce14358aa50ead0cc6c19990fc6ff866ce72aeb5546e1d59caac3d0d60f
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/
```

Le ``Docker Client`` ne trouvant pas l'image `hello-world` en cache sur notre machine, a contacté le `Docker server (ou daemon)`qui a été la télécharger depuis le `Docker Hub`

Le Docker server a ensuite crée un container à partir de l'image téléchargé et a exécuté les instructions renseignées dans l'image pour afficher le message: 
`Hello from Docker`

Essayez maintenant de relancer la commande `docker run hello-world`. Vous pouvez constater que cette fois-ci, le Docker client n'a pas téléchargé l'image de nouveau, 
celle-ci étant déjà présente en cache sur notre machine


## 3- Surcharger la commande par défaut

On peut surcharger la commande exécutée par défaut en ajoutant un paramètre à la suite de la commande `docker run`: 

```shell
docker run busybox
docker run busybox echo bonjour
docker run busybox ls
```

Comme vous le constatez, en ajoutant un paramètre, on modifie la commande exécutée par défaut (dans le cas de busybox, aucune commande n'est exécutée)

> **Question**
>
> Essayez de surcharger la commande par défaut d'un container basé sur l'image hello-world

Cela ne fonctionne pas, une erreur s'affiche. 

En effet, rien n'existe dans le container créé à par une simple commande permettant d'afficher Hello world. À l'inverse, l'image Busybox crée des containers contenants
des fichiers d'exploitation

## 4- Commandes de manipulation

### Créer un container sans le run immédiatement: 
```shell
$ docker create hello-world

ab8cfa546739966537c4cfa84f8f880e27178633f1edc438146d47e9e450dd09
```
On peut utiliser l'ID affiché pour lancer le container manuellement
````shell
$ docker start -a ab8cfa546739966537c4cfa84f8f880e27178633f1edc438146d47e9e450dd09
````
`docker run` est donc un raccourci pour les commandes `docker create` + `docker start`

### Lister les containers en cours
````shell
$ docker ps
````

Rien n'est affiché, car aucun container n'est en cours d'exécution. Les containers précédents se stoppent lorsque leurs commandes sont exécutées.

Nous pouvons créer un container qui va continuer à tourner en lançant la commande : 
````shell
$ docker run busybox ping google.com
````

Ouvrez un autre terminal et lancez la commande : 
```shell
$ docker ps 

CONTAINER ID   IMAGE     COMMAND             CREATED          STATUS          PORTS     NAMES
6c2d4482247d   busybox   "ping google.com"   38 seconds ago   Up 37 seconds             admiring_kapitsa
```

### Lister tous les containers présents sur notre machine
```shell
$ docker ps -a

CONTAINER ID   IMAGE                              COMMAND                  CREATED          STATUS                          PORTS                               NAMES
6c2d4482247d   busybox                            "ping google.com"        2 minutes ago    Exited (0) About a minute ago                                       admiring_kapitsa
ab8cfa546739   hello-world                        "/hello"                 7 minutes ago    Exited (0) 6 minutes ago                                            busy_jones
a36f343a58c7   hello-world                        "ls"                     13 minutes ago   Created                                                             vigilant_roentgen
6701f6f34204   busybox                            "ls"                     15 minutes ago   Exited (0) 15 minutes ago                                           practical_hofstadter
2bf14cfccd7f   busybox                            "sh"                     15 minutes ago   Exited (0) 15 minutes ago                                           magical_vaughan                                        angry_diffie
```

### Redémarrer un container stoppé : 
```shell
$ docker start -a 6c2d4482247d
```

### Afficher les logs d'un container (ne redémarre pas le container) :
```shell
$ docker logs ab8cfa546739
```

### Lancer un container en background (en fond), sans que cela ne bloque le terminal :
```shell
$ docker run -d busybox ping google.com
$ docker ps

CONTAINER ID   IMAGE     COMMAND             CREATED         STATUS        PORTS     NAMES
2c6acceee9f0   busybox   "ping google.com"   2 seconds ago   Up 1 second             hungry_cori
```

### Stopper un container en cours :
```shell
$ docker stop 2c6acceee9f0 
```
ou 
````shell
$ docker kill 2c6acceee9f0
````

`stop` va arrêter le container en transmettant un signal, ce qui permet d'écouter ce signal et d'effectuer certaines actions à ce moment la (sauvegarder des fichiers etc)

`kill` arrête le container immédiatement

### Supprimer un ou des containers stoppés :
```shell
$ docker rm 6c2d4482247d ab8cfa546739
```

### Supprimer tous les containers, caches et networks (notions que l'on verra plus tard) (idéal pour nettoyer sa machine) :
```shell
$ docker system prune
```

## 4- Multi commandes

> **Exercice**
>
> Nous voulons utiliser le programme `redis-cli`, qui est un utilitaire pour le système de base de données redis. 
> 
> Pour utiliser redis-cli, il faut avoir `redis-server` lancé sur notre machine, et exécuter la commande `redis-cli`
> 
> Essayez de créer et run un container avec l’image redis, et d’exécuter la commande redis-cli
>

Effectivement, dans ce cas, la commande `docker run redis redis-cli` ne fonctionnera pas, car il faut que le programme redis soit déjà lancé pour utiliser redis-cli, 
or dans ce cas, nous demandons de l’exécuter à la création du container.

Pour exécuter une commande au sein d’un container en cours d’exécution, on peut utiliser les commandes suivantes :
````shell
$ docker run -d redis
171b71e69f5f022e29062d9f48d140e67976d96fd4b36289fc0ebe087fa13efd

$ docker exec -it 171b71e69f5f022e29062d9f48d140e67976d96fd4b36289fc0ebe087fa13efd redis-cli
127.0.0.1:6379>
````

Le tag `–it` permet d’envoyer les commandes que l’on tape sur le terminal au sein du container, et de les afficher avec un joli format.

On peut également obtenir un terminal classique à l’intérieur d’un container en exécutant la commande : 

````shell
docker exec –it <container_id> sh
````

Cette dernière commande est très pratique et souvent utilisée

## 5- Manipuler des images

### Lister les images présentes sur notre machine :
```shell
$ docker image ls  
```
ou
````shell
$ docker images
````

### Supprimer une ou plusieurs images :
```shell
$ docker images
REPOSITORY                         TAG       IMAGE ID       CREATED        SIZE
<none>                             <none>    2b75bde0dd1f   2 hours ago    475MB
$ docker image rm 2b75bde0dd1f
Deleted: sha256:2b75bde0dd1f34f5cab04f685281dfda5fa64945830d04d5753b76d9a06efbfb
```
Si une erreur s'affiche, c'est que l'image est utilisé par un container stoppé. Il faut donc d'abord supprimer le container 
puis supprimer l'image ensuite
