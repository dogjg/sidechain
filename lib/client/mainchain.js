/**
 * mainchain.js - client for interracting with the mainchain rpc.
 * https://github.com/jonajosejg/sidechain
 * Copyright (C) 2023, Jonathan Gonzales (MIT License)
 */

'use strict';

const assert = require('bsert');
const {Client} = require('bcurl');
const Amount = require('../btc/amount');
const Network = require('../protocol/network');
const common = require('../blockchain/common');
const consensus = require('../protocol/consensus');
const BMMCache = require('../bmm/cache');
const network = Network.get('regtest');

/**
 * MainchainClient
 * @alias module:client.MainchainClient
 * @extends {bcurl.Client}
 */

class MainchainClient extends Client {
  /**
   * Create a client that interracts with the
   * mainchain rpc daemon.
   * @constructor
   * @param {Object} options
   */

  constructor(options) {
    super();

    this.opened = false;

    this.options = new MainchainOptions(options);
    this.network = this.options.network;
    this.port = this.options.port;
    this.host = this.options.host;
    this.socket.port = this.options.port;
    this.headers = this.options.headers;
    this.username = this.options.username;
    this.password = this.options.password;
  }

  /**
   * Open the mainchain client.
   * @returns {Promsie}
   */

  async open() {
    return this;
  }

  /**
   * Broadcasts the Withdrawal Bundle hash to the mainchain
   * @returns {Promise}
   */

  async broadcastWithdrawalBundle(sidechain, hash) {
    assert(typeof hash === 'string' && hash.length === 64);
    return this.execute('/', 'receivewithdrawalbundle', [sidechain, hash])
  }

  /**
   * Verify the BMM block hash proof from the mainchain
   * @returns {Promise}
   */

  async verifyBMM(hashMainBlock, hashBMM, sidechain) {
    assert(typeof hashMainBlock === 'string' && hashMainBlock.length === 64);
    assert(typeof hashBMM === 'string' && hashBMM.length === 64);
    assert(sidechain >= 0);
    return this.execute('/', 'verifybmm', [hashMainBlock, hashBMM, sidechain])
  }

  /**
   * Get some info on the mainchain node (network).
   * @returns {Promise}
   */

  async getMainchainInfo() {
    return this.execute('/', 'getblockchaininfo', [])
  }

  /**
   * Retrieves the chaintip from the mainchain deamon
   * @returns {Promise}
   */

  async getMainchainTip() {
    return this.execute('/', 'getbestblockhash', [])
  }

  /**
   * Retrieve the block hash on the mainchain daemon
   * by block height number.
   * @returns {Promise}
   */

  async getMainchainBlockHash(height) {
    assert(typeof height === 'number');
    return this.execute('/', 'getblockhash', [height])
  }

  /**
   * Retrieves the ctip withdrawal hash from the mainchain
   * @returns {Promise}
   */

  async getSidechainTip(num) {
    assert(typeof num === 'number');
    return this.execute('/', 'listsidechainctip', [num])
  }

  /**
   * Gets the 5 most recent block hashes on the mainchain
   * @returns {Promise}
   */

  async getRecentBlockHashes() {
    return this.execute('/', 'listpreviousblockhashes', [])
  }

  /**
   * Retrieves the amount of blocks on the mainchain
   * @returns {Promise}
   */

  async getBlockCount() {
    return this.execute('/', 'getblockcount', [])
  }

  /**
   * Checks if the current withdrawal bundle hash
   * is spent on the mainchain.
   * @returns {Promise}
   */

  hasSpentWithdrawal(hash, sidechain) {
    assert(typeof hash === 'string' && hash.length === 64);
    assert(sidechain >= 0);
    return this.execute('/', 'havespentwithdrawal', [hash, sidechain]);
  }

  /**
   * Checks if the withdrawal bundle hash has failed
   * on the mainchain.
   * @returns {Promise}
   */

  hasFailedWithdrawal(hash, sidechain) {
    assert(typeof hash === 'string' && hash.length === 64);
    assert(sidechain >= 0);
    return this.execute('/', 'havefailedwithdrawal', [hash, sidechain]);
  }

  /**
   * Retrieves the workscore / ack for a withdrawalbundle hash
   * @returns {Promise}
   */

  getWorkScore(sidechain, hash) {
    assert(typeof sidechain === 'number');
    assert(typeof hash === 'string');

    return this.execute('/', 'getworkscore', [sidechain, hash])
  }

  /**
   * Retrieves average fee amount for most recent mainchain blocks.
   * @returns {Promise}
   */

  getAverageMainchainFees(blocks) {
    assert(typeof blocks === 'number');
    return this.execute('/', 'getaveragefee', [blocks])
  }

  /**
   * For now this call only checks to see if there
   * are any WithdrawalBundles(s) for nSidechain.
   * The results could be useful for a GUI.
   */

