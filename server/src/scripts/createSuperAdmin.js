/**
 * Seed script to create a SuperAdmin user
 * Run: node server/src/scripts/createSuperAdmin.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'superadmin@betterhire.com';
    const password = 'SuperAdmin123!';
    const username = 'superadmin';
    const name = 'Super Admin';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Super admin already exists:', email);
      process.exit(0);
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      username,
      email,
      passwordHash,
      name,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
    });

    console.log('✅ Super admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Username:', username);
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating super admin:', err);
    process.exit(1);
  }
}

createSuperAdmin();
