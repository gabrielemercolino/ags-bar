export type Descriptor<T> = {
  parseParams: (raw: any) => T
  parseCss: (raw: any) => Record<string, string>
}
