var fs = require( 'fs' );
var path = require( 'path' );
var plist = require( 'plist' );

var _ = require( 'lodash' );

var APPLE_BASE_TIME = 978307200000; // 1-1-2001 (in ms)

function appleTimeToDT( appleTime ) {
  return new Date( appleTime * 1000 + APPLE_BASE_TIME );
}

function getMonth( appleTime ) {
  return appleTimeToDT( appleTime ).getMonth() + 1;
}

function getYear( appleTime ) {
  return appleTimeToDT( appleTime ).getFullYear();
}

function pad( num, digits ) {
  var numStr = '' + num;
  if ( numStr.length >= digits ) {
    return numStr;
  }
  while ( numStr.length < digits ) {
    numStr = '0' + numStr;
  }
  return numStr;
}

function cleanFileName( str ) {
  // Replace problematic special characters
  return str.replace(/[^A-Za-z0-9()_,"'& -]/g, '-');
}

var photoData = plist.parse( fs.readFileSync( path.join( __dirname, 'AlbumData.xml' ), 'utf8' ) );

var events = photoData['List of Rolls'];

// events.forEach(function( event ) {
//   var name = event.RollName;
//   var time = event.RollDateAsTimerInterval;
//   var year = getYear( time );
//   var month = pad( getMonth( time ), 2);
//   // console.log([year, month, name].join('/'));
// });

var eventsDict = events.reduce(function( memo, event ) {
  var name = event.RollName;
  var time = event.RollDateAsTimerInterval;
  var year = getYear( time );
  var month = pad( getMonth( time ), 2);

  // Ensure existance of memo.year.month[]
  memo[ year ] = memo[ year ] || {};
  memo[ year ][ month ] = memo[ year ][ month ] || [];

  memo[ year ][ month ].push({
    name: name,
    event: event
  });

  return memo;
}, {});

function getPrefix( index, eventsInMonth ) {
  if ( eventsInMonth === 1 ) {
    return '';
  }
  var lengthOfMaxEventStr = ('' + eventsInMonth).length;
  return pad( index, lengthOfMaxEventStr ) + ' - ';
}


function mkdirIfNotExists( path ) {
  if ( ! fs.existsSync( path ) ) {
    fs.mkdirSync( path )
  }
}

mkdirIfNotExists( './iPhoto' );

_.forEach(eventsDict, function( yearObj, year ) {
  mkdirIfNotExists( [ './iPhoto', year ].join('/') );
  _.forEach(yearObj, function( monthArr, month ) {
    mkdirIfNotExists( [ './iPhoto', year, month ].join('/') );
    var eventsInMonth = monthArr.length;
    // console.log( month, eventsInMonth, getPrefix( ))
    monthArr.forEach(function( event, idx ) {
      var fileName = getPrefix( idx, eventsInMonth ) + cleanFileName( event.name );
      // console.log( [ year, month, fileName ].join('/') );
      mkdirIfNotExists( [ './iPhoto', year, month, fileName ].join('/') );
    });
  });
});
