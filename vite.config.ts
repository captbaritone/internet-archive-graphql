import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import graphiql from "vite-plugin-graphiql";

export default defineConfig({
  plugins: [
    react(),
    graphiql({
      client: {
        url: "https://graphqlzero.almansi.me/api",
      },
    }),
  ],
});
