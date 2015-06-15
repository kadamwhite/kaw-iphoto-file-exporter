var fs = require( 'fs' );
var _ = require( 'lodash' );

var photoData = require( './album-data' );

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

/*
EVENTS ("rolls")
========================================================
    RollID:                   1577 (integer)
    ProjectUuid:              6D1B500A-314F-4513-ACC5-817F95F68AA3 (string)
    RollName:                 Kington 1 (string)
    RollDateAsTimerInterval:  236210156.000000 (real)
    KeyPhotoKey:              1578 (string)
    PhotoCount:               38 (integer)
    KeyList:                  ["1615"...] (array)
*/
var events = photoData['List of Rolls'];

/*
PHOTOS
========================================================
    Caption:                    IMG_6172 (string)
    Comment:                     (string)
    GUID:                       1B461F08-FA70-4D35-9201-072C1516D340 (string)
    Roll:                       1577 (integer)
    Rating:                     0 (integer)
    ImagePath:                  /Volumes/f8/iPhoto Library.photolibrary/Masters/2008/Kington 1/IMG_6172.JPG (string)
    MediaType:                  Image (string)
    ModDateAsTimerInterval:     236206556.000000 (real)
    DateAsTimerInterval:        236210156.000000 (real)
    DateAsTimerIntervalGMT:     236195756.000000 (real)
    MetaModDateAsTimerInterval: 316067320.366547 (real)
    ThumbPath:                  /Volumes/f8/iPhoto Library.photolibrary/Thumbnails/2008/Kington 1/IMG_6172.jpg (string)
*/
var photos = photoData['Master Image List'];

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

  memo[ year ][ month ].push( event );

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
  return;
  if ( ! fs.existsSync( path ) ) {
    fs.mkdirSync( path )
  }
}

mkdirIfNotExists( './iPhoto' );

_.forEach(eventsDict, function( yearObj, year ) {
  // Ensure directory for this year
  mkdirIfNotExists( [ './iPhoto', year ].join('/') );

  _.forEach(yearObj, function( monthArr, month ) {
    // Ensure directory for this month
    mkdirIfNotExists( [ './iPhoto', year, month ].join('/') );

    // For later use
    var eventsInMonth = monthArr.length;

    monthArr.forEach(function( event, idx ) {
      // Ensure directory for this event
      var fileName = getPrefix( idx, eventsInMonth ) + cleanFileName( event.RollName );
      console.log( [ year, month, fileName ].join('/') );

      // Give photos a place to live
      mkdirIfNotExists( [ './iPhoto', year, month, fileName ].join( '/' ) );

      // Build an array of this roll's photos
      var eventPhotos = _.map( event.KeyList, function( photoId ) {
        return photos[ photoId ];
      });

      require( 'assert' )( eventPhotos.length === event.PhotoCount );

      eventPhotos.forEach(function( photo ) {
        var exists = fs.existsSync( photo.ImagePath );
        if ( ! exists ) {
          console.error( 'Missing: ' + photo.ImagePath );
        }
      });
    });
  });
});
