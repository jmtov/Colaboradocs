declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    TOKEN_SECRET: string;
  }
}

declare module '*.sql?raw' {
  const sql: string;
  export default sql;
}
