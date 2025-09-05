const bcrypt = require('bcrypt');

const comparePasswords = async (plainPassword, hashedPassword) => {
  try {
    const match = await bcrypt.compare(plainPassword, hashedPassword);
    return match;
  } catch (err) {
    console.error('Error comparing passwords:', err);
    throw err;
  }
};

module.exports = comparePasswords;
