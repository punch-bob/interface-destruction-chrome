declare const chrome: { runtime: { getURL(path: string): string } };
declare module "*.css?inline" {
  const css: string;
  export default css;
}
