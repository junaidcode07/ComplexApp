const dotenv = require('dotenv')
dotenv.config()
const { MongoClient } = require('mongodb');

// Connection URL
const client = new MongoClient(process.env.CONNECTIONSTRING);

// Database Name
const dbName = 'ComplexApp'
// Use connect method to connect to the server
async function main() {
  
  await client.connect();
  await client.db(dbName).command({ping:1})
  console.log("Connected successfully to server")
  module.exports = client
  const app = require('./app')
  app.listen(process.env.PORT)

  return 'done'
}


main()
  .then(console.log)
  .catch(console.error)
  .finally();