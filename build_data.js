const fs = require('node:fs');
const path = require('node:path');

const topicsDir = './data/topics';
const indexOutputPath = './data/index.json';

function getSubtopicNumber(subtopic) {
  const match = subtopic.match(/^(\d+)\.(\d+)/);
  if (match) {
    return { main: parseInt(match[1], 10), sub: parseInt(match[2], 10) };
  }
  return { main: 0, sub: 0 };
}

function getTopicNumber(topic) {
  const match = topic.match(/^(\d+)\./);
  return match ? parseInt(match[1], 10) : 0;
}

// 1. Dateien einlesen
const files = fs
  .readdirSync(topicsDir)
  .filter((f) => f.endsWith('.json'))
  .sort();
const allCards = [];

files.forEach((file) => {
  const filePath = path.join(topicsDir, file);
  const cards = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  cards.forEach((card) => {
    card._sourceFile = file;
    allCards.push(card);
  });
});

// 2. Sortieren (global)
allCards.sort((a, b) => {
  const topicA = getTopicNumber(a.topic);
  const topicB = getTopicNumber(b.topic);
  if (topicA !== topicB) return topicA - topicB;

  const subA = getSubtopicNumber(a.subtopic);
  const subB = getSubtopicNumber(b.subtopic);
  if (subA.main !== subB.main) return subA.main - subB.main;
  if (subA.sub !== subB.sub) return subA.sub - subB.sub;

  return 0;
});

// 3. IDs global synchronisieren
allCards.forEach((card, index) => {
  card.id = index + 1;
});

// 4. Zurückschreiben in die einzelnen Themen-Dateien
const separatedData = {};
allCards.forEach((card) => {
  const source = card._sourceFile;
  if (!separatedData[source]) separatedData[source] = [];
  const cleanCard = { ...card };
  delete cleanCard._sourceFile;
  separatedData[source].push(cleanCard);
});

Object.entries(separatedData).forEach(([file, cards]) => {
  fs.writeFileSync(path.join(topicsDir, file), JSON.stringify(cards, null, 2));
});

// 5. Nur noch den Index (Liste der Dateien) speichern
fs.writeFileSync(indexOutputPath, JSON.stringify(files, null, 2));

console.log(`✅ IDs synchronized and Index created!`);
console.log(`- Topics Index: ${indexOutputPath}`);
console.log(`- Total Cards processed: ${allCards.length}`);
