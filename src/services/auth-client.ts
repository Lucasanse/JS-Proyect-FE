// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    inferAdditionalFields({
      user: {
        rol: { type: "string", input: false },
        idIdioma: { type: "number", required: false },
        cargo: { type: "string", required: false },
        direccion: { type: "string", required: false },
        telefono: { type: "string", required: false },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
