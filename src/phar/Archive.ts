import PharConst, { Signature } from './Const'
import File, { FileOptions } from './File'
import Binary from '../Binary'
import BinaryBuffer from '../BinaryBuffer'
import {
  crc32,
  toUint8Array,
  fromUint8Array
} from '../Utils'

import * as Hashes from 'jshashes'

export interface ArhiveOptions {
  /**
   * Alias for the phar
   * @type {string}
   */
  alias?: string
  /**
   * Bootstrap stub
   * @type {string}
   */
  stub?: string
  /**
   * Signature type
   * @type {number}
   */
  signatureType?: number
  /**
   * Metadata
   * @type {string}
   */
  metadata?: string
  /**
   * Phar files
   * @type {File[]}
   */
  files?: File[]
  /**
   * Flags
   * @type {number}
   */
  flags?: number
  /**
   * manifest API version
   * @type {number}
   */
  manifestApi?: number
}

/**
 * Phar class
 * @class Phar
 */
export default class Archive {
  /**
   * Alias for the phar
   * @type {string}
   */
  private alias: string

  /**
   * Bootstrap stub
   * @type {string}
   */
  private stub: string

  /**
   * Signature type
   * @type {number}
   */
  private signatureType: number

  /**
   * Metadata
   * @type {string}
   */
  private metadata: string

  /**
   * Phar files
   * @type {File[]}
   */
  private files: File[]

  /**
   * Flags
   * @type {number}
   */
  private flags: number

  /**
   * manifest API version
   * @type {number}
   */
  private manifestApi: number

  /**
   * Phar
   * @constructor
   * @param {ArhiveOptions} options phar options
   */
  constructor(options: ArhiveOptions = {}) {
    this.alias = options.alias || '';
    this.setStub(options.stub || `<?php ${PharConst.STUB_END}`);
    this.setSignatureType(options.signatureType || Signature.SHA1);
    this.metadata = options.metadata || '';
    this.setFiles(options.files || []);
    this.flags = options.flags || 0x10000;
    this.manifestApi = options.manifestApi || 17;
  }

  /**
   * Get stub
   * @returns {string}
   */
  getStub(): string {
    return this.stub;
  }

  /**
   * Set stub
   * @param {string} stub
   */
  setStub(stub: string): this {
    var pos = stub.toLowerCase().indexOf('__halt_compiler();');
    if (pos == -1) {
      throw Error('Stub is invalid!');
    }

    this.stub = stub.substring(0, pos) + PharConst.STUB_END;
    return this
  }

  /**
   * Get alias
   * @returns {string}
   */
  getAlias(): string {
    return this.alias;
  }

  /**
   * Set alias
   * @param {string} alias
   */
  setAlias(alias: string): this {
    this.alias = alias;
    return this;
  }

  /**
   * Get signature type
   * @returns {number}
   */
  getSignatureType(): number {
    return this.signatureType;
  }

  /**
   * Set signature type
   * @param {number} type
   */
  setSignatureType(type: Signature): this {
    if (type != Signature.MD5 && type != Signature.SHA1 && type != Signature.SHA256 && type != Signature.SHA512) {
      throw Error('Unknown signature type given!');
    }

    this.signatureType = type;
    return this;
  }

  /**
   * Get metadata
   * @returns {string}
   */
  getMetadata(): string {
    return this.metadata;
  }

  /**
   * Set metadata
   * @param {string} meta
   */
  setMetadata(meta: string): this {
    this.metadata = meta;
    return this;
  }

  /**
   * Add file
   * @param {File} file
   */
  addFile(file: File): this {
    if (file instanceof File) {
      this.files.push(file)
    }
    return this;
  }

  /**
   * Get file
   * @param {string} name
   * @returns {File?}
   */
  getFile(name: string): File | undefined {
    return this.files.find((file: File) => file.getName() == name)
  }

  /**
   * Remove file
   * @param {string} name
   */
  removeFile(name: string): this {
    this.files = this.files.filter((file) => file.getName() != name)
    return this;
  }

  /**
   * Get all files
   * @returns {File[]}
   */
  getFiles(): File[] {
    return this.files.map(file => file) // Copy array
  }

  /**
   * Set all files
   * @param {File[]} files
   */
  setFiles(files: File[]): this {
    this.files = []
    files.forEach((file) => this.addFile(file))
    return this;
  }

  /**
   * Get files count
   * @returns {number}
   */
  getFilesCount(): number {
    return this.files.length;
  }

  /**
   * Get phar flags
   * @returns {number}
   */
  getFlags(): number {
    return this.flags;
  }

  /**
   * Set phar flags
   * @param {number} flags
   */
  setFlags(flags: number): this {
    this.flags = flags;
    return this;
  }

  /**
   * Get manifest API version
   * @returns {number}
   */
  getManifestApi(): number {
    return this.manifestApi;
  }

  /**
   * Set manifest API version
   * @param {number} api
   */
  setManifestApi(api: number): this {
    this.manifestApi = api;
    return this;
  }

