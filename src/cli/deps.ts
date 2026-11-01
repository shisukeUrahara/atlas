/** Everything a command touches from the outside world, so tests can fake it. */
export interface Deps {
  dataDir: string;
  /** GET a URL. Resolves null on 404, throws on other errors. */
  download: (url: string) => Promise<Uint8Array | null>;
  now: () => Date;
  out: (line: string) => void;
  err: (line: string) => void;
}

export type Command = (argv: string[], deps: Deps) => Promise<number>;
