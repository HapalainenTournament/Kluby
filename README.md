# Clubroom FC27 v12

Hotfix datové vrstvy proti v11.

- squad používá `/members/stats` jako primární season dataset; career je pouze fallback
- opravené mapování přesných EA FC27 polí: passesMade, passSuccessRate, tacklesMade, tackleSuccessRate, shotSuccessRate, cleanSheetsDef/GK, redCards
- doplněné per-game G/Z, A/Z a G+A/Z
- crest používá skutečný EA FC web asset podle `customKit.crestAssetId`
- backend, DB historie, match analytics a tabs zachovány
