// Copyright 2020, University of Colorado Boulder

const generateThumbnails = require( './generateThumbnails' );
const generateTwitterCard = require( './generateTwitterCard' );
const grunt = require( 'grunt' );
const sharp = require( 'sharp' );

/**
 *
 * @param buildDir
 * @param repo
 * @param brand
 * @returns {Promise<void>}
 */
const generateImageAssets = async ( repo, brand ) => {
  // Create the build-specific directory, if it doesn't exist yet
  const buildDir = `../${repo}/build/${brand}`;
  if ( !grunt.file.exists( buildDir ) ) {
    grunt.file.mkdir( buildDir );
  }

  grunt.log.writeln( `generating images for ${repo}` );

  // Thumbnails and twitter card
  if ( grunt.file.exists( `../${repo}/assets/${repo}-screenshot.png` ) ) {
    const thumbnailConfigs = [
      { width: 600, height: 394 },
      { width: 420, height: 276 },
      { width: 128, height: 84 },
      { width: 15, height: 10 }
    ];
    grunt.log.writeln( `Building configs: ${JSON.stringify( thumbnailConfigs )}` );
    for ( const config of thumbnailConfigs ) {
      try {
        await generateThumbnails( repo, config.width, config.height, config.quality || 100, config.mime || sharp.format.png.id, `${buildDir}/${repo}-${config.width}${config.quality ? `-${config.quality}` : ''}.png` );
      }
      catch ( e ) {
        grunt.log.error( 'unable to write image', e );
      }
      grunt.log.writeln( 'writing image to ', `${buildDir}/${repo}-${config.width}.png` );
    }

    if ( brand === 'phet' ) {
      await generateThumbnails( repo, 420, 276, 90, sharp.format.jpeg.id, `${buildDir}/${repo}-ios.png` );
      await generateTwitterCard( repo, `${buildDir}/${repo}-twitter-card.png` );
    }
  }
  else {
    grunt.log.error( 'Missing image source!' );
  }
};

module.exports = generateImageAssets;