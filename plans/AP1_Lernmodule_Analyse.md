# AP1 Lernmodule — Vollständige Analyse & Modulplanung

## Grundlage dieser Analyse

Diese Analyse basiert auf:
- Deinen bestehenden 11 Topics mit 112 Subtopics (Karteikarten-App)
- Dem **neuen Prüfungskatalog ab 2025** (2. Auflage, ZPA Nord-West)
- Analyse der **bisherigen AP1-Prüfungen 2021–2025**
- Stefan Mackes Themenliste (IT-Berufe-Podcast)
- Community-Feedback von fachinformatiker.de

### Wichtige Änderungen ab 2025 (Prüfungskatalog)
- **GESTRICHEN aus AP1:** SQL, RAID, Struktogramm, PAP (Programmablaufplan), NoSQL
- **NEU in AP1:** BPMN, KI-Grundlagen, Barrierefreiheit, einheitliche Belegsätze
- **Weiterhin drin:** Netzplan, Gantt, UML (Use Case, Klassendiagramm, Aktivitätsdiagramm), Pseudocode, Subnetting, Nutzwertanalyse, EPK (im Beiblatt), ERD

---

## Modul-Übersicht: 20 interaktive Lernmodule

Die Module sind nach **Prüfungsrelevanz** sortiert (basierend auf Häufigkeit in bisherigen Prüfungen und Punktegewicht).

---

## TIER 1 — Absolute Pflicht-Module (kommen fast immer dran, hohe Punktzahl)

---

### Modul 1: 🌐 IP-Adressen & Subnetting-Rechner
**Bezug:** Topic 2.4 Netzwerk, 4.5 Netzwerkverbindungen
**Prüfungsrelevanz:** ★★★★★ (kam in JEDER bisherigen AP1 vor)

**Features:**
- IPv4-Subnetting: Netzadresse, Broadcast, Hostbereich, Subnetzmaske berechnen
- CIDR-Notation ↔ Subnetzmaske umrechnen
- Netz aufteilen: "Teile 192.168.33.0/24 in 4 gleiche Subnetze"
- Öffentliche vs. private IP-Adressen erkennen
- IPv6-Kurzschreibweise üben (Nullen kürzen, :: Regel)
- IPv6-Subnetting Grundlagen
- Schritt-für-Schritt-Lösungsweg anzeigen (nicht nur Ergebnis)
- Zufallsgenerierte Aufgaben mit Schwierigkeitsgrad

**Interaktion:** User gibt Lösung ein → sofortiges Feedback mit Erklärung des Lösungswegs

---

### Modul 2: 📊 Netzplantechnik-Board
**Bezug:** Topic 7.7 Termine und Netzplantechnik
**Prüfungsrelevanz:** ★★★★★ (Standard-Punktebringer)

**Features:**
- Nodes per Drag & Drop auf Canvas erstellen
- Felder pro Node: Vorgangsname, Dauer, FAZ, FEZ, SAZ, SEZ, GP, FP
- Vorgänger/Nachfolger per Pfeil verbinden
- Vorwärts- und Rückwärtsrechnung durchführen
- Kritischen Pfad automatisch hervorheben (oder User markieren lassen)
- Pufferzeiten berechnen und anzeigen
- Vorgefertigte Übungsaufgaben aus alten Prüfungen
- Freier Modus: eigene Netzpläne erstellen

**Interaktion:** User füllt die Felder selbst aus → Validierung pro Schritt → Fehler werden rot markiert

---

### Modul 3: 📐 Nutzwertanalyse-Tool
**Bezug:** Topic 6.3 Nutzwertanalyse
**Prüfungsrelevanz:** ★★★★★ (kam in fast jeder AP1 vor, hohe Punktzahl)

