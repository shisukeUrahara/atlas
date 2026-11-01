/** Everything a command touches from the outside world, so tests can fake it. */
export interface Deps {
  dataDir: string;
  out: (line: string) => void;
  err: (line: string) => void;
}

export type Command = (argv: string[], deps: Deps) => Promise<number>;
