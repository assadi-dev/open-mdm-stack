# Council Transcript — Stratégie de contrôle Android (Open MDM Stack)

**Date :** 24 juin 2026
**Sujet :** Choix de stratégie de contrôle des appareils Android pour le MVP d'Open MDM Stack.

---

## Question originale

Décision d'architecture à enjeux pour un MVP d'Open MDM Stack. Dev solo, greenfield. Quelle stratégie pour le contrôle des appareils Android (5 actions : reboot, kiosque/lock task, mise à jour app+système, install/uninstall silencieux) ? Trois options : A=AMAPI, B=DPC Device Owner custom, C=Hybride. Quatre sous-questions : option MVP, séquencement contrat-d'API-d'abord, lock-in, positionnement open-source.

## Question cadrée (envoyée aux 5 advisors)

Voir le contexte enrichi : monorepo Turborepo, `apps/api` (Express + tsyringe + Zod, squelette ; à terme PassportJS + Drizzle/PostgreSQL), app Android Kotlin pas encore créée, README/claude.md vides (vérifié dans le repo), dev solo (assadi-dev), objectif MVP démontrable. Contraintes techniques vérifiées : reboot Device-Owner-only et OEM-dépendant ; OTA système impossible sans clés OEM/root (DO limité à setSystemUpdatePolicy) ; provisioning DO = factory reset ; kiosque + install/uninstall silencieux faisables en DO ; AMAPI couvre nativement les 5 actions sans gérer de DPC.

---

## Réponses des advisors

### Le Contrarian
"MVP" AMAPI = démo de la console Google ; les 5 actions sont des champs JSON exécutés par Google. Reboot pas fiable cross-OEM ; "mise à jour système" = juste systemUpdate policy, comme un DPC → 3 des 5 actions ont la même limite dans les deux options, pas de vrai dilemme technique. Q3 : le lock-in n'est pas l'API mais l'ENROLLMENT — un appareil enrollé AMAPI est Device Owner par l'app Google ; migrer vers DPC custom = factory reset de chaque appareil terrain ; le coût fui en B revient en C × la flotte. Q4 : contradiction frontale, vous êtes un wrapper d'un plan propriétaire que Google peut déprécier/tarifer. Vraie question : qui est le client, accepte-t-il du 100% Google-managed ? Tranchez le positionnement avant la techno. Q2 : oui, mais c'est la seule décision peu risquée.

### Le Penseur Premiers Principes
La vraie question : "qu'est-ce que je dois prouver, et à qui ?". Ce qu'il faut prouver = le control plane (API, orchestration, mapping intention→policy→état réel) tient debout ; le contrôle d'appareil est un backend interchangeable. (1) AMAPI sans hésiter ; OTA système impossible partout → rayez ce critère. (2) "Contrat d'API d'abord" n'est pas une étape, c'est tout le produit ; la boucle sans privilège EST le MVP. (3) Pas de lock-in si le domaine parle "redémarrer cet appareil" et non "endpoint Google" → option C gratuite dès jour 1, un seul backend implémenté. (4) Défendable, seul angle honnête ; Fleet fait ça ; le DPC custom n'est pas "plus open", juste plus de surface à maintenir seul.

### L'Expansionniste
Option A par stratégie offensive. 5 actions natives par policy REST jour 1, sans factory reset. Google gère la matrice OEM que vous solo ne dompterez jamais → infrastructure gratuite vs un an de votre vie. Q2 : oui mille fois. Q3 : inversez — AMAPI vous force à concevoir l'abstraction (DeviceControlPort agnostique), qui devient la spec de référence rendant le DPC custom possible plus tard. Q4 : positionnement le plus fort — capturez la valeur rare (orchestration, multi-tenant, kiosque vertical, dashboard, workflows) sans brûler de capital sur la plomberie commoditisée. Modèle Terraform/Grafana/n8n. L'open est dans la couche au-dessus, pas dans le DPC.

