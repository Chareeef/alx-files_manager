import dbClient from '../utils/db';
import sha1 from 'sha1';

export async function postNew(req, res) {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Missing email' });
    res.end();
    return;
  }
  if (!password) {
    res.status(400).json({ error: 'Missing password' });
    res.end();
    return;
  }

  const user = await dbClient.userExists(email);
  if (user) {
    res.status(400).json({ error: 'Already exist' });
    res.end();
    return;
  }
  const insertInfo = await dbClient.insertOne('users', {
    email,
    password: sha1(password),
  });

  const userID = insertInfo.insertedId.toString();
  res.status(201).json({ id: userID, email: email });
}
