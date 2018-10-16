import Const, { Compression } from './Const'
import {
  toUint8Array,
  fromUint8Array
} from '../Utils'

import {
  inflateRaw,
  deflateRaw,
} from 'pako'

export interface FileOptions {
  /**
   * File metadata
   * @type {string}
   */
  metadata?: string

  /**
   * Compression type
   * @type {number}
   */
  compressionType?: number

  /**
   * File permission
   * @type {number}
   */
  permission?: number

  /**
   * Timestamp of the file
   * @type {number}
   */
  timestamp?: number

  /**
   * Is given contents already compressed
   * @type {boolean}
   */
  isCompressed?: boolean
}

/**
 * A single file within a phar archive
 * @class PharFile
 */
export default class File {
  /**
   * File name
   * @type {string}
   */
  private name: string

  /**
   * File metadata
   * @type {string}
   */
  private metadata: string

  /**
   * File content
   * @type {string}
   */
  private contents: string

  /**
   * Compression type
   * @type {number}
   */
  private compressionType: number

  /**
   * File permission
   * @type {number}
   */
  private permission: number

  /**
   * Timestamp of the file
   * @type {number}
   */
  private timestamp: number

  /**
   * Is given contents already compressed
   * @type {boolean}
   */
  private isCompressed: boolean

  /**
   * @constructor
   * @param {string} name filename (path)
   * @param {string} contents file contents
   * @param {FileOptions?} options file options
   */
  constructor(name: string, contents: string, options: FileOptions = {}) {
    this.name = name || 'file';
    this.setCompressionType(options.compressionType || Compression.NONE);
    this.setContents(contents || '', options.isCompressed || false);
    this.setTimestamp(options.timestamp || -1);
    this.setPermission(options.permission || 438); // linux filesystem permission 0666
    this.metadata = options.metadata || '';

    return this;
  }

  /**
   * Get filename (path)
   * @returns {string}
   */
  getName(): string {
    return this.name;
  }

  /**
   * Set filename (path)
   * @param {string} name
   */
  setName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Get file contents
   * @returns {string}
   */
  getContents(): string {
    return this.contents;
  }

  /**
   * Set file contents
   * @param {string} contents
   * @param {boolean} isCompressed is given contents already compressed
   */
  setContents(contents: string, isCompressed: boolean): this {
    if (isCompressed) {
      switch (this.compressionType) {
        case Compression.NONE:
          this.contents = contents;
          break;

        case Compression.GZ:
          try {
            this.contents = fromUint8Array(inflateRaw(toUint8Array(contents)))
          } catch (error) {
            throw Error('Zlib error: ' + error);
          }
          break;

        default:
          throw Error('Unsupported compression type detected!');
      }
    } else {
      this.contents = contents;
    }

    return this;
  }

  /**
   * Get file compressed contents
   * @returns {string}
   */
  getCompressedContents(): string {
    switch (this.compressionType) {
      case Compression.GZ:
        try {
          return fromUint8Array(deflateRaw(toUint8Array(this.contents)))
        } catch (error) {
          throw Error('Zlib error: ' + error);
        }

      default:
        return this.contents;
    }
  }

  /**
   * Get file size
   * @returns {number}
   */
  getSize(): number {
    return this.getContents().length;
  }

  /**
   * Get file compressed size
   * @returns {number}
   */
  getComressedSize(): number {
    return this.getCompressedContents().length;
  }

  /**
   * Get file compression type
   * @returns {number}
   */
  getCompressionType(): number {
    return this.compressionType;
  }

  /**
   * Set compression type
   * @param {number} type
   */
  setCompressionType(type: number): this {
    if (Const.SUPPORTED_COMPRESSION.indexOf(type) == -1) {
      throw Error('(' + type + ') compression type is not supported!');
    }

    this.compressionType = type;
    return this;
  }

  /**
   * Get file permission
   * @returns {number}
   */
  getPermission(): number {
    return this.permission;
  }

  /**
   * Set file permission
   * @param {number} perm
   */
  setPermission(perm: number): this {
    if (perm > 4095 || perm < 0) {
      throw Error('Permission number is too ' + (perm < 0 ? 'small' : 'large') + '!');
    }

    this.permission = perm;
    return this;
  }

  /**
   * Get phar flags
   * @returns {number}
   */
  getPharFlags(): number {
    return (this.permission | this.compressionType);
  }

  /**
   * Get file timestamp
   * @returns {number}
   */
  getTimestamp(): number {
    return this.timestamp;
  }

  /**
   * Set file timestamp
   * @param {number} time
   */
  setTimestamp(time: number): this {
    if (time < 0) {
      time = Date.now() / 1000 | 0;
    }

    this.timestamp = time;
    return this;
  }

  /**
   * Get file metadata
   * @returns {string}
   */
  getMetadata(): string {
    return this.metadata;
  }

  /**
   * Set file metadata
   * @param {string} metadata
   */
  setMetadata(metadata: string): this {
    this.metadata = metadata;
    return this;
  }
}
