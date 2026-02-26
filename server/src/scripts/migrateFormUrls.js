const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const Form = require('../models/Form');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const forms = await Form.find({ formUrl: { $exists: false } });
  console.log(`Found ${forms.length} forms without formUrl`);

  for (const form of forms) {
    const formUrl = crypto.randomBytes(8).toString('hex');
    form.formUrl = formUrl;
    await form.save();
    console.log(`Updated form ${form._id} with formUrl: ${formUrl}`);
  }

  console.log('Migration complete');
  await mongoose.disconnect();
}

migrate().catch(console.error);
