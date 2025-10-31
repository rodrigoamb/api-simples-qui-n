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

    // Criar tabela departamento primeiro (sem dependências)
    await database.query(
      `
            CREATE TABLE IF NOT EXISTS departamento (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            local VARCHAR(100),
            sede VARCHAR(100)
        );

        CREATE TABLE IF NOT EXISTS clientes (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            telefone VARCHAR(15),
            email VARCHAR(100) UNIQUE NOT NULL,
            departamento_id INTEGER REFERENCES departamento(id)
        );

         CREATE TABLE IF NOT EXISTS endereco (
            id SERIAL PRIMARY KEY,
            rua VARCHAR(255) NOT NULL,
            numero VARCHAR(10),
            complemento VARCHAR(100),
            bairro VARCHAR(100),
            cep VARCHAR(10) NOT NULL,
            cidade VARCHAR(100) NOT NULL,
            estado VARCHAR(50) NOT NULL,
            cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE
        );
        `
    );

    console.log("Tabelas criadas com sucesso");
  })
  .catch((error) => {
    console.error("Erro ao criar as tabelas", error);
  });

// criando rota do tipo GET para clientes
app.get("/clientes", async (req, res) => {
  try {
    const result = await database.query(`
      SELECT c.*, d.nome as departamento_nome 
      FROM clientes c 
      LEFT JOIN departamento d ON c.departamento_id = d.id;
    `);

    res.status(200).json({
      message: "Busca feita com sucesso",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

//GET POR ID - TRAZER UM CLIENTE ESPECÍFICO
app.get("/clientes/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  try {
    const result = await database.query(
      `
      SELECT c.*, d.nome as departamento_nome 
      FROM clientes c 
      LEFT JOIN departamento d ON c.departamento_id = d.id 
      WHERE c.id=$1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    res.json({ message: "Busca realizada com sucesso", data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// rota POST para clientes (agora inclui departamento_id)
app.post("/clientes", async (req, res) => {
  const { nome, email, telefone, departamento_id } = req.body;

  if (!nome || !email || !telefone || !departamento_id) {
    return res.status(400).json({
      message: "nome, email, telefone e departamento_id são obrigatórios",
    });
  }

  await database.query(
    `
            INSERT INTO clientes (nome, email, telefone, departamento_id) VALUES ($1, $2, $3, $4)
        `,
    [nome, email, telefone, departamento_id]
  );

  res.status(201).json({ message: "Cliente criado com sucesso" });
});

//PUT - atualizando os dados do cliente
app.put("/clientes/:id", async (req, res) => {
  const { nome, email, telefone, departamento_id } = req.body;
  const { id } = req.params;

  if (!nome || !email || !telefone || !departamento_id) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  await database.query(
    "UPDATE clientes SET nome=$1, email=$2, telefone=$3, departamento_id=$4 WHERE id=$5",
    [nome, email, telefone, departamento_id, id]
  );

  res.status(200).json({ message: "Cliente atualizado com sucesso" });
});

//DELETE - criando a rota para deletar o cliente
app.delete("/clientes/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  await database.query("DELETE FROM clientes WHERE id=$1", [id]);

  res.json({ message: "Cliente deletado com sucesso" });
});

// Rotas para departamento
app.get("/departamentos", async (req, res) => {
  try {
    const result = await database.query("SELECT * FROM departamento;");
    res.status(200).json({
      message: "Busca feita com sucesso",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

app.post("/departamentos", async (req, res) => {
  const { nome, local, sede } = req.body;

  if (!nome) {
    return res.status(400).json({ message: "Nome é obrigatório" });
  }

  await database.query(
    "INSERT INTO departamento (nome, local, sede) VALUES ($1, $2, $3)",
    [nome, local, sede]
  );

  res.status(201).json({ message: "Departamento criado com sucesso" });
});

app.get("/departamentos/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  try {
    const result = await database.query(
      "SELECT * FROM departamento WHERE id=$1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Departamento não encontrado" });
    }

    res.json({ message: "Busca realizada com sucesso", data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

app.put("/departamentos/:id", async (req, res) => {
  const { nome, local, sede } = req.body;
  const { id } = req.params;

  if (!nome) {
    return res.status(400).json({ message: "Nome é obrigatório" });
  }

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  try {
    const result = await database.query(
      "UPDATE departamento SET nome=$1, local=$2, sede=$3 WHERE id=$4",
      [nome, local, sede, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Departamento não encontrado" });
    }

    res.status(200).json({ message: "Departamento atualizado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

app.delete("/departamentos/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  try {
    const result = await database.query(
      "DELETE FROM departamento WHERE id=$1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Departamento não encontrado" });
    }

    res.json({ message: "Departamento deletado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// Rotas para endereco
app.get("/enderecos", async (req, res) => {
  try {
    const result = await database.query(`
      SELECT e.*, c.nome as cliente_nome 
      FROM endereco e 
      LEFT JOIN clientes c ON e.cliente_id = c.id;
    `);
    res.status(200).json({
      message: "Busca feita com sucesso",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

app.post("/enderecos", async (req, res) => {
  const { rua, numero, complemento, bairro, cep, cidade, estado, cliente_id } =
    req.body;

  if (!rua || !cep || !cidade || !estado || !cliente_id) {
    return res.status(400).json({
      message: "rua, cep, cidade, estado e cliente_id são obrigatórios",
    });
  }

  await database.query(
    "INSERT INTO endereco (rua, numero, complemento, bairro, cep, cidade, estado, cliente_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [rua, numero, complemento, bairro, cep, cidade, estado, cliente_id]
  );

  res.status(201).json({ message: "Endereço criado com sucesso" });
});

app.get("/enderecos/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  try {
    const result = await database.query(
      `
      SELECT e.*, c.nome as cliente_nome 
      FROM endereco e 
      LEFT JOIN clientes c ON e.cliente_id = c.id 
      WHERE e.id=$1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Endereço não encontrado" });
    }

    res.json({ message: "Busca realizada com sucesso", data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

app.put("/enderecos/:id", async (req, res) => {
  const { rua, numero, complemento, bairro, cep, cidade, estado, cliente_id } =
    req.body;
  const { id } = req.params;

  if (!rua || !cep || !cidade || !estado || !cliente_id) {
    return res.status(400).json({
      message: "rua, cep, cidade, estado e cliente_id são obrigatórios",
    });
  }

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  try {
    const result = await database.query(
      "UPDATE endereco SET rua=$1, numero=$2, complemento=$3, bairro=$4, cep=$5, cidade=$6, estado=$7, cliente_id=$8 WHERE id=$9",
      [rua, numero, complemento, bairro, cep, cidade, estado, cliente_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Endereço não encontrado" });
    }

    res.status(200).json({ message: "Endereço atualizado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

app.delete("/enderecos/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "O id é obrigatório" });
  }

  try {
    const result = await database.query("DELETE FROM endereco WHERE id=$1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Endereço não encontrado" });
    }

    res.json({ message: "Endereço deletado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// iniciando o servidor
app.listen(3008, () => {
  console.log("Servidor rodando na porta 3008");
});
