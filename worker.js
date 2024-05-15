import Queue from 'bull';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import { ObjectID } from 'mongodb';
import dbClient from './utils/db';

// Creat file Bull Queue for image processing
const fileQueue = new Queue('fileQueue');

// Create a Bull Queue to welcome users
const userQueue = new Queue('userQueue');

async function thumbNail(width, localPath) {
  return imageThumbnail(localPath, { width });
}

// Process fileQueue's jobs
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

// Process userQueue's jobs
userQueue.process(async (job, done) => {
  // Check that userId is present in the job
  if (!job.data.userId) {
    return done(new Error('Missing userId'));
  }

  // Search user in DB
  const user = await dbClient.findOne('users', { _id: new ObjectID(job.data.userId) });

  // Fail the job if the user was not found
  if (!user) {
    return done(new Error('User not found'));
  }

  // Welcome the user
  console.log(`Welcome ${user.email}`);

  // Complete the job
  return done();
});

// Show error if a job failed
userQueue.on('failed', (job, err) => {
  console.log(`Error: ${err.message}`);
});
