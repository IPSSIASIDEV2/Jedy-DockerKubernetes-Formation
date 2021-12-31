# Kubernetes - TP1 : Découverte de Kubernetes
> **Objectifs du TP** :
>- Se familiariser avec le client kubectl
>- Découvrir les premiers concepts


## 1- Interagir avec le Cluster

Nous allons simplement commencer par vérifier que le client `kubectl` fonctionne et parvient à communiquer avec le cluster K8s. Pour ce faire, nous allons simplement lancer la commande :
```sh
$ kubectl version --short
```
>**Questions**
>- Quelles sont les versions du client ?
>- Les versions du client et du serveur sont-elles strictement identiques ?


Si nous avons obtenu une réponse sans erreur, nous avons prouvé que :
- Le client est présent et correctement installé
- La configuration du client a permis de se connecter au cluster
- Les accès de l’utilisateurs permettent au moins de demander la version au cluster
- Le cluster est _a minima_ fonctionnel

## 2- Formatage des sorties de kubectl

Une des premières choses à noter avec le client `kubectl`, c’est sa capacité à adapter son format de sortie en fonction de la demande avec l’option `-o` :

```sh
$ kubectl version -o yaml
clientVersion:
  buildDate: 2018-09-27T17:05:32Z
  compiler: gc
  gitCommit: 0ed33881dc4355495f623c6f22e7dd0b7632b7c0
  gitTreeState: clean
  gitVersion: v1.12.0
  goVersion: go1.10.4
  major: "1"
  minor: "12"
  platform: linux/amd64
serverVersion:
  buildDate: 2018-09-27T16:55:41Z
  compiler: gc
  gitCommit: 0ed33881dc4355495f623c6f22e7dd0b7632b7c0
  gitTreeState: clean
  gitVersion: v1.12.0
  goVersion: go1.10.4
  major: "1"
  minor: "12"
  platform: linux/amd64
```

Nous allons utiliser cette commande pour produire une liste formatée des nœuds du cluster Kubernetes.
Pour commencer, voyons la forme standard de sortie de la commande qui permet d’obtenir la liste du premier type de ressources vu jusqu'à présent, les nœuds :

```sh
$ kubectl get nodes
NAME                    STATUS   ROLES    AGE     VERSION
minikube                Ready    master   3h59m   v1.19.0
```

Cette sortie est simple et peut être adaptée pour fournir plus d’informations. Nous allons essayer à tour de rôles les commandes :
```sh
$ kubectl get nodes -o wide
[...]
$ kubectl get nodes -o json
[...]
$ kubectl get nodes -o yaml
[...]
```

>**Questions**
>- Combien de CPU a le nœud **master** ?
>- Depuis combien de temps le nœud **master** est-il enregistré ?
>- Quelle est l’adresse IP interne du nœud **master** ?

## 3- Formatage avancé des sorties de kubectl

Nous avons vu les formats de sortie fixes, voyons désormais dans quelle mesure il est possible de les personnaliser. Pour cela, d’autres types de sortie que JSON, YAML et `wide` existent.

Les sorties JSON et YAML fournissent directement une structure de données de type `List` qui peut contenir plusieurs éléments, en fonction du nombre de nœuds sur le cluster :
```sh
$ kubectl get nodes -o go-template --template='{{ .kind }}'
List
$ kubectl get nodes -o=template --template='{{ len .items }}'
4
```
_A contrario_, si l’on demande une ressource en particulier, son type est directement récupérable :
```sh
$ kubectl get no/minikube -o go-template --template='{{ .kind }}'
Node
```

Il est très simple de récupérer quelques champs spécifiques de la ressource :
```sh
$ kubectl get no/minikube -o go-template --template='ce {{ .kind }} porte le nom de {{ .metadata.name }}'
ce Node porte le nom de minikube
```

Pour avoir une vue sous forme de tableau personnalisée de tous les éléments, on peut utiliser la sortie **`custom-columns`**, qui reste relativement simple :
```sh
$ kubectl get nodes -o=custom-columns=NAME:.metadata.name,RAM:.status.capacity.memory
NAME                    RAM
minikube                2038544Ki
```

> **Exercice**
>
> En utilisant le format de sortie **`-o=custom-columns`**, produire la liste des nœuds du cluster avec le format suivant :
> ```
> NAME                    ARCH      KERNEL
> minikube                amd64     4.19.76-linuxkit
> ```
