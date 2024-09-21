const express = require('express');
const cors = require('cors');
const path = require('path');
const Hexo = require('hexo');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Función para sanitizar el título del post
const sanitizeTitle = title => {
  return title.replace(/[^a-zA-Z0-9_-]/g, '');
};

// Ruta de prueba para verificar el servidor
app.get('/', (req, res) => {
  res.send('Servidor Hexo en funcionamiento');
});

// Endpoint para crear un nuevo post
app.post('/create-post', (req, res) => {
  let postTitle = req.body.title;

  if (!postTitle) {
    return res.status(400).send('El título del post es necesario.');
  }

  postTitle = sanitizeTitle(postTitle);

  if (postTitle.length > 100) {
    return res.status(400).send('El título es demasiado largo.');
  }

  const hexo = new Hexo(path.resolve(__dirname, '../blog'), {
    silent: false
  });

  hexo.init().then(() => {
    return hexo.call('new', {_: ['post', postTitle]});
  }).then(() => {
    res.send('Post creado exitosamente.');
  }).catch(err => {
    console.error(err);
    res.status(500).send('Error al crear el post: ' + err.message);
  }).finally(() => {
    hexo.exit();
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
