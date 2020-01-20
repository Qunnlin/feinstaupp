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

Ziel des Projekts ist es eine Webapplikation zu entwickeln, welche *open source* Feinstaub- und Umweltdaten, wie Temperatur, Luftdruck und Verkehrsdichte, visualisiert und eine Analyse über die mögliche Korrelation dieser zulässt.

## Vorgehensweise

- Abfrage von passenden Sensoren APIs

- Interpolation von Gebieten, fuer die keine Sensorendaten vorliegen


- Darstellung als Layer ueber google maps

## Umsetzung


### Implementierung einer Web-Applikation in Vue.js



### Integration der Karten API

- here => leaflet => google
- layer
- ui features

### Plan: Tile Layer



### Implementierung des Interpolations-Algorithmus
Parallel hierzu entwickelten wir einen Algorithmus zur Interpolierung von gemittelten Sensorwerten für die Kacheln, zu denen keine unmittelbaren Sensorwerte vorliegen.
Für diese Aufgabe wählten wir die Sprache Purescript, die durch ihre statische Typisierung besser für das sichere Implementieren von Datenstrukturen und Algorithmen geeignet ist als Javascript. Da Purescript zu Javascript kompiliert, versprachen wir uns eine nahtlose Einbindung mit der restlichen Anwendung.

### Implementierung des Algorithmus zur Koordinatenübersetzung

Um die Positionen der Sensoren erfolreich auf eine zweidimensional Kachelmatrix übertragen zu können, ist ein Algorithmus zur Umrechnung von Koordinaten in Matrix-Indizes unter Beachtung der Größe des sichtbaren Kartenabschnitts und der Auflösung der Kachelmatrix erforderlich.
Auch dieser wurde in Purescript implementiert.


### Integration der Algorithmen in die restliche Anwendung

Leider war es schwieriger als erwartet, die vom Purescript-Code generierten Datenstrukturen in leserlichen Javascript-Datenstrukturen zu decodieren. Die Ursache dafür liegt vermutlich an der geringen Erfahrung des Projektteams mit Purescript.

### Normalisierung und Umwandlung der Daten in Farbgradienten

Anschließend mussten die interpolierten Daten normalisiert und passende Farbgradienten für die Farbdarstellung als Kartenlayer berechnet werden.
Dies erforderte fachspezifische Nachforschungen für die akzeptablen Werte der verschiedenenen Messwerte. Folgende Werte wurde in einer Online-Recherche ermittelt.

 - Feinstaubwerte: 
 - atmosphärischer Druck: 0,950 - 0,970 bar als untere Grenze, 1,040 bis 1,065 als obere Grenze [ref](https://www.goruma.de/erde-und-natur/meteorologie/hoch-und-tiefdruckgebiete)
 - Temperatur: -10 Grad Celsius bis 40 Grad Celsius
 - Relative Luftfeuchtigkeit: 0 % relative Luftfeuchtigkeit bis 100 % relative Luftfeuchtigkeit

### Darstellung als Layer über der Karte


## Bewertung

- Historische Daten schwierig

- Wetterdaten nicht so detailliert wie gewuenscht, da großer Mangel an guten APIs (?)


## Zusammenfassung und Ausblick


## Anhänge