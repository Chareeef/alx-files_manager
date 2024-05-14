import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { ObjectID } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
// const userQueue = new Queue('userQueue');

async function thumbNail(width, localPath) {
  const thumbnail = await imageThumbnail(localPath, { width });
  return thumbnail;
}

fileQueue.process(async (job, done) => {
  console.log('Processing Started!');
  const { fileId } = job.data;
  if (!fileId) {
    done(new Error('Missing fileId'));
  }

  const { userId } = job.data;
  if (!userId) {
    done(new Error('Missing userId'));
  }

  console.log(fileId, userId);
  dbClient.db
    .collection('files')
    .findOne({ _id: new ObjectID(fileId) }, async (err, file) => {
      if (!file) {
        console.log('Not found');
        done(new Error('File not found'));
      } else {
        const fileName = file.localPath;
        const tNail500 = await thumbNail(500, fileName);
        const tNail250 = await thumbNail(250, fileName);
        const tNail100 = await thumbNail(100, fileName);

        console.log('Writing thumbnail files to the system');
        const image500 = `${file.localPath}_500`;
        const image250 = `${file.localPath}_250`;
        const image100 = `${file.localPath}_100`;

        await fs.writeFile(image500, tNail500);
        await fs.writeFile(image250, tNail250);
        await fs.writeFile(image100, tNail100);
        done();
      }
    });
});
