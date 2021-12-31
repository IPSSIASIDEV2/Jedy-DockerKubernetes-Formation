# Docker - TP0 : Installation de Docker
> **Objectifs du TP** :
>- Installer Docker

Ce TP contient trois sections, une pour chaque système d'exploitation.

En fonction de votre système d'exploitation, suivez la section correspondante


## Installation MacOS

Pour les pc MacOS, l’installation est simple : il suffit d’aller sur [ce lien](https://www.docker.com/get-started), de télécharger le programme `Docker Desktop` et de suivre les instructions

Il faut ensuite créer un compte sur [DockerHub](https://hub.docker.com/signup), puis ouvrir un terminal et lancer la commande `docker login` puis suivre les instructions

Vous pouvez vérifier l’installation en lançant la commande `docker version`


## Installation Linux

Pour installer Docker sur Linux, il faut suivre les instructions suivantes:

* Créer un compte sur [DockerHub](https://hub.docker.com/signup)
* Installer Docker en suivant les instructions sur [ce lien](https://docs.docker.com/install/linux/docker-ce/ubuntu/#set-up-the-repository)
* Ouvrir un terminal, lancer la commande `docker login` et suivre les instructions
* Tester l’installation en lançant la commande `sudo docker version`
* Installer manuellement Docker Compose en suivant [ce lien](https://docs.docker.com/compose/install/#install-compose), onglet Linux
* Tester l’installation de Docker Compose en lançant la commande `docker-compose –v`
* Suivre [ces instructions](https://docs.docker.com/engine/install/linux-postinstall/) pour lancer Docker sans le mode sudo et pour lancer Docker automatiquement au démarrage de votre machine


## Installation Windows


Pour les pc Windows, il faut nécessairement avoir un Windows 10 Professionnel ou Entreprise 64-bit, ou bien Windows 10 Home 64-bit avec WSL 2. 
Vous pouvez suivre les instructions sur [ce lien](https://docs.docker.com/desktop/windows/install/)

Si votre version de Windows 10 ne supporte pas WSL ou que vous n’avez pas Windows 10, vous devez installer [Docker Toolbox](https://github.com/docker-archive/toolbox/releases). 
Cependant ce logiciel à été déprécié et risque de ne plus fonctionner dans le futur. 

Il faut également activer la virtualisation dans les paramètres BIOS
