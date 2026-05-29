# ITA-penpal
PenPal serverless aplikacija (za predmet IT arhitekture)

Namenjena pošiljanju in prejemanju digitalnih "pisem" med obstoječimi in novimi prijatelji.

Osnovne funkcionalnosti:
1. Registracija in prijava uporabnikov
2. Pošiljanje in prejemanje pisem
3. Urejanje profila in vpogled v profile drugih uporabnikov
4. Iskanje in dodajanje prijateljev
5. Dodajanje datotek pismom

PenPal je zamišljen kot simulacija izkušnje pošiljanja fizičnih pisem po pošti, zato so uporabniki
vezani na lokacijo (prebivališče, ki je seveda lahko poljubno) in prenos pisem k prejemniku traja
določen čas, odvisno od razdalje med pošiljateljem in prejemnikom. Zaradi uporabe različnih metod
prevoza pa čas pošiljanja ni premo sorazmeren razdalji, temveč je odvisen tudi od predvidene
metode prevoza. Npr. pismo iz Evrope v Ameriko bo potovalo kakšen teden, iz Ljubljane v Maribor pa
kakšen dan, čeprav je prva razdalja veliko več kot 7-kratnik druge razdalje.

Ideje za nadgradnjo:
- Oblikovanje pisem z različnimi pisavami, barvami, itd.
- Dodajanje "znamke" pismom, ki jo pošiljatelj lahko sam nariše
- Integracija določenih prilog v grafični vmesnik (npr. slika je v pismu priložena na viden način,
(embedded) namesto samo povezave do datoteke)
- Poljubno risanje v pismu (npr. lastnoročni podpis, emoji, v glavnem približek izkušnji pisanja z
lastno roko na papir)
