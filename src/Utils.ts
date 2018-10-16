/**
 * @param {string} string
 */
export function crc32(string: string) {
  const crcTable = (() => {
    var c;
    var crcTable = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      crcTable[n] = c;
    }
    return crcTable;
  })()

  var crc = 0 ^ (-1);
  for (var i = 0; i < string.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ string.charCodeAt(i)) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

/**
 * Convert string to Uint8Array
 * @param {string} string
 * @returns {Uint8Array}
 */
export function toUint8Array(string: string): Uint8Array {
  const u8a = new Uint8Array(string.length),
        { forEach } = Array.prototype

  forEach.call(string, (value: string, index: number) => {
    u8a[index] = string.charCodeAt(index);
  })

  return u8a
}

/**
 * Convert Uint8Array to string
 * @param {Uint8Array} u8a
 * @returns {string}
 */
export function fromUint8Array(u8a: Uint8Array): string {
  let string = ''

  u8a.forEach((value, index) => {
    string += String.fromCharCode(u8a[index])
  })

  return string
}
