# Allure — Règles scientifiques du moteur de plans (V2.0)

> **Statut : Validé pour implémentation** (D13, D54).
> Date : 2026-11-20. Version cible : V2.0 (règles et calculs) puis V2.1 (génération hebdomadaire).

## 1. Objectif

Proposer un **plan d'entraînement course hebdomadaire** adapté à l'objectif principal actif, aux disponibilités et au niveau estimé, sous forme de **séances proposées** dans `planned_sessions` (origine `engine`). Le plan propose, l'utilisateur décide : toute séance peut être déplacée, sautée ou modifiée ; le moteur recalcule la fenêtre glissante et explique chaque ajustement.

Le moteur ne remplace pas le jugement de l'utilisateur. Il fournit des **fourchettes** et des **repères**, jamais une fausse précision.

## 2. Principes directeurs

1. **Transparence** — chaque règle cite sa base scientifique, ses limites et son garde-fou.
2. **Honnêteté** — toute prédiction ou allure cible s'exprime sous forme de fourchette.
3. **Le plan propose, l'utilisateur décide** — aucune modification destructive sans confirmation ; les séances verrouillées sont respectées.
4. **Pas de score opaque** — la charge est un TRIMP documenté, pas une boîte noire propriétaire.
5. **Sobriété et confidentialité** — données de santé protégées par RLS, aucun envoi vers des services d'IA externes.

## 3. Données d'entrée et valeurs de repli

| Source | Champs utilisés | Repli si manquant |
|---|---|---|
| `profiles` | `birth_date` (âge), `sex` (optionnel), `hr_max` (optionnel), `hr_rest` (optionnel), `weekly_availability`, `experience_level`, `timezone` | `hr_max = 220 − âge` ; `hr_rest = 60` bpm ; `sex = 'neutral'` ; `experience_level = 'beginner'` |
| `profiles` (course) | Volume hebdomadaire habituel (`baseline_weekly_km`), volume plafond (`max_weekly_km`), allures déclarées (facile, seuil, course), records (avec date) | Déduit des 4 dernières semaines de `run_sessions` (ou défaut conservateur à 15 km/sem) |
| `goals` (principal actif, `sport = 'run'`) | `distance_m`, `race_date`, `target_time_sec` (optionnel) | Plan d'entretien aérobie général sans pic d'affûtage |
| `run_sessions` / `run_details` | Historique récent (distance, durée, allure, FC moyenne, date) | Démarrage progressif basé sur le profil déclaré |
| `daily_checkins` | Score forme/fatigue (`1` à `5`) sur les 7 derniers jours | Considéré neutre (`3/5`) |
| `injuries` | Blessures actives (`status = 'active'`, zone anatomique) | Aucune restriction active |

Si une donnée manque, le moteur utilise une **valeur par défaut conservatrice**, marque le calcul avec `is_estimated = true` et le signale dans l'explication.

## 4. Estimation du niveau : VDOT

**Base** : Daniels et Gilbert, *Oxygen Power: Performance Tables for Distance Runners* (1979) ; mise à jour Daniels, *Daniels' Running Formula* (3e éd., 2014).

**Principe** : le VDOT est un indice unique résumant la capacité aérobie à partir d'une performance (distance + temps), permettant de dériver des fourchettes d'allures d'entraînement.

**Calcul** :
- À partir d'un record (distance `d` en m, temps `t` en min) :
  - Vitesse : `v = d / t` (m/min).
  - Consommation d'O₂ à cette vitesse : `VO2 = -4.60 + 0.182258·v + 0.000104·v²`.
  - Fraction de VO2max soutenable : `F = 0.8 + 0.1894393·e^(-0.012778·t) + 0.2989558·e^(-0.1932605·t)`.
  - `VDOT = VO2 / F`.
- **Records éligibles** : 5 km, 10 km, semi-marathon, marathon datant de **moins de 12 mois** à la date du calcul. On retient le **meilleur VDOT** parmi ces records valides.
- **Repli sans record récent** : estimation prudente depuis le volume hebdomadaire et l'allure facile déclarée (assimilée à 65 % du VDOT), marquée `is_estimated = true`.

