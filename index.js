//importacoes das bibliotecas
const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const corsOptions = require("./config/cors");

//inicializando o express na variavel app
const app = express();

// Configuração do CORS
app.use(cors(corsOptions));

// indico ao express que vamos utilizar json
app.use(express.json());

//instaciar um banco (client)

const database = new Client({
  user: "postgres",
  host: "localhost",
  database: "api_simples_db",
  password: "30267098",
  port: 5432,
});

database
  .connect()
  .then(async () => {
    console.log("Conexão com banco de dados realizado com sucesso");

    await database.query(
      `
            CREATE TABLE IF NOT EXISTS clientes (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            telefone VARCHAR(15)
        );
        `
    );

    console.log("Tabelas criadas com sucesso");
  })
  .catch((error) => {
    console.error("Erro ao criar as tabelas", error);
  });

// criando rota do tipo GET
app.get("/clientes", async (req, res) => {
  try {
    const result = await database.query("SELECT * FROM clientes;");

    res.status(200).json({
      message: "Busca feita com sucesso",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
  }
});

// rota POST
app.post("/clientes", async (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email || !telefone) {
    return res
      .status(404)
      .json({ message: "nome, email e telefone é obrigatório" });
  }

  await database.query(
    `
            INSERT INTO clientes (nome, email, telefone) VALUES ($1, $2, $3)
        `,
    [nome, email, telefone]
  );

  res.status(201).json({ message: "Cliente criado com sucesso" });
});

//PUT - atualizando os dados
app.put("/clientes/:id", async (req, res) => {
  const { nome, email, telefone } = req.body;
  const { id } = req.params;

  if ((!nome, !email, !telefone)) {
    res.status(404).json({ message: "Todos os campos são obrigatórios" });
  }

  if (!id) {
    res.status(404).json({ message: "O id é obrigatório" });
  }

  await database.query(
    "UPDATE clientes SET nome=$1, email=$2, telefone=$3 WHERE id=$4",
    [nome, email, telefone, id]
  );

  res.status(200).json({ message: "Cliente atualizado com sucesso" });
});

// iniciando o servidor
app.listen(3008, () => {
  console.log("Servidor rodando na porta 3008");
});
