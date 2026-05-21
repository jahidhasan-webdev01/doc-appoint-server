const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

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

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyJWTToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorize" })
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
        return res.status(401).json({ message: "Unauthorize" })
    }

    try {
        const { payload } = await jwtVerify(token, JWKS)
        next()
    } catch (error) {
        return res.status(403).json({ message: "Forbidden" })
    }
}

async function run() {
    try {
        // await client.connect();

        const db = client.db('doc-appoints');
        const doctorsCollection = db.collection('doctors');
        const appointmentsCollection = db.collection('appointments');

        // Get all doctors
        app.get("/doctors", async (req, res) => {
            const data = await doctorsCollection.find().toArray()

            res.send(data);
        })

        // Get a doctor by ID
        app.get("/doctor/:id", verifyJWTToken, async (req, res) => {
            const { id } = req.params;
            const data = await doctorsCollection.findOne({ _id: new ObjectId(id) });

            res.send(data)
        })

        // Get top rated doctors
        app.get("/top-doctors", async (req, res) => {
            const data = await doctorsCollection.find().sort({ rating: -1 }).limit(3).toArray()

            res.send(data)
        })

        // Book an appointment
        app.post("/appointments", verifyJWTToken, async (req, res) => {
            const data = req.body;
            const result = await appointmentsCollection.insertOne(data)

            res.send(result);
        })

        // Get all booking appointments by email
        app.get("/appointments/:email", verifyJWTToken, async (req, res) => {
            const { email } = req.params;
            const data = await appointmentsCollection.find({ userEmail: email }).toArray();

            res.send(data)
        })

        // Delete appointment by ID
        app.delete("/appointment/:id", verifyJWTToken, async (req, res) => {
            const { id } = req.params;
            const result = await appointmentsCollection.deleteOne({ _id: new ObjectId(id) })

            res.send(result)
        })

        // Update appoinment by ID
        app.patch("/appointment/:id", verifyJWTToken, async (req, res) => {
            const { id } = req.params;
            const updatedData = req.body;
            const result = await appointmentsCollection.updateOne({ _id: new ObjectId(id) }, {
                $set: updatedData
            })

            res.send(result)
        })

        // Give rating to doctor
        app.patch("/give-rating/:doctorName", verifyJWTToken, async (req, res) => {
            const { doctorName } = req.params;
            const { rating } = req.body;

            const doctor = await doctorsCollection.findOne({
                name: doctorName
            });

            const updatedRating = (doctor.rating + rating) / 2;

            const result = await doctorsCollection.updateOne(
                { name: doctorName },
                {
                    $set: {
                        rating: updatedRating
                    }
                }
            );

            res.send(result);
        });


        // await client.db("admin").command({ ping: 1 });
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