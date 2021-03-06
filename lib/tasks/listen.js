/**
 * This file is part of the TREZOR project.
 *
 * Copyright (C) 2015 SatoshiLabs <info@satoshilabs.com>
 *           (C) 2014 Mike Tsao <mike@sowbug.com>
 *           (C) 2015 William Wolf <throughnothing@gmail.com>
 *
 * This library is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';
var enumerate = require('./enumerate');
var constants = require('../../constants.js');
var Promise = require('promise');

var iterMax = constants.LISTEN_ITERS;
var delay = constants.LISTEN_DELAY;


/**
 * Helper function for making Promise out of timeout
 * (I am surprised this is not in Promise library already)
 * @param {function} function function that will get run (with no "this")
 * @param {int} delay
 * @param {Array} params p
 */
function timeoutPromise(func, delay, params) {
  return new Promise(function (resolve, reject) {
    window.setTimeout(function () {
      try {
        var res = func.apply(null, params);
        resolve(res);
      } catch (e) {
        reject(e);
      }
    }, delay);
  });
}

/**
 * Function that runs one iteration of listen and calls itself if there is no change
 * @param {integer} iteration iteration count
 * @param {string} oldStringified stringified
 * @return {Promise.<Array.<Object>>} List of devices, resolves all the promises
 */
function runIter(iteration, oldStringified) {
  return enumerate().then(function (devices) {
    var stringified = JSON.stringify(devices);
    if ((oldStringified !== null && stringified !== oldStringified) || (iteration === iterMax)) {
      return devices;
    };
    return timeoutPromise(runIter, delay, [iteration + 1, stringified]);
  });

}

/**
 * Function that runs listen
 * @return {Promise.<Array.<Object>>} List of devices, resolves all the promises
 */
function listen() {
  return runIter(0, null);
}

module.exports = listen;