**Features:**
- Kriterien definieren und benennen
- Gewichtung vergeben (Summe muss 100% / 1.0 ergeben)
- Alternativen/Produkte anlegen
- Bewertungen eintragen (z.B. 1–5 oder 1–10)
- Gewichtete Teilnutzwerte automatisch berechnen
- Gesamtnutzwert und Ranking anzeigen
- Ergebnis interpretieren: "Warum gewinnt Alternative A?"
- Übungsaufgaben: "Vergleiche 3 Laptops anhand von..."

**Interaktion:** User baut die komplette NWA selbst auf → Zwischenrechnungen prüfen

---

### Modul 4: 🔢 Zahlensysteme-Konverter & Trainer
**Bezug:** Topic 1.2 Bits & Bytes, 1.3 Zahlensysteme
**Prüfungsrelevanz:** ★★★★★ (Grundlage, kommt immer dran)

**Features:**
- Umrechnung: Dezimal ↔ Binär ↔ Oktal ↔ Hexadezimal
- User tippt Lösung ein, bekommt Schritt-für-Schritt-Feedback
- Binäraddition üben
- Zweierkomplement berechnen
- Bits & Bytes umrechnen (inkl. **Binärpräfixe**: KiB, MiB, GiB — IHK-Pflicht!)
- Datenübertragung berechnen (Übertragungszeit, Bandbreite)
- Speichergrößen berechnen (z.B. Bilddatei: Auflösung × Farbtiefe)

**Interaktion:** Zufallsaufgaben mit steigendem Schwierigkeitsgrad

---

### Modul 5: 🏗️ UML-Diagramm-Werkstatt
**Bezug:** Topic 8.8 UML
**Prüfungsrelevanz:** ★★★★★ (seit 2025 noch wichtiger, da Struktogramm/PAP gestrichen)

**Features (3 Diagrammtypen):**

**a) Use-Case-Diagramm:**
- Akteure erstellen (Strichmännchen)
- Use Cases erstellen (Ovale)
- Beziehungen: include, extend, Vererbung
- Systemgrenzen zeichnen

**b) Klassendiagramm:**
- Klassen erstellen mit Name, Attributen, Methoden
- Sichtbarkeit: + public, - private, # protected (NEU in AP1 2025!)
- Beziehungen: Assoziation, Aggregation, Komposition, Vererbung
- Kardinalitäten setzen (1, 0..*, 1..*)

**c) Aktivitätsdiagramm:**
- Start/Ende-Knoten
- Aktionen, Entscheidungen (Raute), Parallelisierung
- Swimlanes für verschiedene Akteure

**Interaktion:** Drag & Drop Builder + vorgefertigte Aufgaben zum Vervollständigen

---

### Modul 6: 🗄️ ER-Diagramm-Builder (Chen-Notation)
**Bezug:** Topic 8.12 ERD Chen-Notation, 8.11 Relationale Datenbanken
**Prüfungsrelevanz:** ★★★★★

**Features:**
- Entitäten erstellen (Rechtecke)
- Attribute hinzufügen (Ovale) — Primärschlüssel unterstrichen
- Beziehungen erstellen (Rauten)
- Kardinalitäten: 1:1, 1:n, m:n
- Überführung in relationales Modell (Tabellen ableiten)
- Normalisierung üben: 1NF, 2NF, 3NF
- Übungsaufgaben: "Modelliere eine Bibliothek / einen Webshop / eine Schulverwaltung"

**Interaktion:** Canvas mit Drag & Drop + Validierung der Kardinalitäten

---

## TIER 2 — Sehr wichtige Module (kommen regelmäßig dran)

---

### Modul 7: ⚡ EPK-Builder (Ereignisgesteuerte Prozesskette)
**Bezug:** Topic 6 Wirtschaft (Geschäftsprozesse)
**Prüfungsrelevanz:** ★★★★☆ (steht im Beiblatt des Prüfungskatalogs, kam bereits in AP1 dran z.B. "EPK zur Wareneingangsbearbeitung erstellen")

