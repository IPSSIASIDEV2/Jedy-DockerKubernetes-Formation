# Kubernetes - TP5 : Projet avec Kubernetes
> **Sommaire du TP** :
>- Cloner le repository
>- Créer le Dockerfile Front
>- Créer le Dockerfile Back
>- Créer le Docker Compose
>- Lancer le projet
>- Ajouter les variables d'environnement
>- Volumes de la base de données
>- Volumes des app back et front
>- Mise en place d'un workflow de production

## 1 - Cloner le repository

La première étape est de cloner le repo github contenant le projet.

Le repo est disponible sur [ce lien](https://github.com/elie91/Jedy-StarWarsKubernetes)

Il s'agit du projet que nous avions créé lors du TP sur Docker Compose : une application web composé d'une API Node et d'un front React,
avec une base de données Postgres, le tout fonctionnant avec Docker et Docker Compose

L'objectif de ce TP est de transformer ce projet en un cluster Kubernetes

Voici l'architecture du cluster que nous allons mettre en place : 

<img src="./pictures/kub_project_1.png" alt="drawing" width="400"/>

Le trafic réseau sera géré par un service `Ingress`, qui va envoyer la requête au back ou au front en fonction de l'url.

Le reste du cluster sera composé de : 
* Un `Deployment` contenant 3 pods du front de notre application
* Un `ClusterIp` pour exposer le Deployment front aux autres services
* Un `Deployment` contenant 3 pods du back de notre application
* Un `ClusterIp` pour exposer le back front aux autres services
* Un `Deployment` pour postgres contenant 1 pod 
* Un `ClusterIp` pour exposer postgres aux autres services
* Un `PVC` (Persistent Volume Claim) pour sauvegarder la donnée écrite par la base

## 2 - Création du Deployment Front

Tout d'abord, créez un dossier `k8s` à la racine du projet, au même niveau que les dossiers `back` et `front`

Ce dossier contiendra tous nos fichiers kubernetes. 

Créez un fichier appelé `front-deployment.yaml` avec le contenu suivant : 

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: front-deployment
spec:
  # Précise que l'on aura 3 containers de notre front au sein du Deployment
  replicas: 3
  selector:
    matchLabels:
      component: front
  template:
    metadata:
      labels:
        component: front
    spec:
      containers:
        - name: client
          # Spécifie l'image publique utilisée. Vous pouvez la changer par la vôtre si vous le souhaitez
          image: elie91/starwars-front
          # Spécifie le port
          ports:
            - containerPort: 3000
          # Variables d'environnement
          env:
            - name: REACT_APP_API_ENTRYPOINT
              # Nous verrons plus tard quelle valeur l'on doit passer ici
              value: ''

```

## 3 - Création du ClusterIP Front

Créez un fichier appelé `front-cluster-ip-service.yaml` avec le contenu suivant :

````yaml
apiVersion: v1
kind: Service
metadata:
  name: front-cluster-ip-service
spec:
  type: ClusterIP
  # Match le sélecteur spécifié dans le Deployment front
  selector:
    component: front
  # Expose le port 3000
  ports:
    - port: 3000
      targetPort: 3000

````

Nous allons maintenant appliquer ces deux fichiers à notre cluster. Si vous utilisez minikube, vérifiez que minikube est bien 
en cours avec la commande `minikube status`

Pour appliquer un fichier kubernetes, on utilise la commande `kubectl apply -f <fichier>`: 

````shell
$ kubectl apply -f front-deployment.yaml 
deployment.apps/front-deployment created
$ kubectl apply -f front-cluster-ip-service.yaml 
service/front-cluster-ip-service created
````

Nous pouvons vérifier l'état de nos objets avec les commandes suivantes: 

````shell
$  kubectl get services
NAME                       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
front-cluster-ip-service   ClusterIP   10.109.11.237   <none>        3000/TCP   59s
kubernetes                 ClusterIP   10.96.0.1       <none>        443/TCP    2m48s
$ kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
front-deployment   3/3     3            3           84s
$ kubectl get pods  
NAME                               READY   STATUS    RESTARTS   AGE
front-deployment-546f55b6f-9dsgs   1/1     Running   0          98s
front-deployment-546f55b6f-k266x   1/1     Running   0          98s
front-deployment-546f55b6f-thlnq   1/1     Running   0          98s
````

Vérifiez que les trois pods sont bien en statut `Running`

## 4 - Création du Deployment Back

Nous allons suivre les mêmes étapes pour le back.

Créez un fichier appelé `back-deployment.yaml` avec le contenu suivant :

````yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: back-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      component: back
  template:
    metadata:
      labels:
        component: back
    spec:
      containers:
        - name: server
          image: elie91/starwars-back
          ports:
            - containerPort: 4000
          env:
            - name: API_ENTRYPOINT
              value: "https://swapi.dev/api"
            - name: JWT_SECRET
              value: "MyBestSecret"
            - name: PGUSER
              value: postgres
            # Nous verrons plus tard quelle valeur l'on doit passer ici
            - name: PGHOST
              value: ''
            - name: PGDATABASE
              value: postgres
            - name: PGPORT
              value: "5432"
            # Nous verrons plus tard quelle valeur l'on doit passer ici
            - name: PGPASSWORD
              value: ''

````
## 5 - Création du ClusterIP Back

Créez un fichier appelé `back-cluster-ip-service.yaml` avec le contenu suivant :

````yaml
apiVersion: v1
kind: Service
metadata:
  name: back-cluster-ip-service
spec:
  type: ClusterIP
  selector:
    component: back
  ports:
    - port: 4000
      targetPort: 4000

````

Appliquez ensuite les fichiers à notre cluster. Vérifiez l'état des `services`, `deployment` et `pods` de 
notre cluster.

On constate que les pods de notre deployment back ne fonctionne pas.

````shell
$ kubectl get pods
NAME                               READY   STATUS             RESTARTS   AGE
back-deployment-6bd89c96f-27qxm    0/1     CrashLoopBackOff   1          19s
back-deployment-6bd89c96f-5nhln    0/1     CrashLoopBackOff   1          19s
back-deployment-6bd89c96f-f8j7r    0/1     CrashLoopBackOff   1          19s
front-deployment-899c88f94-bsz6f   1/1     Running            0          4m40s
front-deployment-899c88f94-l7mc8   1/1     Running            0          4m34s
front-deployment-899c88f94-m87dx   1/1     Running            0          4m37s
````

Pour vérifier quelle erreur est survenue, on peut afficher les logs d'un des pods back. 

La commande pour afficher les logs est la suivante : `kubectl logs <object_id>` : 

````shell
$ kubectl logs back-deployment-6bd89c96f-27qxm
> back@1.0.0 prod
> node index.js

/app/node_modules/sequelize/dist/lib/dialects/postgres/connection-manager.js:130
                reject(new sequelizeErrors.ConnectionRefusedError(err));
````

Comme vous vous en doutez, cela est dû au fait que la connexion avec la base de données ne fonctionne pas 
car nous n'avons pas renseigné les variables d'environnements `PGHOST` et `PGPASSWORD`

Nous corrigerons cela un peu plus tard dans le TP

## 6 - Création du Volume Postgres

Avant de créer le `Deployment` et le `ClusterIP` de la base de données, nous allons tout d'abord créer 
le volume pour stocker les données de Postgres.

Comme expliqué durant le cours, nous allons créer un `Persistent Volume Claim (PVC)`, qui permet de garder la donnée même
si le `Pod` crash et qu'il est supprimé du cluster, et qui permet également de spécifier la capacité de stockage du volume.

Créez un fichier appelé `database-persistent-volume-claim.yaml` : 

````yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: database-persistent-volume-claim
# k8s doit trouver une instance de stockage qui répond aux exigences
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      # Trouver une instance de stockage qui a 2g
      storage: 2Gi

````

Appliquez ce fichier au cluster. On peut vérifier que le volume est bien présent avec la commande suivante : 


````shell
$ kubectl get pvc
NAME                               STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
database-persistent-volume-claim   Bound    pvc-a42f4fe1-d96e-4cc6-8ea5-d6417ce149b5   2Gi        RWO            standard       79s
````

On constate que le volume est bien présent au sein du Cluster, et qu'il a une capacité de stockage de `2Gi`, comme spécifié dans notre fichier de
configuration

## 7 - Création du Secret Postgres

Nous allons maintenant créer un objet `Secret`, pour le mot de passe de notre base de données. 

La création d'un `Secret` se fait de manière `impérative`, c'est-à-dire via une commande et non un fichier. On ne veut pas en effet que
la valeur du mot de passe soit présente dans le fichier.

Pour créer un `Secret` de type `clé = valeur `, il faut lancer la commande suivante : 

`kubectl create secret generic <nom_du_secret> --from-literal <clé>=<valeur>`

`````shell
$ kubectl create secret generic pgpassword --from-literal PGPASSWORD=rKQbt86bt3zt44aB
secret/pgpassword created
$ kubectl get secret 
NAME                  TYPE                                  DATA   AGE
default-token-h6xjc   kubernetes.io/service-account-token   3      24m
pgpassword            Opaque                                1      10s
`````

On constate que notre secret est bien présent

## 8 - Création du Deployment Postgres

Créez un fichier appelé `postgres-deployment.yaml` avec le contenu suivant :

````yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      component: postgres
  template:
    metadata:
      labels:
        component: postgres
    spec:
      # Spécifie le volume utilisé pour stocker la donnée
      volumes:
        - name: postgres-storage
          # Spécifie que l'on va utiliser un volume PVC
          persistentVolumeClaim:
            # Correspond au nom spécifié dans le fichier database-persistent-volume-claim
            claimName: database-persistent-volume-claim
      containers:
        - name: postgres
          image: postgres
          ports:
            - containerPort: 5432
          # Indique dans quel dossier du container la donnée doit être stockée
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/Data
          # Variables d'environnements
          env:
            - name: POSTGRES_PASSWORD
              # Indique que l'on souhaite récupérer la valeur PGPASSWORD du Secret appelé pgpassword
              valueFrom:
                secretKeyRef:
                  name: pgpassword
                  key: PGPASSWORD

````

## 9 - Création du ClusterIP Postgres

Créez un fichier appelé `postgres-cluster-ip-service.yaml` avec le contenu suivant :

`````yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-cluster-ip-service
spec:
  type: ClusterIP
  selector:
    component: postgres
  ports:
    - port: 5432
      targetPort: 5432
`````

Appliquez ensuite ces deux fichiers. 

Nous allons maintenant corriger les `pods` de notre `back`. Pour cela, modifiez les variables d'environnement du fichier 
`back-deployement` par le contenu suivant : 

````yaml
          env:
            - name: API_ENTRYPOINT
              value: "https://swapi.dev/api"
            - name: JWT_SECRET
              value: "MyBestSecret"
            - name: PGUSER
              value: postgres
            # Le host de notre base est en réalité le ClusterIp postgres, qui expose la base aux autres services
            - name: PGHOST
              value: postgres-cluster-ip-service
            - name: PGDATABASE
              value: postgres
            - name: PGPORT
              value: "5432"
            # Récupère la valeur du secret
            - name: PGPASSWORD
                valueFrom:
                  secretKeyRef:
                    name: pgpassword
                    key: PGPASSWORD
````

````shell
$ kubectl apply -f back-deployment.yaml    
deployment.apps/back-deployment configured
$ kubectl get pods 
NAME                                  READY   STATUS    RESTARTS   AGE
back-deployment-6585fd49d-4sd4h       1/1     Running   0          17s
back-deployment-6585fd49d-7crt8       1/1     Running   0          23s
back-deployment-6585fd49d-q8mkf       1/1     Running   0          20s
front-deployment-899c88f94-bsz6f      1/1     Running   0          30m
front-deployment-899c88f94-l7mc8      1/1     Running   0          29m
front-deployment-899c88f94-m87dx      1/1     Running   0          30m
postgres-deployment-cf68fb8c8-7h7z2   1/1     Running   0          2m49s
````

A ce stade, tous les `pods` sont en cours d'exécution. Cependant, notre application n'est pas encore accessible sur un navigateur.
En effet, comme expliqué durant le cours, les `ClusterIp` exposent les services uniquement au sein du cluster.

Nous allons utiliser `Ingress` pour exposer notre application et diriger le traffic au sein du cluster

## 10 - Installation d'Ingress

Dans cette section, nous allons installer `Ingress` au sein de notre cluster.  

Si vous utilisez `minikube`, lancez la commande suivante : 

````shell
$ minikube addons enable ingress
 ▪ Using image k8s.gcr.io/ingress-nginx/controller:v0.44.0
    ▪ Using image docker.io/jettech/kube-webhook-certgen:v1.5.1
    ▪ Using image docker.io/jettech/kube-webhook-certgen:v1.5.1
🔎  Verifying ingress addon...
🌟  The 'ingress' addon is enabled

````

Si vous utilisez `Docker Desktop`, lancez la commande suivante : 

````shell
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.1.0/deploy/static/provider/cloud/deploy.yaml
````

## 11 - Création de l'Ingress Controller

## 12 -Tester le cluster



