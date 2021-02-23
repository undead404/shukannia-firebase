import { https, logger } from 'firebase-functions';

import acquireNewFunction from './acquire-new';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// eslint-disable-next-line import/prefer-default-export
export const acquireNew = https.onRequest(async () => {
  logger.debug('Acquire new');
  await acquireNewFunction();
});
