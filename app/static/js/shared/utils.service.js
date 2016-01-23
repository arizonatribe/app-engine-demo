(function(angular) {
  'use strict';

  angular.module('confApp.shared')
    .factory('utils', UtilsService);

  /**
   * Utility service, used for manipulating arrays, collections, objects and strings.
   * @ngdoc service
   * @name confApp.shared.utils
   * @class
   * @constructor
   * @returns {object}
   */
  function UtilsService() {
    /**
     * utility function to get around jqLite's shortcoming of retrieving element by id
     * @method confApp.utils#elementById
     * @param {string} id A string value matching an HTML element id attribute value
     * @returns {*} An angular element (for use in directives) if parsing was successful
     * @throws Will throw an exception if the element cannot be found on the page by the given id
     */
    var elementById = function(id) {
        var element = document.querySelector('#' + id);
        if (!element) {
          throw ('Failed to find element with id:' + id);
        } else {
          return angular.element(element);
        }
      },
        /**
         * Creates a stringified representation of a function and removes any annotations or comments
         * @method confApp.utils#fnToString
         * @param {function} fn A function expression from which to remove annotations/comments
         * @returns {string} A string value of the function itself, but without any annotations or comments
         */
        fnToString = function(fn) {
          return (angular.isFunction(fn) && fn.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '') || '');
        },
        /**
         * Parses the parameters expected to be passed into a function into an Array of strings
         * @method confApp.utils#getParams
         * @param {function} fn A function from whose definition to parse params
         * @returns {string[]} An array of string values representing the expected function parameters
         */
        getParams = function(fn) {
          var fnName = fnToString(fn);
          return fnName.slice(fnName.indexOf('(') + 1, fnName.indexOf(')')).match(/([^\s,]+)/g) || [];
        },
        /**
         * Places every dependency in a given array onto the constructor instance itself. So the `instance` argument
         * should be a constructor function and the `dependencies` should be all the arguments injected into it.
         * The way to pull this off is to call this method from inside the constructor itself:
         * @example
         * function(dep1, dep2, dep3) {
         *   bindDependenciesToInstance(this, arguments);
         * }
         * @method confApp.utils#bindDependenciesToInstance
         * @param {object} instance The class constructor itself
         * @param {object[]} dependencies The class's injected dependencies (or just the `arguments` array available
         * from inside the constructor itself )
         */
        bindDependenciesToInstance = function(instance, dependencies) {
          var params = getParams(instance.constructor);
          dependencies.forEach(function(val, key) {
            instance[params[key]] = val;
          });
        },
        /**
         * Generates a unique 36 character hyphenated GUID
         * @method confApp.utils#generateUUID
         * @returns {string} A string GUID
         */
        generateUUID = function() {
          var d = (new Date()).getTime();
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          });
        },
        /**
         * Generates a random string of text of a given length.
         * Will generate an alpha-numeric string unless you specify a different character set as the second argument
         * @method confApp.utils#randomString
         * @param {number} length The length of the string to generate
         * @param {string|number} [charSet] optional set of characters to use when generating a random string
         * (defaults to full alpha-numeric set)
         * @returns {string|number} A randomly generated string or number
         */
        randomString = function(length, charSet) {
          var str = '',
              isAllNumeric = false,
              isNegative = false,
              defaultCharSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
              parsedIntCharSet;

          if (~~length) {
            if (!angular.isString(charSet)) {
              if (angular.isNumber(charSet)) {
                parsedIntCharSet = parseInt(charSet, 10);
                if (!isNaN(parsedIntCharSet) && parsedIntCharSet !== 0) {
                  isAllNumeric = true;
                  isNegative = parsedIntCharSet < 0;
                  charSet = '' + Math.abs(parsedIntCharSet) + '';
                } else {
                  charSet = defaultCharSet;
                }
              } else {
                charSet = defaultCharSet;
              }
            }

            for(var i = 0; i < ~~length; i++) {
              var newChar = Math.round(Math.random() * (charSet.length - 1));
              /* If we are generating a random number, make sure the first digit is not zero */
              if (isAllNumeric && !str.length) {
                while (newChar === '0') {
                  newChar = Math.round(Math.random() * (charSet.length - 1));
                }
              }
              str += charSet.charAt(newChar);
            }
          }
          return isAllNumeric ? isNegative ? -~~str : ~~str : str;
        };

    return {
      elementById: elementById,
      bindDependenciesToInstance: bindDependenciesToInstance,
      generateUUID: generateUUID,
      randomString: randomString
    };
  }
})(window.angular);
