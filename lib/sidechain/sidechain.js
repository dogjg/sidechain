/**
 * sidechain.js - a sidechain module for bip300, bip301 sidechains.
 * Copyright (c) 2023, Jonathan Joseph Gonzales Gutierrez
 * https://github.com/educationofjon/sidechain
 */

'use strict';

const assert = require('bsert');
const common = require('../blockchain/common');
const layout = require('../blockchain/layout');
const Script = require('../script/script');
const EMPTY = Buffer.alloc(0);
const {inspectSymbol} = require('../utils');


/**
 * Base object for sidechain related entries
 * @alias module:sidechain.Sidechain
 * @property {Number} sidechain
 * @property {Script} script
 * @property {Number} type
 * @property {Number} version
 */

class Sidechain {
  constructor(options) {
    this.sidechain = common.THIS_SIDECHAIN;
    this.script = new Script();
    this.type = this.script.getType();
    this.version = -1;

    if (options)
      this.fromOptions(options);
  }

  /**
   * Inject properties from object.
   * @Private
   * @param {Object} options
   * @returns {Options}
   */

  fromOptions(options) {

    if (options.sidechain != null)
      assert(typeof options.sidechain === 'number');
      this.sidechain = options.sidechain;

    if (options.script != null)
      assert(typeof options.script === 'object');
      this.script = options.script;

    if (options.type != null)
      assert(typeof options.type === 'number');
      this.type = options.type;

    if (options.version != null)
      assert(typeof options.version === 'number');
      this.version = options.version;

    this.sidechain = options.sidechain;
    this.script = options.script;
    this.type = options.type;
    this.version = options.version;

    return this;
  }

  getScript(hash) {
    assert(Buffer.isBuffer(hash));
    return this.script.fromSidechainObj(hash);
  }


  [inspectSymbol]() {
    return '<Sidechain:'
     +   ` sidechain=${this.sidechain}`
     +   ` script=${this.script.toString()}`
     +   ` type=${this.type}`
     +   ` >`;
  }
}


module.exports = Sidechain;
