declare module '*.mjs' {
  export function findForbiddenCharacters(root: string): Promise<string[]>;
}