  /**
   * Load phar from contents
   * @param {(string|Uint8Array)} buffer phar contents
   */
  loadPharData(buffer: string | Uint8Array): this {
    if (buffer instanceof Uint8Array) {
      buffer = fromUint8Array(buffer);
    }

    let pos = buffer.length - 4;
    if (buffer.substring(pos) != PharConst.END_MAGIC) {
      throw new Error('Phar is corrupted! (magic corrupt)');
    }
    pos -= 4;

    const signatureType = Binary.readLInt(buffer.substring(pos, pos + 4));

    let hasher, hashLength

    switch (signatureType) {
      case Signature.MD5:
        hashLength = 16;
        hasher = new Hashes.MD5({
          utf8: false
        });
        break;

      case Signature.SHA1:
        hashLength = 20;
        hasher = new Hashes.SHA1({
          utf8: false
        });
        break;

      case Signature.SHA256:
        hashLength = 32;
        hasher = new Hashes.SHA256({
          utf8: false
        });
        break;

      case Signature.SHA512:
        hashLength = 64;
        hasher = new Hashes.SHA512({
          utf8: false
        });
        break;

      default:
        throw Error('Unknown signature type detected!');
    }

    const hash = buffer.substring(pos - hashLength, pos);
    buffer = buffer.substring(0, pos - hashLength);
    if (hasher.raw(buffer) != hash) {
      throw Error('Phar has a broken signature!');
    }

    var stubLength = buffer.indexOf(PharConst.STUB_END);
    if (stubLength == -1) {
      throw Error('Stub not found!');
    }
    stubLength += PharConst.STUB_END.length;

    const binaryBuffer = new BinaryBuffer(buffer);

    this.stub = binaryBuffer.get(stubLength);

    const manifestBuffer = new BinaryBuffer(binaryBuffer.getString());
    var filesCount = manifestBuffer.getLInt();
    this.manifestApi = manifestBuffer.getLShort();
    this.flags = manifestBuffer.getLInt();
    this.alias = manifestBuffer.getString();
    this.metadata = manifestBuffer.getString();

    this.files = [];
    for (var i = 0; i < filesCount; i++) {
      const options: FileOptions = {};

      const filename = manifestBuffer.getString();
      manifestBuffer.offset += 4; // uncompressed file size
      options.timestamp = manifestBuffer.getLInt();
      const size = manifestBuffer.getLInt(),
        readedCrc32 = manifestBuffer.getLInt(),
        flags = manifestBuffer.getLInt();
      options.permission = flags & 0xfff;
      options.compressionType = flags & 0xf000;
      options.metadata = manifestBuffer.getString();
      options.isCompressed = true;

      const file = new File(filename, binaryBuffer.get(size), options);
      if (readedCrc32 != crc32(file.getContents())) {
        throw Error('Phar is corrupted! (file corrupt)');
      }

      this.files.push(file);
    }

    return this;
  }

  /**
   * Save phar file contents
   * @param {boolean} asU8A save result as Uint8Array (Default true)
   * @returns {string|Uint8Array} phar contents
   */
  savePharData(asU8A: boolean = true): string | Uint8Array {
    if (!this.getFilesCount()) {
      throw Error('Phar must have at least one file!');
    }

    const buffer = new BinaryBuffer(),
      manifestBuffer = new BinaryBuffer();

    buffer.put(this.stub);

    manifestBuffer
      .putLInt(this.getFilesCount())
      .putLShort(this.manifestApi)
      .putLInt(this.flags)
      .putString(this.alias)
      .putString(this.metadata);

    let allContents = '';
    this.files.forEach((file) => {
      const contents = file.getCompressedContents();

      manifestBuffer
        .putString(file.getName())
        .putLInt(file.getSize())
        .putLInt(file.getTimestamp())
        .putLInt(contents.length)
        .putLInt(crc32(file.getContents()))
        .putLInt(file.getPharFlags())
        .putString(file.getMetadata());

      allContents += contents;
    })

    buffer
      .putString(manifestBuffer.getBuffer())
      .put(allContents);

    let hasher

    switch (this.signatureType) {
      case Signature.MD5:
        hasher = new Hashes.MD5({
          utf8: false
        });
        break;

      case Signature.SHA1:
        hasher = new Hashes.SHA1({
          utf8: false
        });
        break;

      case Signature.SHA256:
        hasher = new Hashes.SHA256({
          utf8: false
        });
        break;

      case Signature.SHA512:
        hasher = new Hashes.SHA512({
          utf8: false
        });
        break;

      default:
        throw Error('Unknown signature type detected!');
    }
    const hash = hasher.raw(buffer.getBuffer());
    buffer
      .put(hash)
      .putLInt(this.signatureType)
      .put(PharConst.END_MAGIC);

    return asU8A ? toUint8Array(buffer.getBuffer()) : buffer.getBuffer()
  }
}
