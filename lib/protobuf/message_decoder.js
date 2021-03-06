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

/**
 * Helper module for converting Trezor's raw input to
 * ProtoBuf's message and from there to regular JSON to trezor.js
 */

var ByteBuffer = require('protobufjs').ByteBuffer;
var Long = require("protobufjs").Long;
var ProtoBuf = require("protobufjs");
var _ = require('lodash');

/**
 * Creates a new message decoder.
 * @param {Object.<string, ProtoBuf.Builder.Message>} messages Builders, generated by reading config
 * @param {integer} type Message type number
 * @param {ArrayBuffer} data Raw data to push to trezor.
 */
var MessageDecoder = function (messages, type, data) {
  this.type = type;
  this.data = data;
  this.messages = messages;
};

/**
 * Returns an info about this message
 * @returns {Object} res
 * @returns {ProtoBuf.Builder.Message} res.constructor Message constructor
 * @returns {string} res.name Message name
 */
MessageDecoder.prototype._getMessageInfo = function () {

  var r = this.messages.messagesByType[this.type];
  if (r == null) {
    throw new Error("Method type not found", this.type);
  }
  return r;
};

/**
 * Gets the name of the message
 * @returns {string} name
 */
MessageDecoder.prototype.getMessageName = function () {
  return this._getMessageInfo().name;
};


/**
 * Returns the actual decoded message, as a ProtoBuf.js object
 * @returns {Protobuf.Builder.Message} Actual message
 */
MessageDecoder.prototype._decode = function () {
  var constructor = this._getMessageInfo().constructor;
  return constructor.decode(this.data);
};

/**
 * Returns the message decoded to JSON, that could be handed back
 * to trezor.j
 * @returns {Object} Message as JSON
 */
MessageDecoder.prototype.decodeJSON = function () {
  var decoded = this._decode();
  var converted = messageToJSON(decoded);
  return JSON.parse(JSON.stringify(converted));
}

/**
 * Converts any ProtoBuf message to JSON in Trezor.js-friendly format
 * @param {ProtoBuf.Builder.Message} message Message to convert
 * @returns {Object} JSON
 */
function messageToJSON(message) {
  var PB = ProtoBuf;
  var res = {};
  var meta = message.$type;


  for (var key in message) {

    var value = message[key];
    if (typeof value === "function") {
      //ignoring
    } else if (value instanceof ByteBuffer) {
      var hex = value.toHex();
      res[key] = hex;
    } else if (value instanceof Long) {
      var num = value.toNumber();
      res[key] = num;
    } else if (Array.isArray(value)) {
      var decodedArr = value.map(function (i) {
        if (typeof i === "object") {
          return messageToJSON(i);
        } else {
          return i;
        }
      });
      res[key] = decodedArr;
    } else if (value instanceof ProtoBuf.Builder.Message) {
      res[key] = messageToJSON(value);
    } else if (meta._fieldsByName[key].type.name === "enum") {

      var enumValues = meta._fieldsByName[key].resolvedType.getChildren();
      res[key] = _.find(enumValues, {
        id: value
      }).name;

    } else {
      res[key] = value;
    }
  }
  return res;
}


module.exports = MessageDecoder;
