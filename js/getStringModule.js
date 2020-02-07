// Copyright 2020, University of Colorado Boulder

/**
 * Given a requirejsNamespace, we filter out strings from phet.chipper.strings that start with it, and construct an
 * object with locale fallbacks already pre-computed, so that the correct strings can be accessed via object literal
 * access, e.g. getStringModule( 'JOIST' ).ResetAllButton.name will give the desired string value for whatever locale
 * the sim is being run with.
 *
 * @author Jonathan Olson <jonathan.olson>
 * @author Michael
 */

// constants
const FALLBACK_LOCALE = 'en';

/**
 * @param {string} requirejsNamespace - E.g. 'JOIST', to pull string keys out from that namespace
 * @returns {Object} - Nested object to be accessed like joistStrings.ResetAllButton.name
 */
export default requirejsNamespace => {
  // Our string information is pulled globally, e.g. phet.chipper.strings[ locale ][ stringKey ] = stringValue;
  // Our locale information is from phet.chipper.locale

  assert && assert( typeof phet.chipper.locale === 'string', 'phet.chipper.locale should have been loaded by now' );
  assert && assert( phet.chipper.strings, 'phet.chipper.strings should have been loaded by now' );

  // Construct locales in increasing specificity, e.g. [ 'en', 'zh', 'zh_CN' ], so we get fallbacks in order
  const locales = [ FALLBACK_LOCALE ];
  const stringKeyPrefix = `${requirejsNamespace}/`;

  // e.g. for zh_CN, we want to push 'zh' (the partial fallback) on
  if ( phet.chipper.locale.indexOf( '_' ) >= 0 ) {
    locales.push( phet.chipper.locale.slice( 0, 2 ) );
  }
  // push the full locale if it is NOT the fallback
  if ( phet.chipper.locale !== FALLBACK_LOCALE ) {
    locales.push( phet.chipper.locale );
  }

  // consecutively create locale-specific string objects, and merge them into our result
  const result = {};
  locales.forEach( locale => {
    const partialStringMap = phet.chipper.strings[ locale ];
    if ( partialStringMap ) {
      // The object where our locale-specific string object is built
      const localeObject = {};

      const stringKeys = Object.keys( partialStringMap ).filter( key => key.indexOf( stringKeyPrefix ) === 0 );

      stringKeys.forEach( stringKey => {
        // strip off the require.js namespace, e.g. 'JOIST/ResetAllButton.name' => 'ResetAllButton.name'
        const key = stringKey.slice( stringKeyPrefix.length );
        const stringValue = partialStringMap[ stringKey ];

        const keyParts = key.split( '.' );
        const lastKeyPart = keyParts[ keyParts.length - 1 ];
        const allButLastKeyPart = keyParts.slice( 0, keyParts.length - 1 );

        // During traversal into the string object, this will hold the object where the next level needs to be defined,
        // whether that's another child object, or the string value itself.
        let object = localeObject;

        let partialKey = stringKeyPrefix;
        allButLastKeyPart.forEach( ( keyPart, i ) => {
          partialKey += `${i > 0 ? '.' : ''}${keyPart}`;

          // Don't allow e.g. JOIST/a and JOIST/a.b, since localeObject.a would need to be a string AND an object at the
          // same time.
          assert && assert( typeof object[ keyPart ] !== 'string',
            'It is not allowed to have two different string keys where one is extended by adding a period (.) at the end ' +
            `of the other. The string key ${partialKey} is extended by ${stringKey} in this case, and should be changed.` );

          // Create the next nested level, and move into it
          if ( !object[ keyPart ] ) {
            object[ keyPart ] = {};
          }
          object = object[ keyPart ];
        } );

        assert && assert( typeof object[ lastKeyPart ] !== 'object',
          'It is not allowed to have two different string keys where one is extended by adding a period (.) at the end ' +
          `of the other. The string key ${stringKey} is extended by another key, something containing ${Object.keys( object[ lastKeyPart ] ).toString()}.` );
        assert && assert( !object[ lastKeyPart ],
          `We should not have defined this place in the object (${stringKey}), otherwise it means a duplicated string key OR extended string key` );
        object[ lastKeyPart ] = stringValue;
      } );

      // Combine the strings together, overriding any more "default" string values with their more specific translated
      // values.
      _.merge( result, localeObject );
    }
  } );

  return result;
};