**Features:**
- Elemente per Drag & Drop:
  - **Ereignisse** (Sechsecke/Hexagone) — passiver Zustand
  - **Funktionen** (Rechtecke mit abgerundeten Ecken) — aktive Tätigkeit
  - **Konnektoren** (Kreise): UND (∧), ODER (∨), XOR (⊻)
  - **Organisationseinheiten** (Ovale) — wer führt aus?
  - **Informationsobjekte** (Rechtecke) — welche Daten?
- Verbindungspfeile zwischen Elementen ziehen
- Validierung: Regelprüfung (z.B. "Zwei Ereignisse dürfen nicht direkt aufeinander folgen", "EPK muss mit Ereignis beginnen und enden")
- Übungsmodi:
  - Geschäftsprozess-Beschreibung → EPK modellieren
  - Fehlerhafte EPK korrigieren
  - EPK lesen und Fragen beantworten

**Interaktion:** Freier Canvas + Regelvalidierung + Aufgaben

---

### Modul 8: 🔄 BPMN-Editor (NEU im Prüfungskatalog 2025!)
**Bezug:** Neuer Prüfungskatalog 2025
**Prüfungsrelevanz:** ★★★★☆ (neu und daher wahrscheinlich in kommenden Prüfungen)

**Features:**
- BPMN 2.0 Grundelemente:
  - **Events** (Kreise): Start, Ende, Zwischen-Events
  - **Activities/Tasks** (abgerundete Rechtecke)
  - **Gateways** (Rauten): Exklusiv (XOR), Parallel (AND), Inklusiv (OR)
  - **Pools & Lanes** (Swimlanes)
  - **Nachrichtenflüsse** zwischen Pools
- Vergleich EPK vs. BPMN (wichtig für die Prüfung!)
- Übungsaufgaben: Geschäftsprozess modellieren

**Interaktion:** Ähnlich wie EPK-Builder, aber mit BPMN-Notation

---

### Modul 9: 🧮 Kostenrechnung & Wirtschaftlichkeit
**Bezug:** Topic 6.1 Kosten, 6.2 Angebotsvergleich
**Prüfungsrelevanz:** ★★★★☆

**Features:**
- **Angebotsvergleich** (quantitativ): Listpreise, Rabatte, Skonto, Bezugskosten → Bezugspreis berechnen
- **Kostenrechnung:**
  - Fixkosten vs. variable Kosten
  - Gemeinkosten, Gemeinkostenzuschlagssatz
  - Selbstkosten berechnen
  - Gewinnberechnung
- **Amortisationsrechnung:** Break-Even berechnen
- **Stundensatzberechnung** (kam F2025 dran!)
- **Make-or-Buy-Analyse**
- **Leasing vs. Kauf vs. Miete** Vergleich

**Interaktion:** Tabellarische Eingabe mit schrittweiser Berechnung und Prüfung

---

### Modul 10: 🌍 OSI-Modell & Protokolle — Drag & Drop
**Bezug:** Topic 2.6 Netzwerkprotokolle und OSI-Modell
**Prüfungsrelevanz:** ★★★★☆

**Features:**
- 7 Schichten visuell dargestellt
- Drag & Drop: Protokolle den Schichten zuordnen (HTTP, HTTPS, FTP, SMTP, TCP, UDP, IP, ICMP, ARP, Ethernet, etc.)
- Drag & Drop: Hardware den Schichten zuordnen (Hub, Switch, Router, Gateway, Firewall)
- Datenkapselung visualisieren (Daten → Segment → Paket → Frame → Bits)
- TCP vs. UDP Vergleich
- TCP-Handshake animiert
- Quiz-Modus: "Auf welcher Schicht arbeitet ein Switch?"

**Interaktion:** Drag & Drop + Quiz + Animation

---

### Modul 11: 💻 Pseudocode-Trainer
**Bezug:** Topic 8.7 Pseudocode, 8.2 Kontrollstrukturen
**Prüfungsrelevanz:** ★★★★☆ (hat Struktogramm/PAP ersetzt!)

