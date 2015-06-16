var fs = require( 'fs' );
var path = require( 'path' );
var _ = require( 'lodash' );
var Promise = require( 'bluebird' );

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

var newDirectories = 0;
var existingDirectories = 0;
function mkdirIfNotExists( path ) {
  if ( ! fs.existsSync( path ) ) {
    newDirectories++;
    fs.mkdirSync( path )
  } else {
    existingDirectories++;
  }
}

var incomingRegExp = /\/Volumes\/Oldtown\/Pictures\/Incoming from Laptop/i;
var newIncomingPath = '/Volumes/f8/_Unfiled/Incoming from Laptop/';

function updateIncomingPaths( photo ) {
  if ( incomingRegExp.test( photo.ImagePath ) ) {
    photo.ImagePath = photo.ImagePath.replace( incomingRegExp, newIncomingPath );
    if ( photo.OriginalPath ) {
      photo.OriginalPath = photo.OriginalPath.replace( incomingRegExp, newIncomingPath );
    }
    photo.ThumbPath = photo.ThumbPath.replace( incomingRegExp, newIncomingPath );
  }
}

// var fileStats = [];

var filesToCopy = [];

var ROOT_DIR = '/Volumes/f8/iPhoto/';

mkdirIfNotExists( ROOT_DIR );

_.forEach(eventsDict, function( yearObj, year ) {
  // Ensure directory for this year
  mkdirIfNotExists( [ ROOT_DIR, year ].join('/') );

  _.forEach(yearObj, function( monthArr, month ) {
    // Ensure directory for this month
    mkdirIfNotExists( [ ROOT_DIR, year, month ].join('/') );

    // For later use
    var eventsInMonth = monthArr.length;

    monthArr.forEach(function( event, idx ) {
      // Ensure directory for this event
      var dirName = getPrefix( idx, eventsInMonth ) + cleanFileName( event.RollName );

      // Give photos a place to live
      var dirPath = [ ROOT_DIR, year, month, dirName ].join( '/' );
      mkdirIfNotExists( dirPath );

      // Build an array of this roll's photos
      var eventPhotos = _.map( event.KeyList, function( photoId ) {
        return photos[ photoId ];
      });

      require( 'assert' )( eventPhotos.length === event.PhotoCount );

      var missingPhotos = eventPhotos.filter(function( photo ) {
        // Adjust for known path mapping issues
        updateIncomingPaths( photo );

        var fileExists = fs.existsSync( photo.ImagePath );
        if ( ! fileExists ) {
          fileExists = fs.existsSync( photo.OriginalPath );
          if ( fileExists ) {
            // console.log( 'Original found! ' + photo.OriginalPath );
            // Re-point at original
            photo.ImagePath = photo.OriginalPath;
          }
        }
        return ! fileExists;
      });

      if ( missingPhotos.length ) {
        console.log( '\n' + [ year, month, fileName ].join('/') );
        console.log(missingPhotos.map(function( photo ) {
          return 'Missing: ' + photo.ImagePath;
        }).join('\n'));
      }

      // Add this event's photos to the files to copy
      filesToCopy = filesToCopy.concat( eventPhotos.map(function( photo ) {
        return {
          fromPath: photo.ImagePath,
          toPath: path.join( dirPath, photo.ImagePath.split('/').pop() ),
          photo: photo
        };
      }));
    });
  });
});

console.log([
  'Found',
  _.keys( photos ).length,
  'total photos, in',
  events.length,
  'events\n'
].join( ' ' ) );

if ( newDirectories ) {
  console.log( newDirectories + ' created' );
}
if ( existingDirectories ) {
  console.log( existingDirectories + ' directories already exist' );
}
console.log('\n');

// WRITE FILES

var ProgressBar = require( 'progress' );
var childProcess = require( 'child_process' );

var bar = new ProgressBar( '  Saving files [:bar] :percent :etas  ', {
  total: filesToCopy.length
});

function sanitizePath( path ) {
  return path
    .replace( /(\W)/g, '\\$1' );
    // .replace( /(\s)/g, '\\$1' )
    // .replace( /'/g, '\\\'' );
}

var filesInProgress = [];
var didCopy = [];
var didNotCopy = [];

var reportMessages = [];
function report( message ) {
  reportMessages.push( message );
}

function okToCopy( fromPath, toPath ) {
  return new Promise(function( resolve, reject ) {
    fs.exists( toPath, function( exists ) {
      if ( ! exists ) {
        // If file is not there, still need to copy
        return resolve( true );
      }
      fs.stat( fromPath, function( err, fromFileStats ) {
        if ( err ) {
          return reject( err );
        }
        fs.stat( toPath, function( err, toFileStats ) {
          if ( err ) {
            return reject( err );
          }
          if ( toFileStats.size < fromFileStats.size ) {
            report( 'Smaller than original: overwrote ' + toPath );
            // If FROM file is larger than TO file, still need to copy
            return resolve( true );
          } else {
            return resolve( false );
          }
        });
      });
    });
  });
}

function copyFile( fromPath, toPath ) {
  return okToCopy( fromPath, toPath ).then(function( shouldCopy ) {

    if ( ! shouldCopy ) {
      bar.tick();
      didNotCopy.push( toPath );
      return Promise.resolve();
    }

    return new Promise(function( resolve, reject ) {
      // For realsies
      var command = [
        'cp',
        sanitizePath( fromPath ),
        sanitizePath( toPath )
      ].join( ' ' );

      // DRY RUN mode
      if ( process.env.DRY_RUN ) {
        bar.tick();
        didCopy.push( toPath );
        return resolve();
      }

      var cp = childProcess.exec( command, function( err, stdout, stderr) {
        if ( err !== null ) {
          return reject( err );
        }
        bar.tick();
        didCopy.push( toPath );
        if ( bar.complete ) {
          console.log( '\nAll files copied!\n' );
        }
        return resolve();
      });
    });
  });
}

Promise.reduce( _.chunk( filesToCopy ), function( memo, chunk ) {
  filesInProgress = chunk.map(function( file ) {
    return file.toPath;
  });
  return Promise.all( chunk.map(function( file ) {
    return copyFile( file.fromPath, file.toPath );
  }));
}).then(function logCompletion() {
  console.log( '\n\n' + reportMessages.join( '\n' ) );
  console.log( '\n' + didCopy.length + ' files copied,' );
  console.log( didNotCopy.length + ' files already existed' );
});

// Catch Ctrl-C interrupt
process.on( 'SIGINT', function logInterrupt() {
  console.log( reportMessages.join( '\n' ) );
  console.log( '\n\nThe following files were in progress:' );
  console.log( filesInProgress.map(function( path ) {
    return ' ' + path;
  }).join('\n') );
  console.log( '\n' + didCopy.length + ' files copied,' );
  console.log( didNotCopy.length + ' files already existed' );
  process.exit();
});
