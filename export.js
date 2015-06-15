var fs = require( 'fs' );
var xml2js = require( 'xml2js' );

var parser = new xml2js.Parser();

function processFile( err, data ) {
  function printParsedString( err, result ) {
    console.dir( result.plist.dict[0].array );
    console.log( 'Done' );
  }
  parser.parseString( data, printParsedString );
}

fs.readFile( __dirname + '/AlbumData.xml', processFile );