### L'Outsider
Jargon dense (AMAPI, DPC, Device Owner, OEM) — un client décroche ; l'acheteur sait-il ce qu'est un "mode kiosque" ? "Open-source" qui pilote une app fermée de Google = contradictoire ("open-washing"), sauf à nommer la frontière ("control plane ouvert, moteur Google"). Q2 : bon sens, séquencez ainsi. Vous êtes SEUL ; vous décrivez déjà B comme intenable → vous avez répondu. Vrai risque de A : psychologique (repousser l'app maison à jamais), pas l'enfermement technique. Question qui résume tout : à qui démontrez-vous ce MVP, et se soucie-t-il de "open" ou juste que les 5 actions marchent ?

### L'Executor
Option A. Lundi : projet GCP + activer Android Management API + compte de service (1-2h). Mardi : enrôler enterprise, enrollment token, QR sur émulateur (jetable), policy minimale. Mercredi : valider les 5 actions (REBOOT command, kiosque LOCK_TASK/kioskCustomLauncher, install/uninstall installType, update autoUpdateMode). Reste : câbler apps/api, un endpoint = un appel REST AMAPI (POST /devices/:id/commands, PATCH /devices/:id/policy), Drizzle/Postgres pour device↔enterprise. Lock-in : non si contrat neutre (verbe "reboot" pas "amapi.reboot"), ProviderInterface, mais pas d'abstraction tant qu'un seul provider (sinon sur-conception). Q4 défendable. Livrable fin de semaine : reboot + kiosque sur émulateur via l'API.

---

## Peer review (anonymisation : A=Outsider, B=Executor, C=Contrarian, D=Expansionniste, E=Premiers Principes)

- **Review 1 :** plus forte = E. Angle mort = C (thèse "pas de vrai dilemme" exagérée) mais son point lock-in d'enrollment est réel. Oubli collectif : coût réel AMAPI (compte Google côté client), RGPD/souveraineté, viabilité commerciale vs Esper/Scalefusion.
- **Review 2 :** plus forte = D (recadre lock-in en avantage, thèse couche orchestration). Angle mort = D (ignore le factory reset de migration). Oubli : Enterprise validée Google + quotas + risque tarification/dépréciation, fiabilité cross-OEM, RGPD.
- **Review 3 :** plus forte = E. Angle mort = C (s'arrête au diagnostic, dramatise un risque de migration qu'un MVP solo n'a pas). Oubli : coût non technique d'AMAPI (Managed Google Play, validation EMM, quotas) — l'obstacle est administratif, pas le code.
- **Review 4 :** plus forte = E. Angle mort = D (multi-tenant prématuré pour un solo). Oubli : compte Google EMM vérifié (délais, bloquant "lundi") ; aucun critère de sortie/validation ; émulateur ≠ terrain ; RGPD.
- **Review 5 :** plus forte = E. Angle mort = B (émulateur ne prouve pas les 5 actions réelles). Oubli : éligibilité AMAPI (projet validé + accord EMM, devices certifiés), acheteur réel, résidence des données/RGPD, maintenance (dépréciations API, support OEM, astreinte solo).

---

## Synthèse du Chairman

**Convergence (5/5) :** Option A (AMAPI) pour le MVP ; OTA système à rayer comme critère (impossible partout) ; DPC custom = plus de surface, pas plus "open" ; Q2 validée (le contrat d'API est le produit) ; Q4 défendable à condition de nommer la frontière.

**Opposition :** lock-in. Camp "pas de lock-in" (FP/EXP/EXE) raisonne au niveau code (réversible) ; le Contrarian raisonne au niveau flotte déployée (migration = factory reset). Arbitrage : un MVP solo n'a pas de flotte → risque go-to-market futur, pas MVP.

**Angles morts (peer review unanime) :** coût NON technique d'AMAPI — éligibilité administrative/validation Google EMM, quotas ; émulateur ≠ terrain (1 appareil physique requis) ; RGPD/souveraineté ; wrapper sans moat ; acheteur réel.

**Recommandation :** Option A pensée comme C dès le jour 1 au niveau du vocabulaire (verbes métier neutres, ProviderInterface à implémentation unique, pas d'abstraction codée prématurément). Séquencement validé : construire le control plane d'abord. Lock-in : nul au stade MVP. Deux conditions non négociables : vérifier l'éligibilité AMAPI avant tout code ; nommer la frontière open et acheter un appareil physique.

**Premier pas :** créer le projet GCP, activer l'Android Management API et tenter de créer une Enterprise de test, pour savoir maintenant si l'éligibilité administrative est un mur ou une formalité.
