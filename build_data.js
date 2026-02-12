const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.join(__dirname, 'index.html');

/**
 * Appends a timestamp to all CSS and JS links in index.html to force browser reload.
 * This prevents caching issues on platforms like GitHub Pages.
 */
function updateIndexCacheBusting() {
  try {
    let content = fs.readFileSync(indexPath, 'utf8');
    const version = Date.now();

    // Update CSS links (root and modules)
    content = content.replace(
      /(href="(?:css|modules)\/[^"]+\.css)(\?v=\d+)?/g,
      `$1?v=${version}`
    );

    // Update JS scripts
    content = content.replace(
      /(src="js\/[^"]+\.js)(\?v=\d+)?/g,
      `$1?v=${version}`
    );

    fs.writeFileSync(indexPath, content);
    console.log(
      `Successfully updated index.html with cache-buster v${version}`
    );
  } catch (error) {
    console.error('Failed to update index.html:', error);
  }
}

// Run build tasks
updateIndexCacheBusting();
