const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000


// for body data parse in the post api formate
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: ['https://jobhunt-89be0.web.app','http://localhost:5173'],
  credentials: true,
}));



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
    // await client.connect();

    const categoryCollection = client.db("job-hunt").collection('job-category');
    const jobsCollection = client.db("job-hunt").collection('add-job');
    const appliedJobs = client.db("job-hunt").collection('applied-jobs');



    // verify token
    const gateman=(req, res, next)=>{
      const token = req?.cookies?.token
      console.log(token);
      if(!token){
          return res.status(401).send({message:'opps unauthorised access'})
      }
      jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
          if(err){
              res.status(401).send({message:' Unauthorised access'})
          }
          // console.log('decoded',decoded);
          req.user = decoded
          next()
      })
  }




    // jwt authentication 
    app.post('/api/access-token', async(req, res)=>{
      // will get user {} from req.body
      const user = req.body;

      // jwt return token thats why we use a variable to store that
     const token = jwt.sign(user,process.env.ACCESS_TOKEN, {expiresIn: '1h'})
     res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

  }).send({success:true})

  })

      app.post('/api/auth/logout', async(req, res) => {
        const user = req.body;
        console.log('log out', user);
        res.clearCookie('token', {maxAge:0, secure:true, sameSite:"none"}).send({ success: true });
      });


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
        // console.log(category);
        const result = await jobsCollection.find(query).toArray();
        res.send(result)
    })

    // get specific job post by id
    app.get('/api/job/:jobid', async(req, res)=>{
      const id = req.params.jobid;
      // console.log(id);
      const query = {_id: new ObjectId(id)}
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })

    // create job post 
    app.post('/api/jobs/category', async(req, res)=>{
      const job = req.body;
      console.log(job);
      const result = await jobsCollection.insertOne(job)
      res.send(result)
    })

    // all applied job POST method
    app.post('/api/jobs/applied', async(req, res)=>{
      const job = req.body;
      const result = await appliedJobs.insertOne(job)
      res.send(result)
      // console.log('applied job',job, result);
    })

    // show Applied job to the user 
    app.get('/api/jobs/applied',gateman, async(req, res)=>{

      console.log(req.query);
      try {
        if(req?.user?.email !== req?.query?.email){
          return res.status(403).send('forbidden access')
        }
        const filter = req.query.sort;
        const email = req.query.email
        const query = {employeeEmail: email}
        if(filter){
          console.log('from filter');
          query.status = filter
        }
        const result = await appliedJobs.find(query).toArray()
        res.send(result)
        
      } catch (error) {
        console.log(error);
      }
    })

    // get user specified job post to show the user
    app.get('/api/jobs/my-posted-jobs',gateman, async(req, res)=>{
      const email = req?.query?.email
      if(req?.user?.email !== email){
        return res.status(403).send('unauthorized access')
      }
      const query = {email : email}
      // console.log(category);
      const result = await jobsCollection.find(query).toArray();
      res.send(result)
  })

  // find user posted job for update
  // get specific job post by id
  app.get('/api/jobs/my-posted-job/update/:id', async(req, res)=>{
    const id = req.params.id;
    // console.log(id);
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.findOne(query)
    res.send(result)
  })

  // update job post using this api
  app.patch('/api/jobs/my-posted-job/update/:id', async(req, res)=>{
    const data = req.body
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const doc ={
      $set:{
            category: data.category,
            description: data.description,
            email: data.email,
            endDate: data.endDate,
            job_title:data.job_title,
            maxPrice: data.maxPrice,
            minPrice: data.minPrice,
            startDate: data.startDate
      }
    }
    const result = await jobsCollection.updateOne(filter, doc)
    res.send(result)
    // console.log(filter, result);
  })

  // delete job post 
  app.delete('/api/jobs/my-posted-job/delete/:id', async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.deleteOne(query)
    res.send(result)
    console.log(result);
  })

  // show bid requests all user except owner of the job post
  app.get('/api/jobs/bid-request',gateman, async(req, res)=>{
    
    const email = req?.query?.email
    if(req?.user?.email !== email){
      return res.status(403).send('unauthorized access')
    }
    const query = {employeeEmail: {$ne: email},authorEmail: email}
    const result = await appliedJobs.find(query).toArray()
    // console.log('request',req.user , email);
    res.send(result)
  })

  // update bid status by owner
  app.patch('/api/jobs/bid-request/:id', async(req, res)=>{
    try {
      const id = req.params.id
    const response = req.body;
    const query = {_id: new ObjectId(id)}
    const doc ={
      $set:{
        status : response.status
      }
    }
    const result = await appliedJobs.updateOne(query, doc)
    res.send( result)
    console.log(result);
      
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  })

  // filter my bids
  app.get('/api/jobs/my-bids', async(req, res)=>{
    const sort = req.query.sort;

    console.log(sort);
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

