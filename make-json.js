var fs = require( 'fs' );
var path = require( 'path' );
var plist = require( 'plist' );

var photoData = plist.parse( fs.readFileSync( path.join( __dirname, 'AlbumData.xml' ), 'utf8' ) );

fs.writeFileSync( './album-data.json', JSON.stringify( photoData ) );