**Limites** :
- Supposé réalisé à fond sur terrain plat et en conditions tempérées.
- Surestime légèrement les coureurs débutants.
- Ne tient pas compte du dénivelé, de la chaleur ou de l'altitude.

**Garde-fous** :
- Ignorer tout record datant de 12 mois ou plus (éviter des allures obsolètes après coupure).
- Borner strictement le VDOT dans l'intervalle `[25, 85]`.
- Marquer `is_estimated = true` si déduit de l'allure facile.
- Toujours afficher la source (distance et date du record utilisé).

## 5. Allures d'entraînement (inversion et fourchettes)

**Base** : Daniels, *Daniels' Running Formula* (tableaux d'allures par zone).

**Inversion VDOT → Allure (min/km)** :
- Pour un pourcentage cible `p` (`0.59` à `1.10`), on pose `VO2_cible = p · VDOT`.
- La vitesse cible `v` (m/min) est la racine positive de `0.000104·v² + 0.182258·v - (4.60 + VO2_cible) = 0` :
  - `v = (-0.182258 + sqrt(0.182258² + 4 × 0.000104 × (4.60 + VO2_cible))) / (2 × 0.000104)`
- Allure correspondante : `allure_sec_km = 60000 / v`.

**Zones dérivées** :

| Zone | Nom | % VDOT | Usage |
|---|---|---|---|
| E | Facile | 59–74 % | Endurance fondamentale, récupération active |
| M | Marathon | 75–84 % | Allure spécifique marathon, fond soutenu |
| T | Seuil | 83–88 % | Seuil lactique, tempo continu ou fractionné long |
| I | Intervalles | 95–100 % | Développement VO2max |
| R | Répétitions | 105–110 % | Économie de course, vitesse neuromusculaire |

**Limites** : les pourcentages sont des repères ; l'allure réelle dépend du terrain, de la fatigue et de la chaleur.

**Garde-fous** :
- **Ordonnancement strict aux extrêmes** : pour les faibles VDOT (25–32), imposer un écart minimal de `5 sec/km` entre deux zones consécutives pour garantir `Allure(E) > Allure(M) > Allure(T) > Allure(I) > Allure(R)`.
- Toujours afficher le nom complet de la zone et la **fourchette** (ex. `Zone E (Facile) : 5:35–6:15 /km`), jamais une allure cible unique.

## 6. Charge d'entraînement : TRIMP

**Base** : Banister et al., *Modeling elite athletic performance* (1991) ; Morton, Fitz-Clarke et Banister, *Modeling human performance in running* (1990).

**Principe** : TRIMP (Training Impulse) = durée × intensité pondérée par la fréquence cardiaque.

**Calcul avec fréquence cardiaque** (import montre / capteur) :
- `HRmax` : utiliser `profiles.hr_max` si renseigné ; sinon `HRmax = 220 − âge` (marqué `estimated`).
- FC de réserve : `HRR = HRmax − HRrest`.
- Ratio de réserve : `delta_HR = clamp((FCmoy − HRrest) / HRR, 0, 1)`.
- `TRIMP = durée_min × delta_HR × k` :
  - Profil masculin : `k = 0.86 · e^(1.67 · delta_HR)`
  - Profil féminin : `k = 0.64 · e^(1.92 · delta_HR)`
  - Sexe non renseigné / neutre : `k = 1.0` (marqué `is_estimated = true`)

**Calcul sans fréquence cardiaque** (saisie manuelle) :
- `TRIMP_estimé = durée_min × coeff_type` (marqué `is_estimated = true`) :
  - Facile (Zone E) : `1.0`
  - Sortie longue (Zone E/M) : `1.2`
  - Seuil (Zone T) : `1.5`
  - Intervalles / Répétitions (Zone I/R) : `1.8`

**Agrégation** : TRIMP hebdomadaire = somme des TRIMP des séances de la semaine, affiché dans Stats avec tendance (semaine courante vs précédente).

**Limites** :
- La FC dépend de la chaleur, du sommeil et du stress.
- Le TRIMP ne capture pas la charge mécanique/neuromusculaire (côtes, descentes, sprints).

