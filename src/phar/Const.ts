/**
 * Compression flags for phar files
 */
export enum Compression {
  NONE = 0x0000,
  GZ = 0x1000,
  BZIP2 = 0x2000
}

/**
 * Signature types for phar
 */
export enum Signature {
  MD5 = 0x01,
  SHA1 = 0x02,
  SHA256 = 0x04,
  SHA512 = 0x08
}

export default {
  SUPPORTED_COMPRESSION: [Compression.NONE, Compression.GZ],

  /**
   * End of the phar file (magic)
   * @property {string} END_MAGIC
   * @readonly
   */
  END_MAGIC: 'GBMB',

  /**
   * End of the stub
   * *
   * @property {string} STUB_END
   * @readonly
   */
  STUB_END: '__HALT_COMPILER(); ?>\r\n',
}
