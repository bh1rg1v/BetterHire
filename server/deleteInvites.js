require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('managerinvites').deleteMany({});
  console.log('Deleted all manager invites');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
