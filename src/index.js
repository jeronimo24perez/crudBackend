import express from "express"
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import dns from 'node:dns/promises'
import cors from 'cors'
import e from "express";

//begin

dns.setServers(["1.1.1.1", "8.8.8.8"]);

//connect
const uri = "mongodb+srv://jeronimo24perez:demar@back.dgejetl.mongodb.net/?appName=back";
let taskCollection;
const app = express()
const port = 3000
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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    const tasks= client.db('tasks')
    taskCollection =  tasks.collection('tasks')

    console.log("succesfull connection");

    const port = 8080
      app.listen(port)
      console.log(`app running on port ${port}`)
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);


//app



app.use(cors({
  origin: "*"
}))
app.use(express.json());


//routes


//create user

app.post('/', async (req, res) =>{
  const data = req.body;
  if(data.email && data.password){
    const user = await taskCollection.insertOne({
        "user": {
          "username": data.username,
          "email": data.email,
          "password": data.password
        },
        "tasks": []
  })
  return res.status(200).send(user)

  }else{
    return res.status(400).send("Faltan campos")
  }

})
// find all users
app.get('/',async  (req, res) => {
    res.status(200).send(await taskCollection.find().toArray())
})

//read user
app.get('/:id', async (req, res)=>{
    const id = req.params.id;
    if(!ObjectId.isValid(id)){
        return res.status(404).send("id invalido")
    }
    const tasker = await taskCollection.findOne({"_id": new ObjectId(id)})
    if(!tasker){
      return  res.status(404).send("usuario no encontrado")
    }
    return res.status(200).send(tasker)
})


// Create task
app.post('/:id', async (req, res)=>{
    const data = req.body;
    const id = req.params.id
    if(data.title && data.date && data.theme){
        const tasker = await taskCollection.findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$push: {tasks: {
                taskId: new ObjectId(),
                title: data.title,
                date: data.date,
                theme: data.theme
            }}},
               { returnDocument: "after" }
            
        )
        return res.status(200).send(tasker)
    }

    return res.status(404).send("No se enviaron los campos requeridos")
})
// Read task
app.get('/:id/:taskId', async (req,res, next)=>{
    const id = req.params.id;
    const taskId = new ObjectId( req.params.taskId)
    if(!ObjectId.isValid(id)){
        return res.status(404).send("id invalido")
    }
    const tasker = await taskCollection.findOne({"_id": new ObjectId(id)})
    if(!tasker){
      return  res.status(404).send("usuario no encontrado")
    }
    let count = 0;
    let task;
    if(tasker.tasks.length > 0){
    tasker.tasks.map(e => {
          if(e.taskId.toString() === taskId.toString()){
              count = 1;
              task = e;
          }         
        
      })
      if(count === 1){
        return res.status(200).send(task)
      }else{
        return res.status(404).send("tarea no encontrada")
      }
    }else{
      return res.status(404).send("No hay tareas")
    }
  
})

// Update Task
app.put('/:id/:taskId', async (req, res) => {
  const data = req.body
  const id = req.params.id
  const taskId= req.params.taskId
  if(data.title && data.date && data.theme){
 const tasker = await taskCollection.findOneAndUpdate(
    {_id: new ObjectId(id),
      "tasks.taskId": new ObjectId(taskId) 
    },
    {
      $set: {
        "tasks.$.title": data.title,
        "tasks.$.description": data.description,
        "tasks.$.date": data.date,
        "tasks.$.theme": data.theme  
      }
      
    },
     {
    returnDocument: "after" // 
  }
  )
  return res.status(200).send(tasker)
  }else{
    return res.status(404).send("No enviados los campos requeridos")
  }
 

});

// delete task

app.delete('/:id/:taskId', async (req,res)=>{
    const id = req.params.id;
    const taskId = new ObjectId( req.params.taskId)
    if(!ObjectId.isValid(id)){
        return res.status(404).send("id invalido")
    }
    const tasker = await taskCollection.findOne({"_id": new ObjectId(id)})
    if(!tasker){
      return  res.status(404).send("usuario no encontrado")
    }
    let count = 0;
    let task;
    tasker.tasks.map(e => {
         if(e.taskId.toString() === taskId.toString()){
            count = 1;
            task = e;
        }       
    })
    if(count === 0){
            return res.status(404).send("tarea no encontrada")
        }
    if(task){
    const taskUpdate = await taskCollection.findOneAndUpdate(
        {"_id": new ObjectId(id)}, 
        {$pull: {
            tasks: {
                taskId: new ObjectId(taskId)
            }
        }}
)
    return res.status(200).send(taskUpdate)
    }

    return res.status(404).send("algo fallo")
})


//404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada"
  });
});
