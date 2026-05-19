const mongoose = require('mongoose');

const generateTicketCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'KT-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const contributionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pool: { type: mongoose.Schema.Types.ObjectId, ref: 'Pool', required: true },
    amount: { type: Number, required: true },
    ticketCode: { type: String, unique: true }
  },
  { timestamps: true }
);

// 🔧 Fixed — no next(), just return a promise
contributionSchema.pre('save', async function () {
  if (!this.ticketCode) {
    let code;
    let exists = true;
    while (exists) {
      code = generateTicketCode();
      exists = await mongoose.model('Contribution').findOne({ ticketCode: code });
    }
    this.ticketCode = code;
  }
});

module.exports = mongoose.model('Contribution', contributionSchema);