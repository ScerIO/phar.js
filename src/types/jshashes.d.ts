declare module 'jshashes' {
  class Hash {
    constructor(options?: Hashoptions)
    raw(data: string): string
  }

  interface Hashoptions {
    utf8: boolean
  }

  export class MD5 extends Hash { }

  export class SHA1 extends Hash { }

  export class SHA256 extends Hash { }

  export class SHA512 extends Hash { }
}
