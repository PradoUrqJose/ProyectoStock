import { createClient } from "@libsql/client";

// Inicializamos el cliente de Turso usando las variables secretas del archivo .env.local
export const turso = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});