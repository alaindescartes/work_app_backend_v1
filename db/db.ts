import knex from "knex";
import { Knex } from "knex";
import config from "../knexfile.js";

const db: Knex = knex(config.development);

export default db;
