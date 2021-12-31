# Utiliser une image existante comme image de base
FROM php:7.4-cli



# Télécharger et installer des dépendances
RUN docker-php-ext-install pdo pdo_mysql
RUN pecl install apcu
RUN docker-php-ext-enable apcu

# Copie les fichiers du répetoire courant dans le dossier /usr/src/myapp du container
COPY . /usr/src/myapp

# Défini le répertoire de travail des instructions RUN, CMD, ENTRYPOINT, COPY et ADD qui le suivent dans le Dockerfile
WORKDIR /usr/src/myapp


# Dire à l'image quelle commande lancer au démarrage du container
CMD ["php", "./index.php"]
