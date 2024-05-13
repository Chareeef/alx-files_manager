import dbClient from '../utils/db';

export default function waitConnection() {
  return new Promise((resolve, reject) => {
    let i = 0;
    const repeatFct = async () => {
      await setTimeout(() => {
        i += 1;
        if (i >= 10) {
          reject();
        } else if (!dbClient.isAlive()) {
          repeatFct();
        } else {
          resolve();
        }
      }, 1000);
    };
    repeatFct();
  });
}