**Features:**
- Pseudocode schreiben zu gegebener Aufgabenbeschreibung
- Kontrollstrukturen üben: IF/ELSE, WHILE, FOR, SWITCH
- Variablen, Datentypen, Arrays
- Funktionen/Prozeduren definieren
- Pseudocode "ausführen" (Trace Table): Werte Schritt für Schritt verfolgen
- Aufgabentypen:
  - "Schreibe einen Algorithmus der..." (freie Eingabe)
  - "Was gibt dieser Pseudocode aus?" (Trace)
  - "Finde den Fehler im Pseudocode"

**Interaktion:** Code-Editor mit Syntax-Highlighting + Schritt-für-Schritt-Ausführung

---

### Modul 12: 📅 Gantt-Diagramm-Editor
**Bezug:** Topic 7.2 Projektplanung, 7.7 Termine
**Prüfungsrelevanz:** ★★★★☆

**Features:**
- Vorgänge mit Start, Dauer, Ende anlegen
- Abhängigkeiten definieren (Ende-Start, Start-Start, etc.)
- Balken automatisch zeichnen
- Meilensteine setzen
- Personalzuordnung (wer macht was?)
- Vergleich Gantt vs. Netzplan: gleiche Daten, andere Darstellung
- Übung: "Vervollständige dieses Gantt-Diagramm" (kam in AP1 dran!)

**Interaktion:** Interaktive Timeline + Balken verschieben + Aufgaben

---

## TIER 3 — Wichtige Module (kommen regelmäßig vor, mittlere Punktzahl)

---

### Modul 13: 🔐 IT-Sicherheits-Szenario-Simulator
**Bezug:** Topic 11 (komplett), besonders 11.1, 11.2, 11.13, 11.19, 11.20
**Prüfungsrelevanz:** ★★★☆☆

**Features:**
- **Schutzbedarfsanalyse durchführen:** Schutzziele (CIA: Verfügbarkeit, Vertraulichkeit, Integrität) einem Szenario zuordnen
- **Verschlüsselung:**
  - Symmetrisch vs. Asymmetrisch — Drag & Drop zuordnen
  - Ablauf einer HTTPS-Verbindung visualisieren (Zertifikat → Key Exchange → verschlüsselte Kommunikation)
  - Hashverfahren: Was passiert wenn sich 1 Bit ändert?
- **Datensicherungsverfahren:** Voll-, Differenziell, Inkrementell — Szenarien durchspielen ("Am Mittwoch fällt die Platte aus — welche Bänder brauchst du?")
- **Authentifizierung:** Wissen, Besitz, Biometrie — Beispiele zuordnen
- **BSI IT-Grundschutz:** Bausteine den richtigen Bereichen zuordnen

**Interaktion:** Szenario-basierte Aufgaben + Zuordnungen + Visualisierungen

---

### Modul 14: 📋 DSGVO & Datenschutz — Fallbeispiel-Quiz
**Bezug:** Topic 11.8–11.12
**Prüfungsrelevanz:** ★★★☆☆ (kam in AP1 F2025 dran!)

**Features:**
- Fallbeispiele: "Ist das ein Verstoß?"
- Personenbezogene Daten identifizieren
- Rechte der Betroffenen zuordnen (Auskunft, Löschung, Berichtigung, Datenportabilität)
- Anonymisierung vs. Pseudonymisierung unterscheiden
- Wann braucht man einen Datenschutzbeauftragten?
- Einwilligung: Wann nötig, wann nicht?
- Auftragsverarbeitung: Wer ist verantwortlich?
- **E-Mail-Szenario** (kam F2025 dran): CC vs. BCC, wann ist Einwilligung nötig?

**Interaktion:** Multiple-Choice + Szenario-Bewertung + Drag & Drop

---

### Modul 15: 🤖 KI-Grundlagen (NEU im Prüfungskatalog 2025!)
**Bezug:** Topic 1.1 Künstliche Intelligenz
**Prüfungsrelevanz:** ★★★☆☆ (kam in AP1 F2025 bereits dran!)

