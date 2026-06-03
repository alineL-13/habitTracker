import pg from "pg";
import dotenv from "dotenv";

dotenv.config(); //Le o .env e coloca as variáveis dentro de process.env.

const {Pool} = pg; //pega a classe Pool do pg, que gerencia várias conexões automaticamente

export const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING
}) //cria a conexão

