// server.js
const express = require('express');
const cors = require('cors'); // Importar cors
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Usar cors para permitir todas las solicitudes de cualquier origen
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Ruta raíz para confirmar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor Hexo en funcionamiento');
});

// Endpoint para crear un nuevo post
app.post('/create-post', (req, res) => {
  const postTitle = req.body.title;
  if (!postTitle) {
    return res.status(400).send('El título del post es necesario.');
  }

  // Ejecuta el comando 'hexo new'
  exec(`hexo new "${postTitle}"`, { cwd: path.resolve(__dirname, '../blog') }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al crear el post: ${error.message}`);
      return res.status(500).send('Error al crear el post.');
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send('Error al crear el post.');
    }
    console.log(`Resultado: ${stdout}`);
    res.send('Post creado exitosamente.');
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
