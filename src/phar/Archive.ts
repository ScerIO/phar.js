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
   * @param {ArhiveOptions} options - phar options
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
   * @return {string}
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
   * @return {string}
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
   * @return {number}
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
   * @return {string}
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
   * @return {File?}
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
   * @return {File[]}
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
   * @return {number}
   */
  getFilesCount(): number {
    return this.files.length;
  }

  /**
   * Get phar flags
   * @return {number}
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
   * @return {number}
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
   * @param {(string|Uint8Array)} buffer - phar contents
   */
  loadPharData(buffer: string | Uint8Array): this {
    if (buffer instanceof Uint8Array) {
      buffer = fromUint8Array(buffer);
    }

    var pos = buffer.length - 4;
    if (buffer.substring(pos) != PharConst.END_MAGIC) {
      throw new Error('Phar is corrupted! (magic corrupt)');
    }
    pos -= 4;

    var signatureType = Binary.readLInt(buffer.substring(pos, pos + 4));

    var hasher

    switch (signatureType) {
      case Signature.MD5:
        var hash_len = 16;
        hasher = new Hashes.MD5({
          utf8: false
        });
        break;

      case Signature.SHA1:
        var hash_len = 20;
        hasher = new Hashes.SHA1({
          utf8: false
        });
        break;

      case Signature.SHA256:
        var hash_len = 32;
        hasher = new Hashes.SHA256({
          utf8: false
        });
        break;

      case Signature.SHA512:
        var hash_len = 64;
        hasher = new Hashes.SHA512({
          utf8: false
        });
        break;

      default:
        throw Error('Unknown signature type detected!');
    }

    var hash = buffer.substring(pos - hash_len, pos);
    buffer = buffer.substring(0, pos - hash_len);
    if (hasher.raw(buffer) != hash) {
      throw Error('Phar has a broken signature!');
    }

    var stub_len = buffer.indexOf(PharConst.STUB_END);
    if (stub_len == -1) {
      throw Error('Stub not found!');
    }
    stub_len += PharConst.STUB_END.length;

    const binaryBuffer = new BinaryBuffer(buffer);

    this.stub = binaryBuffer.get(stub_len);

    var manifestBuffer = new BinaryBuffer(binaryBuffer.getString());
    var files_count = manifestBuffer.getLInt();
    this.manifestApi = manifestBuffer.getLShort();
    this.flags = manifestBuffer.getLInt();
    this.alias = manifestBuffer.getString();
    this.metadata = manifestBuffer.getString();

    this.files = [];
    for (var i = 0; i < files_count; i++) {
      var options: FileOptions = {};

      var filename = manifestBuffer.getString();
      manifestBuffer.offset += 4; // uncompressed file size
      options.timestamp = manifestBuffer.getLInt();
      var size = manifestBuffer.getLInt();
      var readed_crc32 = manifestBuffer.getLInt();
      var flags = manifestBuffer.getLInt();
      options.permission = flags & 0xfff;
      options.compressionType = flags & 0xf000;
      options.metadata = manifestBuffer.getString();
      options.isCompressed = true;

      var file = new File(filename, binaryBuffer.get(size), options);
      if (readed_crc32 != crc32(file.getContents())) {
        throw Error('Phar is corrupted! (file corrupt)');
      }

      this.files.push(file);
    }

    return this;
  }

  /**
   * Save phar file contents
   * @param {boolean} asU8A - save result as Uint8Array (Default true)
   * @return {(string|Uint8Array)} - phar contents
   */
  savePharData(asU8A: boolean = true): string | Uint8Array {
    if (!this.getFilesCount()) {
      throw Error('Phar must have at least one file!');
    }

    var buffer = new BinaryBuffer();
    var manifestBuffer = new BinaryBuffer();

    buffer.put(this.stub);

    manifestBuffer.putLInt(this.getFilesCount());
    manifestBuffer.putLShort(this.manifestApi);
    manifestBuffer.putLInt(this.flags);
    manifestBuffer.putString(this.alias);
    manifestBuffer.putString(this.metadata);

    var all_contents = '';
    this.files.forEach(file => {
      var contents = file.getCompressedContents();

      manifestBuffer.putString(file.getName());
      manifestBuffer.putLInt(file.getSize());
      manifestBuffer.putLInt(file.getTimestamp());
      manifestBuffer.putLInt(contents.length);
      manifestBuffer.putLInt(crc32(file.getContents()));
      manifestBuffer.putLInt(file.getPharFlags());
      manifestBuffer.putString(file.getMetadata());

      all_contents += contents;
    })

    buffer.putString(manifestBuffer.getBuffer())
    buffer.put(all_contents);

    var hasher

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
    var hash = hasher.raw(buffer.getBuffer());
    buffer.put(hash);
    buffer.putLInt(this.signatureType)
    buffer.put(PharConst.END_MAGIC);

    return asU8A ? toUint8Array(buffer.getBuffer()) : buffer.getBuffer()
  }

}
