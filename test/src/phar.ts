import * as assert from 'assert'
import * as chai from 'chai'
import * as fs from 'fs'

import {
  Archive,
  File,
  Signature,
  ZipConverter,
  Compression,
} from '../../lib/webpack/Phar'

let phar = new Archive(),
  file: File

describe('PHAR Archive', () => {

  it('Create archive', () => assert(phar))

  it('Set stub', () => {
    const stub = '<?php echo "Test" . PHP_EOL; __HALT_COMPILER();'
    phar.setStub(stub)
    assert.equal(phar.getStub(), stub + ' ?>\r\n')
  })

  it('Set signature type', () => {
    phar.setSignatureType(Signature.SHA256)
    assert.equal(phar.getSignatureType(), Signature.SHA256)
  })

  it('Set metadata', () => {
    phar.setMetadata('test-metadata')
    assert.equal(phar.getMetadata(), 'test-metadata')
  })

})

describe('PHAR File', () => {

  it('Create file', () => {
    file = new File('test.txt', 'test-contents')
    assert.equal(file.getName(), 'test.txt')
    assert.equal(file.getContents(), 'test-contents')
  })

  it('Add file to archive', () => {
    phar.addFile(file)
    assert.equal(phar.getFilesCount(), 1)
  })

  it('Get file from archive', () => {
    assert.equal(phar.getFile(file.getName()), file)
  })

  it('Save archive to file', () => {
    const pharContent = phar.savePharData()
    fs.writeFileSync('test.phar', pharContent)
    assert.equal(fs.readFileSync('test.phar').length, 176)
  })

  it('Make new archive', () => {
    assert(phar = new Archive())
  })

  it('Load archive from file', () => {
    phar.loadPharData(fs.readFileSync('test.phar'))
    assert.equal(phar.getMetadata(), 'test-metadata')
    assert.equal(phar.getFilesCount(), 1)
    fs.unlinkSync('test.phar')
  })

  it('Remove file from archive', () => {
    phar.removeFile(file.getName())
    assert.equal(phar.getFilesCount(), 0)
    phar.addFile(file)
  })

})

describe('Zip converter', () => {

  it('Phar to zip', async () => {
    const zip = await ZipConverter.toZip(phar)
    const data = await zip.generateAsync({
      type: 'uint8array'
    })
    fs.writeFileSync('test.zip', data)
    assert(data)
  })

  it('Zip to phar', async () => {
    const archive = await ZipConverter.toPhar(fs.readFileSync('test.zip'))
    assert.equal(archive.getFilesCount(), phar.getFilesCount())
  })

  it('Zip to phar with compress', async () => {
    const archive = await ZipConverter.toPhar(fs.readFileSync('test.zip'), Compression.GZ)
    fs.writeFileSync('test.phar', archive.savePharData())
    assert.equal(fs.readFileSync('test.phar').length, 130)
    fs.unlinkSync('test.zip')
    fs.unlinkSync('test.phar')
  })

})
