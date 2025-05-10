const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function getBoundingBox(svgElement) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasVisibleElements = false;

    // Consider path, rect, circle, ellipse, line, polyline, polygon, text, image
    const elements = svgElement.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text, image');

    elements.forEach(el => {
        if (el.style.display === 'none' || el.getAttribute('visibility') === 'hidden') {
            return;
        }

        let bbox;
        let usePathFallback = false;

        if (typeof el.getBBox === 'function') {
            try {
                const originalBBox = el.getBBox();
                // Check if getBBox returned valid, finite numbers
                if (isFinite(originalBBox.x) && isFinite(originalBBox.y) && isFinite(originalBBox.width) && isFinite(originalBBox.height)) {
                    if (originalBBox.width === 0 && originalBBox.height === 0) {
                        if (el.tagName.toLowerCase() === 'path') {
                            usePathFallback = true;
                        } else {
                            return; // Skip other elements with no dimensions
                        }
                    } else {
                        bbox = originalBBox;
                    }
                } else { // getBBox returned non-finite numbers
                    if (el.tagName.toLowerCase() === 'path') {
                        usePathFallback = true;
                    } else {
                        return; 
                    }
                }
            } catch (e) {
                if (el.tagName.toLowerCase() === 'path') {
                    usePathFallback = true;
                } else {
                    return; // Skip other elements if getBBox fails
                }
            }
        } else {
            // Fallback for elements that don't have getBBox (e.g., <image> in some JSDOM setups)
            const x = parseFloat(el.getAttribute('x') || '0');
            const y = parseFloat(el.getAttribute('y') || '0');
            const widthAttr = parseFloat(el.getAttribute('width') || '0');
            const heightAttr = parseFloat(el.getAttribute('height') || '0');
            if (widthAttr === 0 && heightAttr === 0 && (el.tagName.toLowerCase() !== 'path')) return; // Allow paths to try fallback
            if (el.tagName.toLowerCase() === 'path' && (widthAttr === 0 && heightAttr === 0)) {
                 usePathFallback = true; // Path might not have x,y,width,height but has 'd'
            } else if (widthAttr > 0 && heightAttr > 0) {
                bbox = { x, y, width: widthAttr, height: heightAttr };
            } else {
                return;
            }
        }

        if (usePathFallback && el.tagName.toLowerCase() === 'path') {
            const d = el.getAttribute('d');
            if (d) {
                const points = [];
                // Crude extraction of numbers from 'd' attribute.
                const numbers = d.match(/-?\d*\.?\d+/g); // Improved regex for numbers
                if (numbers) {
                    for (let i = 0; i < numbers.length - 1; i += 2) { // Ensure pairs
                        const pX = parseFloat(numbers[i]);
                        const pY = parseFloat(numbers[i+1]);
                        if (isFinite(pX) && isFinite(pY)) {
                           points.push({ x: pX, y: pY });
                        }
                    }
                }

                if (points.length > 0) {
                    let pathMinX = Infinity, pathMinY = Infinity, pathMaxX = -Infinity, pathMaxY = -Infinity;
                    points.forEach(p => {
                        pathMinX = Math.min(pathMinX, p.x);
                        pathMinY = Math.min(pathMinY, p.y);
                        pathMaxX = Math.max(pathMaxX, p.x);
                        pathMaxY = Math.max(pathMaxY, p.y);
                    });

                    if (isFinite(pathMinX) && isFinite(pathMinY) && isFinite(pathMaxX) && isFinite(pathMaxY) &&
                        pathMaxX > pathMinX && pathMaxY > pathMinY) {
                        bbox = { x: pathMinX, y: pathMinY, width: pathMaxX - pathMinX, height: pathMaxY - pathMinY };
                    } else {
                        return; // Skip if fallback also results in no/invalid dimensions
                    }
                } else {
                    return; // Skip if no points found
                }
            } else {
                return; // Skip if path has no 'd' attribute
            }
        }


        if (bbox) {
            if (bbox.width <= 0 || bbox.height <= 0 || !isFinite(bbox.x) || !isFinite(bbox.y) || !isFinite(bbox.width) || !isFinite(bbox.height)) {
                return; // Skip element if bbox has non-positive or non-finite dimensions
            }

            const elMinX = bbox.x;
            const elMinY = bbox.y;
            const elMaxX = bbox.x + bbox.width;
            const elMaxY = bbox.y + bbox.height;

            minX = Math.min(minX, elMinX);
            minY = Math.min(minY, elMinY);
            maxX = Math.max(maxX, elMaxX);
            maxY = Math.max(maxY, elMaxY);
            hasVisibleElements = true;
        }
    });

    if (!hasVisibleElements || !isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        return null; // No visible content or invalid bounds
    }
    
    const finalWidth = maxX - minX;
    const finalHeight = maxY - minY;

    if (finalWidth <= 0 || finalHeight <= 0) {
        return null; // Calculated overall bounding box has no dimensions
    }

    return { x: minX, y: minY, width: finalWidth, height: finalHeight };
}

function cropSvg(filePath) {
    const svgString = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(svgString, { contentType: 'image/svg+xml' });
    const svgElement = dom.window.document.querySelector('svg');

    if (!svgElement) {
        console.error(`No SVG element found in ${filePath}`);
        return;
    }

    const bbox = getBoundingBox(svgElement);

    if (!bbox || bbox.width === 0 || bbox.height === 0) {
        console.warn(`No visible content found or content has no dimensions in ${filePath}. Skipping crop.`);
        return;
    }

    // Add a small padding if desired
    const padding = 0; // Or some small value like 5 or 10
    const viewBoxX = bbox.x - padding;
    const viewBoxY = bbox.y - padding;
    const viewBoxWidth = bbox.width + (2 * padding);
    const viewBoxHeight = bbox.height + (2 * padding);

    svgElement.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
    // It's often good practice to also set width and height to the new viewBox dimensions
    // if you want the SVG to scale to fit its new content box by default.
    svgElement.setAttribute('width', viewBoxWidth.toString());
    svgElement.setAttribute('height', viewBoxHeight.toString());

    const croppedSvgString = svgElement.outerHTML;
    fs.writeFileSync(filePath, croppedSvgString, 'utf-8');
    console.log(`Cropped ${filePath} to content. New viewBox: ${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
}

const targetPath = process.argv[2];

if (!targetPath) {
    console.error('Please provide a file path or directory path for an SVG file.');
    process.exit(1);
}

if (fs.statSync(targetPath).isDirectory()) {
    fs.readdirSync(targetPath).forEach(file => {
        if (path.extname(file).toLowerCase() === '.svg') {
            cropSvg(path.join(targetPath, file));
        }
    });
} else if (path.extname(targetPath).toLowerCase() === '.svg') {
    cropSvg(targetPath);
} else {
    console.error('The provided path is not an SVG file or a directory containing SVG files.');
    process.exit(1);
}
