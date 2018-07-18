import Archive from './phar/Archive'
import File from './phar/File'
import {
  toUint8Array,
  fromUint8Array
} from './Utils'

import * as JSZip from 'jszip'
import { Compression } from './phar/Const'

/**
 * Convert Phar to Zip
 * @property {Archive} phar
 * @return {JSZip} - zip data
 */
export async function toZip(phar: Archive): Promise<JSZip> {
  const zip = new JSZip(),
    files = phar.getFiles()

  for (var i in files) {
    var date = new Date()
    date.setTime(files[i].getTimestamp() * 1000)

    zip.file<'uint8array'>(files[i].getName(), toUint8Array(files[i].getContents()), {
      date
    })
  }

  return zip
}

/**
 * Convert Zip to Phar
 * @property {(string|Uint8Array)} data
 * @return {Archive}
 */
export async function toPhar(
  data: string | Uint8Array,
  compressionType: Compression = Compression.NONE,
  password?: string
): Promise<Archive> {
  const sourceZip: JSZip = new JSZip()
  let zip: JSZip

  const phar = new Archive()

  try {
    zip = await sourceZip.loadAsync((data instanceof Uint8Array) ? data : toUint8Array(data))
  } catch (error) {
    throw Error('JSZip creation error: ' + error)
  }

  try {
    const files: JSZip.JSZipObject[] = []
    zip.forEach(async (path: string, file: JSZip.JSZipObject) => files.push(file))

    for (const file of files)
      phar.addFile(new File(file.name, await file.async<'text'>('text'), {
        compressionType,
        timestamp: file.date.getDate(),
      }))
  } catch (error) {
    throw Error('JSZip decompression error: ' + error)
  }

  return phar
}
