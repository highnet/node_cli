const fs = require('fs');
const { JSDOM } = require('jsdom');

// Get command line arguments
const inputFile = process.argv[2];
const fillColorToRemove = process.argv[3];

if (!inputFile || !fillColorToRemove) {
  console.error('Usage: node remove-svg-paths.js <inputFile.svg> <fillColor>');
  process.exit(1);
}

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    process.exit(1);
  }

  const dom = new JSDOM(data, { contentType: 'image/svg+xml' });
  const document = dom.window.document;
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    console.error('No SVG element found in the input file.');
    process.exit(1);
  }

  const paths = svgElement.querySelectorAll('path');
  let removedCount = 0;

  paths.forEach(path => {
    const fill = path.getAttribute('fill');
    if (fill && fill.toLowerCase() === fillColorToRemove.toLowerCase()) {
      path.remove();
      removedCount++;
    }
  });

  console.log(`Removed ${removedCount} paths with fill color "${fillColorToRemove}".`);

  const outputSVG = svgElement.outerHTML;
  const outputFile = 'output.svg';

  fs.writeFile(outputFile, outputSVG, 'utf8', err => {
    if (err) {
      console.error('Error writing output SVG file:', err);
      process.exit(1);
    }
    console.log(`Modified SVG saved to ${outputFile}`);
  });
});