  async getWithdrawalBundleStatus(sidechain) {
    assert(sidechain >= 0);
    return this.execute('/', 'listwithdrawalstatus', [sidechain])
  }

  /**
   * Verify the depsit transaction on the mainchain.
   * @returns {Promise}
   */

  async verifyDeposit(hashMainBlock, txid, tx) {
    assert(typeof hashMainBlock === 'string' && hashMainBlock.length === 64);
    assert(typeof txid === 'string' && txid.length === 64);
    assert(typeof tx >= 0);
    return this.execute('/', 'verifydeposit', [hashMainBlock, txid, tx]);
  }

  /**
   * Forwards the BMM requests onto the mainchain daemon.
   * @returns {Promise}
   */

  async sendBMMRequest(amount, height, criticalHash, sidechain, prevMainBlock) {
    assert(typeof height === 'number');
    assert(typeof criticalHash === 'string' || criticalHash.length === 64);
    assert(typeof prevMainBlock === 'string' || prevMainBlock.length === 64);
    assert(sidechain >= 0);

    let amt = new Amount(amount);

    if (amt === new Amount(0))
      amt = new Amount(consensus.CRITICAL_DATA_AMT)

    return this.execute('/', 'createbmmcriticaldatatx',
      [amt.toString(), height, criticalHash, sidechain, prevMainBlock]);
  }

  /**
   * Creates a new sidechain proposal on the mainchain daemon
   * using the default sidechain number for the testchain
   * @returns {Promise}
   */

  createSidechainProposal(sidechain, name, desc, version, hashID, hashID2) {
    assert(sidechain >= common.THIS_SIDECHAIN);
    assert(typeof name === 'string');
    assert(typeof desc === 'string');
    assert(version >= 0);
    assert(typeof hashID === 'string');
    assert(typeof hashID2 === 'string');

    let tar = consensus.SIDECHAIN_BUILD_TAR_HASH;
    let commit = consensus.SIDECHAIN_BUILD_COMMIT_HASH;

    return this.execute('/', 'createsidechainproposal',
      [sidechain, name, desc, version, tar, commit]);
  }

  /**
   * Creates a sidechain deposit to the specified address.
   * Returning a txid of the deposit hash.
   * @returns {Promise}
   */

  createSidechainDeposit(sidechain, addr, amount, fee) {
    assert(sidechain >= 0);
    assert(typeof addr === 'string');

    let amt = new Amount(amount);

    return this.execute('/', 'createsidechaindeposit',
      [sidechain, addr, amt.toString(), fee]);
  }

  /**
   * Returns the status of the current nSidechain's
   * activation status on the mainchain daemon.
   * @returns {Promise}
   */

  getSidechainActivationStatus(sidechain) {
    assert(sidechain >= 0);
    return this.execute('/', 'getsidechainactivationstatus', [sidechain])
  }

  /**
   * Checks the connection of the client to the daemon.
   * @returns {Boolean}
   */

   async isConnected() {
     const zero = 0;
     let blocks = this.getBlockCount().then((value) => { blocks = value });
     let connection;

     if (blocks === zero) {
       connection = false;
     } else {
       connection = true;
     }

     return connection;
   }

  /**
   * Should close the mainchain client connection
   * @returns {Promise}
   */

  async close() {
    return this.close();
  }
}

/**
 * MainchainOptions
 * @alias module:client.MainchainOptions
 */

class MainchainOptions {
  /**
   * Create the options, settings for the mainchain client.
   * @constructor
   * @param {Object} options
   */

  constructor(options) {
    this.network = network;
    this.port = network.mainchainPort;
    this.headers = {'Content-Type': 'application/json'};
    this.host = 'localhost';
    this.username = 'user';
    this.password = 'password';

    if (options)
      this.fromOptions(options);
  }

  /**
   * Inject properties from object.
   * @private
   * @param {Object} options
   * @returns {MainchainOptions}
   */

  fromOptions(options) {
    assert(options);

    this.network = options.network;
    this.port = options.port;
    this.host = options.host;
    this.headers = options.headers;
    this.username = options.username;
    this.password = options.password;

    if (options.network != null) {
      assert(typeof options.network === 'object');
      this.network = options.network;
    }

    if (options.port != null) {
      assert(typeof options.port === 'number');
      this.port = options.port;
    }

    if (options.host != null) {
      assert(typeof options.host === 'string');
      this.host = options.host;
    }

    if (options.username != null) {
      assert(typeof options.username === 'string');
      this.username = options.username;
    }

    if (options.password != null) {
      assert(typeof options.password === 'string');
      this.password = options.password;
    }

    return this;
  }

  /**
   * Instantiate http options from object.
   * @param {Object} options
   * @returns {MainchainOptions}
   */

  static fromOptions(options) {
    return new MainchainOptions().fromOptions(options);
  }
}

module.exports = MainchainClient;
