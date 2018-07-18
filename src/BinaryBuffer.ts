import Binary from './Binary'

/**
 * Binary buffer
 * @class BinaryBuffer
 */
export default class BinaryBuffer {
  /**
   * @type {string}
   */
  private buffer: string

  /**
   * @type {number}
   */
  public offset: number = 0

  /**
   * Binary buffer
   * @constructor
   * @property {string} buffer - buffer data
   */
  public constructor(buffer: string = '') {
    this.buffer = buffer
    return this
  }

  /**
   * @return {string}
   */
  public getBuffer(): string {
    return this.buffer
  }

  /**
   * @param {number} length
   */
  public get(length: number) {
    if (length < 0) {
      length = Math.max(0, this.buffer.length - this.offset)
    }

    if (length == 0) {
      return ""
    }

    if ((this.offset += length) > this.buffer.length) {
      throw Error('Buffer is accessed out of bounds!')
    }

    return this.buffer.substring(this.offset - length, this.offset)
  }

  /**
   * @param {string} data
   */
  public put(data: string): void {
    this.buffer += data
  }

  /**
   * @return {number}
   */
  public getLInt(): number {
    return Binary.readLInt(this.get(4))
  }

  /**
   * @param {number} number
   */
  public putLInt(number: number): void {
    this.put(Binary.writeLInt(number))
  }

  /**
   * @return {number}
   */
  public getLShort(): number {
    return Binary.readLShort(this.get(2))
  }

  /**
   * @param {number} number
   */
  public putLShort(number: number): void {
    this.put(Binary.writeLShort(number))
  }

  /**
   * @return {string}
   */
  public getString(): string {
    return this.get(this.getLInt())
  }

  /**
   * @param {string} data
   */
  public putString(data: string): void {
    this.putLInt(data.length)
    this.put(data)
  }
}
