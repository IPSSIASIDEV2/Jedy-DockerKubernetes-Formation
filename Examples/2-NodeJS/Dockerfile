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
