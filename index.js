'use strict';
var envJSON = require('./.settings/env.variables.json');

/******************************************************************************
 *Imports dependencies and set up http server                                 *
 * Este código crea un servidor HTTP que recibe las solicitudes en el puerto  *
 * predeterminado o, si este no existe, en el 1337. En esta guía, usamos      *
 * Express, un marco de HTTP popular y sencillo, pero puedes usar cualquiera  *
 * que te guste para crear el webhook.                                        *
 ******************************************************************************/
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening\n'));

/******************************************************************************
 *Creates the endpoint for our webhook                                        *
 * Este código crea un extremo /webhook que acepta solicitudes POST, verifica *
 * que estas sean un evento de webhook y luego analiza el mensaje. La plata-  *
 * forma de Messenger enviará todos los eventos de webhook a este extremo.    *
 *                                                                            *
 * Ten en cuenta que el extremo devuelve una respuesta 200OK, la cual le indi-*
 * ca a la plataforma de Messenger que se recibió el evento y que no tiene que*
 * volver a enviarlo. Normalmente, no enviarás esta respuesta hasta que hayas *
 * completado el procesamiento del evento.                                    *
 ******************************************************************************/
app.post('/webhook', (req, res) => {

  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED\n');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

/******************************************************************************
 *Adds support for GET requests to our webhook                                *
 * volver a enviarlo. Normalmente, no enviarás esta respuesta hasta que hayas *
 * Este código agrega compatibilidad al webhook para su verificación por parte*
 * de la plataforma de Messenger. Esto es obligatorio para garantizar que el  *
 * webhook sea auténtico y que funcione.                                      *
 *                                                                            *
 *El proceso de verificación tiene el siguiente aspecto:                      *
 *                                                                            *
 *  1- Creas un token de verificación. Esta es una cadena aleatoria de tu e-  *
 *     leción, codificada de forma rígida en el webhook.                      *
 *  2- Proporcionas el token de verificación a la plataforma de Messenger cu- *
 *     ando suscribes el webhook para recibir los eventos para una aplicación.*
 *  3- La plataforma de Messenger envía una solicitud GET al webhook con el   *
 *     token en el parámetro hub.verify de la cadena de consulta.             *
 *  4- Verificas que el token enviado coincida con el de verificación y res-  *
 *     pondes con el parámetro hub.challenge de la solicitud.                 *
 *  5- La plataforma de Messenger suscribe el webhook a la aplicación.        *
 ******************************************************************************/
app.get('/webhook', (req, res) => {

  // 1- Your verify token. Should be a random string.
  let VERIFY_TOKEN = envJSON.development.VERIFY_TOKEN

  // 2- Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // 3- Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // 4- Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // 4.1- Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED\n');
      res.status(200).send(challenge);

    } else {
      // 4.2- Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

/* TEST
 *
 * curl -X GET "localhost:1337/webhook?hub.verify_token=EAAUxHVVusdABAKBa51ei4TXdP6vZCNK3n2sr3Kij8QVf7XhHc2q6aZCWvdUc0t7JNPcrD0kzRHqihxUlfbUQukMVBIAfYdZC5DBv0DZB2d7F7c474Vt9VU4sahdqk5QzFxOFmHLfkgpJTV5gx5FKz1QUMnbsdcXTC69msZAf6IwZDZD&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe"
 * curl -H "Content-Type: application/json" -X POST "localhost:1337/webhook" -d '{"object": "page", "entry": [{"messaging": [{"message": "TEST_MESSAGE"}]}]}'
 */
