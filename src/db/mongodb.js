const mongoose = require('mongoose');
// mongoose.set('useFindAndModify', false);
mongoose.set('strictQuery', false);
mongoose.connect(
  `mongodb://${process.env.MONGO_DB_URL}:${process.env.MONGO_DB_PORT}/${process.env.MONGO_DB_DATABASE}`,
  {
    user: process.env.MONGO_DB_USER,
    pass: process.env.MONGO_DB_PASSWORD,
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
    // socketTimeoutMS: 300000,
  }
);

const db = mongoose.connection;

// db.products.createIndex( { name: "text", description: "text" } )

db.once('open', () => {
  console.log('Connected To MongoDB');
});

db.on('error', (error) => {
  console.log(error);
});

module.exports = mongoose;
