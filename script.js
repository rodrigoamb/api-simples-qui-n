async function fetchClientes() {
  try {
    const response = await fetch("http://localhost:3008/clientes");

    const data = await response.json();

    if (response.ok) {
      console.log(data);
    }
  } catch (error) {
    console.error(error);
  }
}

fetchClientes();
