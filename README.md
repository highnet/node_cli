# Node.js CLI Scripts

A collection of Node.js scripts for various command-line operations, such as file manipulation and SVG editing.

## Scripts

### Remove SVG Paths by Fill Color

The `remove-svg-paths.js` script removes all `<path>` elements from an SVG file that have a specific fill color.

**Prerequisites:**

*   Node.js installed
*   npm (Node Package Manager) installed

**Setup:**

1.  Clone or download this project.
2.  Navigate to the project directory in your terminal:
    ```bash
    cd path/to/node_cli
    ```
3.  Install the necessary dependencies:
    ```bash
    npm install
    ```
    This will install `jsdom` which is used by the script to parse and manipulate SVG files.

**Usage:**

To use the script, run it with Node.js, providing the input SVG file path and the fill color to target (hex codes should be quoted, especially in PowerShell):

```powershell
node remove-svg-paths.js <inputFile.svg> '<fillColor>'
```

**Example:**

If you have an SVG file named `input.svg` in the project root and you want to remove all paths with the fill color `#ABCDEF`:

```powershell
node remove-svg-paths.js input.svg '#ABCDEF'
```

Or to remove paths with the color "blue":

```powershell
node remove-svg-paths.js input.svg 'blue'
```

The script will:
1.  Read the specified input SVG file.
2.  Remove all `<path>` elements that have a `fill` attribute matching the provided color (case-insensitive).
3.  Save the modified SVG content to a new file named `output.svg` in the project root.
4.  Print a message indicating how many paths were removed and where the output file is saved.

**Note:** The original input SVG file will not be modified.

### Crop SVG to Content

The `crop-svg.js` script (located in the `scripts` directory) adjusts the `viewBox` of an SVG file to fit its visible content. This effectively crops the SVG to the bounding box of its elements. The script can process a single SVG file or all SVG files within a specified directory.

**Prerequisites:**

*   Node.js installed
*   npm (Node Package Manager) installed

**Setup:**

(Covered in the general setup instructions above - ensure `npm install` has been run.)

**Usage:**

To use the script, run it with Node.js, providing the path to an SVG file or a directory containing SVG files:

```powershell
node scripts/crop-svg.js <fileOrDirectoryPath>
```

**Examples:**

If you have an SVG file named `image-to-crop.svg` in the project root:

```powershell
node scripts/crop-svg.js image-to-crop.svg
```

If you have a directory named `svg_icons` containing multiple SVG files you want to crop:

```powershell
node scripts/crop-svg.js ./svg_icons
```

The script will:
1.  Read the specified input SVG file(s).
2.  Calculate the bounding box of all visible elements within each SVG.
3.  Update the `viewBox` attribute of the SVG to match this bounding box, effectively cropping it.
4.  The script also sets the `width` and `height` attributes of the SVG to the new `viewBox` dimensions.
5.  Save the modified SVG content back to the **original file**.
6.  Print a message indicating the new `viewBox` and that the file has been cropped, or a warning if no visible content was found.

**Important Note:** This script **modifies the original SVG file(s)** in place. Make sure you have backups if you need to preserve the original uncropped versions.

## Contributing

Feel free to contribute to this project by submitting issues or pull requests.