**Garde-fous** :
- Afficher le TRIMP dans **Stats** uniquement, avec sa source (`FC mesurée` ou `Estimé par type`).
- Ne jamais prescrire une séance uniquement sur une cible de TRIMP.
- Toujours accompagner d'une tendance et de la mention « repère, pas une vérité ».

## 7. Progression hebdomadaire

**Base** : principe de surcharge progressive ; Seiler (2010) ; prévention des blessures de surcharge.

**Volume de référence (`V_ref`)** :
- Moyenne glissante des **3 dernières semaines actives** (semaines comportant au moins 1 séance réalisée), afin d'éviter un blocage à 0 km après une semaine sautée.

**Règle de progression bornée** :
- En semaine de charge standard : `V_cible <= V_ref + clamp(0.10 × V_ref, +2 km, +7 km)`.
- Plancher `+2 km` pour éviter la stagnation à bas volume ; plafond `+7 km` pour éviter les sauts excessifs à haut volume.

**Cycles et reprise** :
- **Semaine de récupération** : toutes les 3 semaines (débutant) ou 4 semaines (intermédiaire/avancé), réduire le volume cible de **20–30 %** par rapport à `V_ref`.
- **Reprise après coupure** : si la semaine `S-1` affiche moins de 50 % du volume prévu, reprendre la semaine `S` à **80–85 %** de `V_ref` avant de réactiver la hausse.

**Garde-fous** :
- Plafonner le volume à `max_weekly_km` défini par l'utilisateur.
- Bloquer toute augmentation si le check-in fatigue est déclenché ou si une blessure est active.

## 8. Structure d'une semaine type

**Base** : polarisation de l'intensité (Seiler, 2010) — répartition cible d'environ 80 % en Zone E et 20 % maximum en Zones T, I ou R.

**Composition proposée** (selon le nombre de jours disponibles `n`) :

| n | Séances | Règles d'équilibre |
|---|---|---|
| 1 | 1 facile (Zone E) | Signalement affiché : fréquence insuffisante pour une progression structurée. |
| 2 | 1 facile (Zone E) + 1 facile longue (Zone E, finition Zone M optionnelle en phase spécifique) | Pas de fractionné intense à 2 séances/semaine pour respecter l'équilibre 80/20. |
| 3 | 2 faciles (Zone E) + 1 qualité (Zone T ou I) | Volume de qualité limité à 20 % du volume hebdomadaire. |
| 4 | 2 faciles (Zone E) + 1 qualité (Zone T ou I) + 1 longue (Zone E–M) | Structure de référence pour 10 km, semi-marathon et marathon. |
| 5+ | `(n − 2)` faciles (Zone E) + 1 qualité + 1 longue | En phase spécifique avancée (`n >= 6`, coureur intermédiaire/avancé), option `(n − 3)` faciles + 2 qualité + 1 longue. |

**Contraintes** :
- Jamais deux séances de qualité consécutives.
- Au moins **48 h** entre deux séances de qualité, et au moins **48 h** entre une séance de qualité et la sortie longue.
- La sortie longue ne dépasse pas **30–35 %** du volume hebdomadaire total, ni **2 h 45** en préparation marathon.
- Les jours disponibles proviennent strictement de `weekly_availability`.

## 9. Adaptation à l'objectif et affûtage

**Base** : Daniels, *Daniels' Running Formula* (plans par distance) ; principe de spécificité.

**Règle** : à mesure que la course approche (dernières 8–12 semaines), on augmente la spécificité :
- **5 km / 10 km** : montée progressive des intervalles (Zone I) et du seuil (Zone T).
- **Semi-marathon** : travail au seuil (Zone T) et blocs à allure spécifique.
- **Marathon** : allongement de la sortie longue et intégration de blocs en Zone M.

**Affûtage automatique** :
- **Courses courtes (5 km, 10 km)** : durée de **7 à 10 jours**, réduction du volume de **20–30 %**.
- **Courses longues (Semi, Marathon)** : durée de **14 jours**, réduction du volume de **30–50 %** (-25 % en `S-2`, -45 % en `S-1`).
- Maintien de courts rappels d'allure spécifique en début d'affûtage.

