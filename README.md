# iPhoto export script

I wrote this for my own purposes. I put it online because it helped me migrate from iPhoto to Lightroom, and I thought it may be of use to others; use at your own risk.

Usage:

1. BACK UP YOUR LIBRARY! Never run some random internet person's Node code on the only copy of your personal photo library :) <sup>+</sup>
2. Use Finder to "Show Package Contents" from your iPhoto library
3. Copy `AlbumData.xml` from the iPhoto package
4. Paste `AlbumData.xml` into the folder where you cloned this repository
5. `npm install` this repository
6. Run `node ./make-json` to convert the AlbumData file into `album-data.json`
7. Edit the `export.js` file and replace ROOT_DIR with the path to which you want to export your photos
8. Run `DRY_RUN=true npm start` to write the directory structure and test out the script
8. Run `npm start` to kick off the file export!

To be extra-careful, I recommend commenting out the actual file copy command and replacing it with debugging output while you make sure you understand what this program is doing.

------------------------

<sup>+</sup> Backup tips: I recommend keeping your photos backed up on an unpluggable local hard disk, as well as on either a cloud storage platform or a separate hard disk that is kept at an off-site location. Photographs can be important!
