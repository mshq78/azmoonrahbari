/**
 * The serverless entry point imports the built bundle, which does not exist
 * until `npm run build`. Declare its shape so typecheck does not depend on
 * build order.
 */
declare module '*/server/dist/vercel-app.js' {
  import type { RequestListener } from 'node:http';
  const app: RequestListener;
  export default app;
}
