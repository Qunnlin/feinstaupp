# Inhaltsvereichnis
- [Inhaltsvereichnis](#inhaltsvereichnis)
- [Einleitung](#einleitung)
- [Visuelle Analyse Luftqualität Stuttgart](#visuelle-analyse-luftqualit%c3%a4t-stuttgart)
  - [Ziel des Projekts](#ziel-des-projekts)
  - [Vorgehensweise](#vorgehensweise)
  - [Umsetzung](#umsetzung)
  - [Bewertung](#bewertung)
  - [Zusammenfassung und Ausblick](#zusammenfassung-und-ausblick)
  - [Anhänge](#anh%c3%a4nge)
# Einleitung

# Visuelle Analyse Luftqualität Stuttgart
In diesem Dokument soll das Abschlussprojekt **Feinstaupp** von Felix Schick und Nicolas Mohr für das Modul Geovisualisierung im WS 19/20 vorgestellt und die verschiedenen Arbeitsschritte und Herausforderungen in der Entwicklung dokumentiert werden.

## Ziel des Projekts

Ziel des Projekts ist es eine Webapplikation zu entwickeln, welche *open source* Feinstaub- und Umweltdaten, wie Temperatur, Luftdruck und Verkehrsdichte, auf einer Karten visualisiert und eine Analyse über die mögliche Korrelation dieser zulässt.

## Vorgehensweise

Das Grundgerüst der Anwendung soll mit dem Vue.js Framework erstellt werden.
Durch sein Komponenten-basiertes Design ist das erstellen von leicht erweiterbaren Anwendungen möglich.

Als erster Meilenstein des Projekts soll mit einer Karten-API eine Karte von Stuttgart angezeigt werden.
Anschließend sollen die Umwelt- und Feinstaubdaten von APIs abgefragt werden.
Aus den erhaltenen Daten sollen verschiedenen Layer erstellt werden, die über die Karte gelegt werden können.
Diese Layer sollen die Stärke der jeweiligen Ausprägung der Daten farblich darstellen.
Durch das aktivieren von mehreren Layers wird visuell erkennbar, ob und an welchen Orten eine Korellation zwischen den verschiedenen Datenätzen besteht.



## Umsetzung


### Implementierung einer Web-Applikation in Vue.js



### Integration der Karten API

Als erste Karten API fasssten wir die HERE API ins Auge,
da sie über dieselbe API auch Verkehrsdaten bietet.
Auch die Google Maps API bietet direkt über die Maps API Verkehrsdaten.
Im Vergleich stellte sich die Google Maps API aber durch umfassendere und genauere Verkehrsdaten als die bessere Alternative heraus.

### Integration Daten APIs

- Feinstaubdaten von luftdaten.info


- Wettterdaten von openweather
    - Temperatur
    - Luftdruck
    - Luftfeuchtigkeit
    - Windgeschwindigkeit



### Tile Map

### Implementierung des Interpolations-Algorithmus
Da sich nicht innerhalb jeder Kachel ein Sensor finden lässt begannen wir mit der Entwicklung eines Algorithmus zur Interpolation von gemittelten Sensorwerten für die Kacheln.
Für diese Aufgabe wählten wir die Sprache Purescript, die durch ihre statische Typisierung besser für das sichere Implementieren von Datenstrukturen und Algorithmen geeignet ist als Javascript. Da Purescript zu Javascript kompiliert, versprachen wir uns eine nahtlose Einbindung mit der restlichen Anwendung.
Wir entschieden uns in diesem Schritt für einen Algorithmus, der mit jeder Kachel die besten Sensorwerte aus den verschiedenen Himmelsrichtungen assoziiert.


### Implementierung des Algorithmus zur Koordinatenübersetzung

Um die Positionen der Sensoren erfolreich auf eine zweidimensional Kachelmatrix übertragen zu können, ist ein Algorithmus zur Umrechnung von Koordinaten in Matrix-Indizes unter Beachtung der Größe des sichtbaren Kartenabschnitts und der Auflösung der Kachelmatrix erforderlich.
Auch dieser wurde in Purescript implementiert.


### Integration der Algorithmen in die restliche Anwendung

Leider war es schwieriger als erwartet, die vom Purescript-Code generierten Datenstrukturen in leserlichen Javascript-Datenstrukturen zu umzuwandeln. Die Ursache dafür liegt vermutlich an unserer geringen Erfahrung mit Purescript und dem Fehlen eines einfachen Werkzeugs zur Umwandlung von komplexen Datenstrukturen wie TreeMaps in simple Javascript Datenstrukturen.
Mit einer Funktion zum Parsen der Purescript Datenstrukturen gelang es uns dennoch, die Daten gut leserlich zur Weiterverarbeitung vorzubereiten.

### Mitteln der Sensordaten mit Inverser Distanzwichtung
Letztendlich mussten wir noch einen Algorithmus entwickeln, der die mit jeder Kachel assoziierten Sensorwerte gegeinander aufwiegt. Hierfür wählten wir die Inverse Distanzgewichtung, die wir ebenfalls in Javascript implementierten.
Der resultierenden Wert bildet den Richtwert für die Einfärbung jeder Kachel.


### Normalisierung und Umwandlung der Daten in Farbgradienten

Anschließend mussten die interpolierten Daten normalisiert und passende Farbgradienten für die Farbdarstellung als Kartenlayer berechnet werden.
Dies erforderte fachspezifische Nachforschungen für die akzeptablen Werte der verschiedenenen Messwerte. Folgende Werte wurde in einer Online-Recherche ermittelt.

 - Feinstaubwerte: 
 - atmosphärischer Druck: 0,950 - 0,970 bar als untere Grenze, 1,040 bis 1,065 als obere Grenze [ref](https://www.goruma.de/erde-und-natur/meteorologie/hoch-und-tiefdruckgebiete)
 - Temperatur: -10 Grad Celsius bis 40 Grad Celsius
 - Relative Luftfeuchtigkeit: 0 % relative Luftfeuchtigkeit bis 100 % relative Luftfeuchtigkeit

Mit diesem Wissen konnten wir eine Funktion implementieren, die anhand der Grenzwerte die absoluten Sensorwerte in einen pro Datenkategorie unterschiedlichen Farbverlauf einordnet.

### Darstellung als Layer über der Karte


### UI - Elemente und Legende


## Bewertung

Das ursprünglich geplanten Implementieren von historischen Daten stellte sich als schwierig heraus. Zum einen ist über die freien bzw. Studentenlizenzen der meisten APIs nur das Abfragen von aktuellen Daten oder Daten aus der unmittelbarer Vergangenheit möglich. Das Abfragen von historischen Daten erfordert Lizenzkosten, die das Projektbudget übersteigen.
Als Alternative käme das eigenhändige Abfragen von Sensorendaten in Frage. Dies war uns allerdings zeitlich nicht mehr möglich.


## Zusammenfassung und Ausblick


## Anhänge