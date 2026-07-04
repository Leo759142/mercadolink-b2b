const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/pagar', async (req, res) => {
  const { token } = req.body;

  try {
    const response = await axios.post('https://api.culqi.com/v2/charges', {
      amount: 5000, // céntimos
      currency_code: 'PEN',
      email: "Correo" @ "Aspropa.net",
      source_id: token
    }, {
      headers: {
        'Authorization': 'Bearer TU_LLAVE_PRIVADA',
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(400).json(error.response.data);
  }
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
