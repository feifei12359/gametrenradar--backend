// Polyfill for Node.js 18 - File API
// This fixes the "File is not defined" error in undici

if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File extends Blob {
    name: string;
    lastModified: number;

    constructor(
      fileBits: BlobPart[],
      fileName: string,
      options?: FilePropertyBag
    ) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options?.lastModified ?? Date.now();
    }
  } as any;
}

// Ensure FormData is available globally
if (typeof globalThis.FormData === 'undefined') {
  const FormData = require('form-data');
  globalThis.FormData = FormData;
}

// Ensure Headers is available globally
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    private headers: Map<string, string> = new Map();

    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value));
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this.set(key, value));
        }
      }
    }

    append(name: string, value: string): void {
      const existing = this.headers.get(name.toLowerCase());
      if (existing) {
        this.headers.set(name.toLowerCase(), `${existing}, ${value}`);
      } else {
        this.headers.set(name.toLowerCase(), value);
      }
    }

    delete(name: string): void {
      this.headers.delete(name.toLowerCase());
    }

    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) || null;
    }

    has(name: string): boolean {
      return this.headers.has(name.toLowerCase());
    }

    set(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value);
    }

    forEach(
      callbackfn: (value: string, key: string, parent: Headers) => void,
      thisArg?: any
    ): void {
      this.headers.forEach((value, key) => {
        callbackfn.call(thisArg, value, key, this);
      });
    }

    entries(): IterableIterator<[string, string]> {
      return this.headers.entries();
    }

    keys(): IterableIterator<string> {
      return this.headers.keys();
    }

    values(): IterableIterator<string> {
      return this.headers.values();
    }

    [Symbol.iterator](): IterableIterator<[string, string]> {
      return this.headers.entries();
    }
  } as any;
}

console.log('Polyfills loaded successfully');
