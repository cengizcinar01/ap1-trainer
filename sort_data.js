const fs = require('fs');

// Read the JSON file
const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

// Function to extract numeric values for sorting
function getSubtopicNumber(subtopic) {
    const match = subtopic.match(/^(\d+)\.(\d+)/);
    if (match) {
        return { main: parseInt(match[1]), sub: parseInt(match[2]) };
    }
    return { main: 0, sub: 0 };
}

function getTopicNumber(topic) {
    const match = topic.match(/^(\d+)\./);
    if (match) {
        return parseInt(match[1]);
    }
    return 0;
}

// Sort the data
data.sort((a, b) => {
    const topicA = getTopicNumber(a.topic);
    const topicB = getTopicNumber(b.topic);

    if (topicA !== topicB) {
        return topicA - topicB;
    }

    const subtopicA = getSubtopicNumber(a.subtopic);
    const subtopicB = getSubtopicNumber(b.subtopic);

    if (subtopicA.main !== subtopicB.main) {
        return subtopicA.main - subtopicB.main;
    }

    if (subtopicA.sub !== subtopicB.sub) {
        return subtopicA.sub - subtopicB.sub;
    }

    return a.id - b.id;
});

// Write the sorted data back
fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));

console.log('✅ data.json sorted!');
console.log('Total cards:', data.length);

console.log('\nTopic 6 subtopics in order:');
const topic6 = data.filter(c => c.topic.startsWith('6.')).map(c => c.subtopic);
[...new Set(topic6)].forEach(s => console.log(' ', s));
