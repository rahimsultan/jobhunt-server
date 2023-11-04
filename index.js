const express = require('express')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const app = express()
const port = process.env.PORT || 5000



app.use(cookieParser())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.fvnorwx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const categoryCollection = client.db("job-hunt").collection('job-category');
    const jobsCollection = client.db("job-hunt").collection('add-job');


    // get category data 
    app.get('/api/job-category', async(req, res)=>{
        const result = await categoryCollection.find().toArray();
        res.send(result)
    })
    // get category wise job data data 
    // /api/jobs/category?name=web-development
    app.get('/api/jobs/category', async(req, res)=>{
        const category = req.query.category
        const query = {category : category}
        console.log(category);
        const result = await jobsCollection.find(query).toArray();
        res.send(result)
    })












    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })