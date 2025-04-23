import dotenv from "dotenv";
import knex from "knex";
import type { Knex } from "knex";

dotenv.config();

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./db/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./db/seeds",
    },
  },
};

export default config;