**Features:**
- KI-Anwendungsfelder identifizieren und zuordnen
- Supervised vs. Unsupervised vs. Reinforcement Learning unterscheiden
- Ethische Aspekte: Vorteile und Bedenken bewerten
- Einsatzmöglichkeiten in Geschäftsprozessen erkennen
- Fallbeispiele: "Wo kann KI hier unterstützen?" (wie in AP1 F2025)
- Chancen und Risiken von KI für Mitarbeiter

**Interaktion:** Szenario-basierte Fragen + Zuordnungen

---

### Modul 16: ⚡ Elektrotechnik & Energieberechnung
**Bezug:** Topic 2.8 USV, 2.9 Energie
**Prüfungsrelevanz:** ★★★☆☆

**Features:**
- Grundformeln: P = U × I, Ohmsches Gesetz
- Energieverbrauch berechnen: kWh = P × t
- Stromkosten berechnen
- USV-Dimensionierung: Wie lange hält die USV bei X Watt Last?
- Leistungsaufnahme von Geräten aus Datenblättern ablesen (Belegsätze!)
- Green IT: PUE-Wert berechnen

**Interaktion:** Rechenaufgaben mit Eingabe + Formelsammlung + schrittweise Lösung

---

### Modul 17: 🖥️ Konsolenbefehle-Simulator
**Bezug:** Topic 4.3 Kommandozeile, 4.6 Konsolenbefehle
**Prüfungsrelevanz:** ★★★☆☆

**Features:**
- Mini-Terminal im Browser (simuliert)
- **Linux-Befehle:** ls, cd, mkdir, rm, cp, mv, chmod, cat, grep, alias, ip, ifconfig
- **Windows-Befehle:** dir, cd, mkdir, del, copy, ipconfig, arp
- **Netzwerk-Befehle:** ping, traceroute, nslookup, arp, netstat
- Aufgaben: "Erstelle einen Ordner, setze Berechtigungen auf 755, kopiere Datei X hinein"
- chmod-Rechner: Oktal ↔ rwx umrechnen

**Interaktion:** Echtes Terminal-Feeling mit Validierung der Befehle

---

## TIER 4 — Ergänzende Module (runden die Vorbereitung ab)

---

### Modul 18: 📑 Lastenheft/Pflichtenheft-Trainer
**Bezug:** Topic 7.9 Lasten- und Pflichtenheft
**Prüfungsrelevanz:** ★★☆☆☆

**Features:**
- Interaktive Vorlage: Felder ausfüllen und lernen was wohin gehört
- Drag & Drop: "Ist das ein Lastenheft- oder Pflichtenheft-Inhalt?"
- Wer erstellt was? (Auftraggeber vs. Auftragnehmer)
- SMART-Ziele aus Anforderungen ableiten (Verbindung zu Topic 7.3)
- Beispiel-Szenarien durchspielen

**Interaktion:** Zuordnung + Lückentext + Szenario

---

### Modul 19: 🏢 Organigramm & Aufbauorganisation
**Bezug:** Topic 6.13 Aufbauorganisation, 6.14 Vollmachten
**Prüfungsrelevanz:** ★★☆☆☆

**Features:**
- Organisationsformen visuell darstellen und unterscheiden:
  - Linienorganisation
  - Stab-Linienorganisation
  - Matrixorganisation
  - Projektorganisation
- Organigramm-Builder: Positionen erstellen und verbinden
- Vollmachten zuordnen: Prokura, Handlungsvollmacht, etc.
- Vor-/Nachteile der Organisationsformen vergleichen
- Aufgabe: "Welche Organisationsform zeigt dieses Organigramm?"

**Interaktion:** Drag & Drop Builder + Quiz

---

### Modul 20: 📜 Vertragsrecht-Szenario-Quiz
**Bezug:** Topic 6.9–6.11 (Verträge, Vertragsbestandteile, Vertragsstörungen)
**Prüfungsrelevanz:** ★★☆☆☆

