const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port = process.env.PORT || 8000;

// middlewares
const cors = require("cors");

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.DB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const db = client.db('doc-appoints');
        const doctorsCollection = db.collection('doctors');

        // Get all doctors
        app.get("/doctors", async (req, res) => {
            const data = await doctorsCollection.find().toArray()

            res.send(data);
        })

        // Get a doctor by ID
        app.get("/doctor/:id", async (req, res) => {
            const { id } = req.params;
            const data = await doctorsCollection.findOne({ _id: new ObjectId(id) });

            res.send(data)
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
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