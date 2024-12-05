/**
 * sidechain.js - a sidechain module for bip300, bip301 sidechains.
 * Copyright (c) 2023-2024 Jonathan Joseph Gonzales Gutierrez
 * https://github.com/jonajosejg/sidechain
 */

'use strict';

const assert = require('bsert');
const common = require('../blockchain/common');
const layout = require('../blockchain/layout');
const Script = require('../script/script');
const SHA256 = require('bcrypto/lib/sha256');
const EMPTY = Buffer.alloc(0);
const {inspectSymbol} = require('../utils');


/**
 * Base object for sidechain related entries
 * @alias module:sidechain.SidechainObject
 * @property {Number} sidechain
 * @property {Buffer} hash
 * @property {Script} script
 * @property {Number} type
 * @property {Number} version
 */

class SidechainObject {
  constructor(options) {
    this.sidechain = common.THIS_SIDECHAIN;
    this.hash = EMPTY;
    this.script = new Script();
    this.type = -1;
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

    if (options.hash != null)
      assert(Buffer.isBuffer(hash));
    this.hash = options.hash;

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
    this.hash = options.hash;
    this.script = options.script;
    this.type = options.type;
    this.version = options.version;

    return this;
  }

  /**
   * Retrieves the current sidechain object type
   * (withdrawal, withdrawalbundle, deposit, etc)
   * based on the hash
   * @returns {Buffer}
   */

  getHash(hash) {
    assert(Buffer.isBuffer(hash));
    return hash;
  }

  /**
   * Retrieves the current sidechain object
   * whether it be a withdrawal, deposit, etc
   * based on the hash type
   * @returns {Script}
   */

  getScript(hash) {
    assert(Buffer.isBuffer(hash));
    return this.script.fromSidechainObject(hash);
  }

  [inspectSymbol]() {
    return '<Sidechain:'
     +   ` sidechain=${this.sidechain}`
     +   ` hash=${this.hash.toString()}`
     +   ` script=${this.script.toString()}`
     +   ` type=${this.type}`
     +   ` >`;
  }
}


module.exports = SidechainObject;