**Garde-fous** :
- Aucune séance de qualité (Zones T, I, R) dans les **3 derniers jours** avant la course (`J-3` à `J-1`), uniquement un footing léger de 20–30 min en Zone E à `J-2` ou `J-1`.
- Affûtage marqué « repère conseillé, ajustable selon tes sensations ».

## 10. Boucle d'adaptation / recalcul

À chaque déclencheur, le moteur réévalue la **fenêtre glissante des 7 à 14 prochains jours** sans toucher aux séances passées ni aux séances verrouillées par l'utilisateur.

| Déclencheur | Condition | Action du moteur |
|---|---|---|
| **Séance déplacée ou sautée** | Séance marquée `skipped` ou déplacée | Rééquilibre les séances restantes en conservant 48 h entre séances intenses. **Ne jamais reporter** le kilométrage manqué sur la semaine suivante. |
| **Fatigue aiguë ponctuelle** | Check-in forme/fatigue à `1/5` sur la journée | Convertit la séance du jour en repos ou footing de 30 min en Zone E (si séance de qualité prévue). |
| **Fatigue cumulée** | Moyenne forme/fatigue `<= 2.0/5` sur **3 jours consécutifs** | Bascule immédiatement en **semaine de récupération** (-25 % de volume, suppression des séances de qualité). |
| **Blessure active** | Entrée `injuries` avec `status = 'active'` | Réduit le volume de **30 %**, **supprime toutes les séances de qualité (T, I, R) et le dénivelé**, conserve uniquement de l'endurance plate en Zone E et affiche un rappel de prudence médicale. |
| **Nouveau record validé** | Séance importée générant un VDOT supérieur (record < 12 mois) | Recalcule le VDOT et les 5 fourchettes d'allures, puis propose la mise à jour des séances futures. |

**Explication et garde-fous** :
- Chaque recalcul produit un `recalculation_reason` traduit en phrase claire dans l'interface (ex. « Volume réduit de 25 % suite à une fatigue élevée sur 3 jours »).
- Toujours demander confirmation avant de supprimer des séances déjà planifiées par l'utilisateur.

## 11. Ce que le moteur ne fait pas (V2.0)

- Pas de plan musculation (reporté en V3).
- Pas de synchronisation Coros / Garmin automatique (import manuel `.fit` / `.gpx`).
- Pas de cyclisme, pas de natation.
- Pas de prédiction de temps de course unique (fourchette uniquement).
- Pas de prescription médicale ni de diagnostic de blessure.
- Pas d'envoi de données personnelles à des services d'IA.

## 12. Références

- Banister, E. W. et al. (1991). *Modeling elite athletic performance*. In *Physiological Testing of the High-Performance Athlete*.
- Daniels, J. (2014). *Daniels' Running Formula* (3e éd.). Human Kinetics.
- Daniels, J. et Gilbert, J. (1979). *Oxygen Power: Performance Tables for Distance Runners*. CO2 Press.
- Morton, R. H., Fitz-Clarke, J. R. et Banister, E. W. (1990). *Modeling human performance in running*. *Journal of Applied Physiology*.
- Seiler, S. (2010). *What is best practice for training intensity and duration distribution in endurance athletes?* *International Journal of Sports Physiology and Performance*.

## 13. Décisions validées (D13, D54)

- [x] Formule VDOT validée avec fenêtre d'ancienneté des records (< 12 mois) et bornes `[25, 85]`.
- [x] TRIMP validé avec coefficients de genre (masculin/féminin/neutre) et priorité au champ `hr_max` manuel.
- [x] Progression 10 % validée avec moyenne glissante sur 3 semaines actives et bornes `[+2 km, +7 km]`.
- [x] Structure de semaine validée (endurance pure à 2 séances, généralisation `(n − 2)` à 5+ séances).
- [x] Affûtage automatique validé et modulé selon la distance (7–10 j court vs 14 j long).
- [x] Seuils de fatigue validés (`<= 2.0/5` sur 3 j pour semaine de récupération + `1/5` ponctuel sur la séance du jour).