**Features:**
- Vertragsarten unterscheiden: Kaufvertrag, Werkvertrag, Dienstvertrag, Mietvertrag, Leasing
- Vertragsstörungen erkennen: Lieferverzug, Zahlungsverzug, Schlechtleistung, Mangelarten
- Fallbeispiele: "Was liegt hier vor und welche Rechte hat der Käufer?"
- SLA (Service Level Agreement) verstehen und erstellen
- Gewährleistung vs. Garantie

**Interaktion:** Szenario-basierte Multiple-Choice + Zuordnung

---

## Empfohlene Implementierungsreihenfolge

### Phase 1 — Sofort starten (größter Impact für März-Prüfung)
1. **Subnetting-Rechner** (Modul 1)
2. **Netzplantechnik-Board** (Modul 2)
3. **Nutzwertanalyse-Tool** (Modul 3)
4. **Zahlensysteme-Trainer** (Modul 4)

### Phase 2 — Wichtige Diagramm-Module
5. **UML-Werkstatt** (Modul 5)
6. **ER-Diagramm-Builder** (Modul 6)
7. **EPK-Builder** (Modul 7)
8. **BPMN-Editor** (Modul 8)

### Phase 3 — Wirtschaft & Berechnung
9. **Kostenrechnung** (Modul 9)
10. **Gantt-Editor** (Modul 12)
11. **Elektrotechnik** (Modul 16)

### Phase 4 — Wissensmodule
12. **OSI-Modell Drag & Drop** (Modul 10)
13. **Pseudocode-Trainer** (Modul 11)
14. **IT-Sicherheit** (Modul 13)
15. **DSGVO-Quiz** (Modul 14)
16. **KI-Grundlagen** (Modul 15)

### Phase 5 — Abrundung
17. **Konsolenbefehle** (Modul 17)
18. **Lastenheft/Pflichtenheft** (Modul 18)
19. **Organigramm** (Modul 19)
20. **Vertragsrecht** (Modul 20)

---

## Architektur-Empfehlung für deine App

Jedes Modul sollte als eigenständige View in deinem bestehenden Router-System funktionieren:

```
js/views/modules/
  ├── subnetting.js        (Modul 1)
  ├── networkplan.js        (Modul 2)
  ├── nwa.js               (Modul 3)
  ├── numbersystems.js     (Modul 4)
  ├── uml.js               (Modul 5)
  ├── erd.js               (Modul 6)
  ├── epk.js               (Modul 7)
  ├── bpmn.js              (Modul 8)
  ├── costcalc.js          (Modul 9)
  ├── osimodel.js          (Modul 10)
  ├── pseudocode.js        (Modul 11)
  ├── gantt.js             (Modul 12)
  ├── itsecurity.js        (Modul 13)
  ├── dsgvo.js             (Modul 14)
  ├── aibasics.js          (Modul 15)
  ├── electrical.js        (Modul 16)
  ├── terminal.js          (Modul 17)
  ├── requirements.js      (Modul 18)
  ├── orgchart.js          (Modul 19)
  └── contracts.js         (Modul 20)
```

Die Module-Übersichtsseite könnte als Grid/Kachel-Layout gestaltet werden, mit Tier-Markierung und Fortschritts-Tracking pro Modul.

---

## Was NICHT als Modul nötig ist (da aus AP1 gestrichen)

- ~~SQL-Sandbox~~ (ab 2025 nur noch in AP2!)
- ~~RAID-Simulator~~ (ab 2025 nur noch in AP2!)
- ~~Struktogramm-Editor~~ (gestrichen, ersetzt durch Pseudocode)
- ~~PAP-Editor~~ (gestrichen)
- ~~NoSQL-Übungen~~ (gestrichen)

**Achtung:** Wenn deine App auch für AP2 vorbereiten soll, wären SQL und RAID als separate AP2-Module sinnvoll!
