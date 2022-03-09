# Docker: Projet Symfony avec Docker Compose 

Votre docker-compose doit contenir 4 services: 

* php
* nginx
* database
* phpmyadmin

Les services `database` et `phpmyadmin` utilisent les images existantes `mysql:8.0`
et `phpymyadmin/phpmyadmin` (vérifiez sur dockerhub)

Les services `php` et `nginx` ont besoin d'un Dockerfile

Le Dockerfile du service Nginx doit copier le fichier `default.conf` suivant dans le chemin `/etc/nginx/conf.d/` du container

```nginx
server {
    listen       80;
    server_name  _;

    root /usr/share/nginx/html/public;
    index index.php index.html;

    client_max_body_size 45M;
    server_tokens off;

    fastcgi_buffers 16 16k;
    fastcgi_buffer_size 32k;

    location / {
        try_files $uri /index.php$is_args$args;
    }
    location ~ .php$ {
        fastcgi_pass   php:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }
}
```

Le `Dockerfile` de votre service PHP doit commencer par: 

```Dockerfile
FROM php:8.1-fpm

RUN apt-get update && apt-get install -y libicu-dev gnupg2 wget apt-utils libpng-dev

RUN docker-php-ext-install pdo pdo_mysql
RUN docker-php-ext-install gd

RUN apt-get clean

RUN pecl install apcu
RUN docker-php-ext-enable apcu
RUN docker-php-ext-install intl opcache
RUN apt-get install -y \
  libzip-dev \
  zip \
  && docker-php-ext-install zip


COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

ADD docker/php/php.ini /usr/local/etc/php/conf.d/php.ini
```

Vous devez créer un fichier `php.ini` au même niveau avec le contenu suivant: 

```
apc.enable_cli = 1
date.timezone = UTC
session.auto_start = Off
short_open_tag = Off
upload_max_filesize = 45M
post_max_size = 45M

# https://symfony.com/doc/current/performance.html
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 20000
opcache.memory_consumption = 256
realpath_cache_size = 4096K
realpath_cache_ttl = 600

```