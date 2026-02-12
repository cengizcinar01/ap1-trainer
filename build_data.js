const fs = require('node:fs');
const path = require('node:path');

const grundlagenPath = path.join(__dirname, 'data/topics/01_1_grundlagen.json');
const hardwarePath = path.join(__dirname, 'data/topics/02_2_hardware.json');

function addQuizData() {
  try {
    // 1. Grundlagen
    const grundlagenData = JSON.parse(fs.readFileSync(grundlagenPath, 'utf8'));

    // Update ID 1 (KI)
    const card1 = grundlagenData.find((c) => c.id === 1);
    if (card1) {
      card1.quiz = {
        type: 'multiple-choice',
        options: [
          'Ein Algorithmus, der ausschließlich mathematische Berechnungen schneller als Menschen durchführt.',
          'Ein Teilgebiet der Informatik, das sich mit der Automatisierung intelligenten Verhaltens befasst.',
          'Eine Hardwarekomponente, die das menschliche Gehirn physisch nachbildet.',
          'Ein Betriebssystem für Supercomputer.',
          'Ein Netzwerkprotokoll zur schnellen Datenübertragung.',
          'Eine Programmiersprache für Roboter.',
        ],
        correctIndices: [1],
      };
    }

    // Update ID 3 (Supervised/Unsupervised)
    const card3 = grundlagenData.find((c) => c.id === 3);
    if (card3) {
      card3.question =
        'Welche Aussagen zu Supervised und Unsupervised Learning sind korrekt?';

      card3.quiz = {
        type: 'multiple-choice',
        options: [
          'Beim Supervised Learning sind die Trainingsdaten bereits gelabelt/klassifiziert.',
          'Unsupervised Learning erfordert zwingend menschliches Eingreifen während des Trainings.',
          'Beim Unsupervised Learning sucht der Algorithmus selbstständig nach Mustern (z.B. Clustering).',
          'Supervised Learning wird hauptsächlich für Clustering verwendet.',
          'Unsupervised Learning liefert immer präzisere Ergebnisse als Supervised Learning.',
          'Reinforcement Learning ist ein Synonym für Unsupervised Learning.',
        ],
        correctIndices: [0, 2],
      };
    }

    // Update ID 7 (Schwache vs Starke KI)
    const card7 = grundlagenData.find((c) => c.id === 7);
    if (card7) {
      card7.quiz = {
        type: 'multiple-choice',
        options: [
          'Schwache KI besitzt ein eigenes Bewusstsein.',
          'Starke KI kann Probleme lösen, für die sie nicht explizit programmiert wurde (Allgemeine Intelligenz).',
          'Schwache KI ist auf spezifische Anwendungsgebiete beschränkt (z.B. Schachcomputer).',
          'Starke KI existiert bereits in den meisten modernen Smartphones.',
          'Schwache KI benötigt keine Trainingsdaten.',
          'Starke KI ist immer langsamer als schwache KI.',
        ],
        correctIndices: [1, 2],
      };
    }

    fs.writeFileSync(grundlagenPath, JSON.stringify(grundlagenData, null, 2));
    console.log('Updated 01_1_grundlagen.json');

    // 2. Hardware
    const hardwareData = JSON.parse(fs.readFileSync(hardwarePath, 'utf8'));

    // Update ID 18 (CPU)
    const card18 = hardwareData.find((c) => c.id === 18);
    if (card18) {
      card18.quiz = {
        type: 'multiple-choice',
        options: [
          'Dauerhafte Speicherung von Daten auch ohne Stromzufuhr.',
          'Ausführung von Befehlen und Steuerung der Datenverarbeitung.',
          'Bereitstellung der grafischen Benutzeroberfläche.',
          'Verwaltung der Netzwerkverbindungen.',
          'Kühlung des Systems.',
          'Umwandlung von Wechselstrom in Gleichstrom.',
        ],
        correctIndices: [1],
      };
    }

    // Update ID 22 (CISC/RISC)
    const card22 = hardwareData.find((c) => c.id === 22);
    if (card22) {
      card22.quiz = {
        type: 'multiple-choice',
        options: [
          "CISC steht für 'Complex Instruction Set Computing' und nutzt viele komplexe Befehle.",
          'RISC-Prozessoren benötigen mehr Taktzyklen pro Befehl als CISC.',
          "RISC steht für 'Reduced Instruction Set Computing' und nutzt einen reduzierten, einfachen Befehlssatz.",
          'CISC ist energieeffizienter als RISC.',
          'RISC wird ausschließlich in Großrechnern eingesetzt.',
          'CISC-Befehle werden immer in einem einzigen Taktzyklus ausgeführt.',
        ],
        correctIndices: [0, 2],
      };
    }

    // Update ID 21 (Von-Neumann)
    const card21 = hardwareData.find((c) => c.id === 21);
    if (card21) {
      card21.quiz = {
        type: 'multiple-choice',
        options: [
          'Trennung von Programm- und Datenspeicher (physisch getrennt).',
          'Gemeinsamer Speicher für Programme und Daten.',
          'Verwendung von vier separaten Bussen für maximale Geschwindigkeit.',
          'Sequentielle Abarbeitung von Befehlen (Von-Neumann-Flaschenhals).',
          'Keine Verwendung eines Steuerwerks.',
          'Direkte Verbindung aller Komponenten ohne Bussystem.',
        ],
        correctIndices: [1, 3],
      };
    }

    fs.writeFileSync(hardwarePath, JSON.stringify(hardwareData, null, 2));
    console.log('Updated 02_2_hardware.json');
  } catch (error) {
    console.error('Error updating data:', error);
  }
}

addQuizData();
