const express = require("express");
const cors = require("cors");
const colors = require("colors");
require("dotenv").config();
const Auth = require("./middleWeres/Auth");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middle wares : 
app.use(cors());
app.use(express.json());

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const uri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.wfsi327.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function dbConnection() {
    try {
        await client.connect()
        console.log("Database connect".blue)
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
    }
}

dbConnection()

const Categories = client.db("fitnessZone").collection("Categories");
const Users = client.db("fitnessZone").collection("Users");
const Products = client.db("fitnessZone").collection("Products");
const BookingProducts = client.db("fitnessZone").collection("BookingProducts");
const WishListProducts = client.db("fitnessZone").collection("WishListProducts");

const verifyAdmin = async (req, res, next) => {
    const decodedEmail = req?.decoded?.email;
    const query = { email: decodedEmail };
    const user = await Users.findOne(query);

    if (user?.userRole !== 'admin') {
        return res.status(403).send({ message: 'forbidden access' })
    }
    next();
}

app.post('/addUser', async (req, res) => {
    try {
        const userData = req.body;
        const email = userData.email;
        const isAdded = await Users.findOne({ email: email })
        if (isAdded) {
            res.send({
                success: false,
                message: "User already added"
            })
        } else {
            const data = await Users.insertOne(userData)
            if (data.acknowledged) {
                res.send({
                    success: true,
                    message: "Successfully added the user"
                })
            } else {
                res.send({
                    success: false,
                    message: "Couldn't added the user"
                })
            }
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.post("/getToken", async (req, res) => {
    try {
        const { email } = req.body;
        const newEmail = email;
        if (!newEmail) {
            return res.send({
                success: false,
                message: "Please provide email address"
            })
        } else {
            const userEmail = await Users.findOne({ email: newEmail })
            if (!userEmail) {
                return res.send({
                    success: false,
                    message: "Email is doesn't exist"
                })
            } else {
                const tokenObj = {
                    email: newEmail
                }

                // console.log(tokenObj)
                const token = jwt.sign(tokenObj, process.env.ACCESS_TOKEN_SECRET);
                res.send({
                    success: true,
                    message: "Get Token successfully",
                    data: tokenObj,
                    token: token
                })
            }
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.post('/addCategory', Auth, verifyAdmin, async (req, res) => {
    try {
        const categoryData = req.body;
        // console.log(categoryData);
        if (!categoryData) {
            res.send({
                success: false,
                message: "data can not exist"
            })
        }
        const data = await Categories.insertOne(categoryData)
        if (data.acknowledged) {
            res.send({
                success: true,
                message: "data added to Db successfully"
            })
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.post('/addProduct', Auth, async (req, res) => {
    try {
        const productData = req.body;
        if (productData) {
            const data = await Products.insertOne(productData)
            if (data.acknowledged) {
                res.send({
                    success: true,
                    message: "product data added successfully"
                })
            } else {
                res.send({
                    success: false,
                    message: "data can not added to Database"
                })
            }

        } else {
            res.send({
                success: false,
                message: "Can not exist data"
            })

        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.get("/", async (req, res) => {
    try {
        const query = {};
        const data = await Categories.find(query).toArray()
        res.send(data)
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }

})

app.get("/users", async (req, res) => {
    try {
        const query = {};
        const data = await Users.find(query).toArray();
        res.send({
            success: true,
            data: data
        })
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.get("/products", async (req, res) => {
    try {
        const query = {};
        const data = await Products.find(query).toArray()
        res.send(data)
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }

})

app.get("/category/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)

        if (id) {
            const data = await Products.find({ categoryId: id }).toArray();
            // console.log(data)
            res.send({
                success: true,
                products: data
            })
        } else {
            console.log("does not exist categoryId")
            res.send({
                success: false,
                message: "categoryId does not define"
            })
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.get("/product/:id", Auth, async (req, res) => {
    try {
        const { id } = req.params;
        const query = {
            _id: new ObjectId(id)
        }

        if (id) {
            const data = await Products.findOne(query);
            // console.log(data)
            res.send({
                success: true,
                products: data
            })
        } else {
            console.log("does not exist categoryId")
            res.send({
                success: false,
                message: "categoryId does not define"
            })
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.patch("/verifyUser", Auth, verifyAdmin, async (req, res) => {
    try {
        const email = req?.query?.email;
        const query = {
            email: email
        }
        const result = await Users.updateOne(query, {
            $set: {
                verified: true
            }
        })
        if (result.matchedCount) {
            res.send({
                success: true,
                message: "Successfully verified updated"
            })
        } else {
            res.send({
                success: false,
                message: "Couldn't update"
            })
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.delete("/deleteUser", Auth, verifyAdmin, async (req, res) => {
    try {
        const email = req?.query?.email;
        const query = {
            email: email
        }
        const result = await Users.deleteOne(query)
        // console.log(result);
        res.send(result)
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.patch("/addAdmin", Auth, verifyAdmin, async (req, res) => {
    try {
        const adminNewEmail = req?.query?.email;
        const query = {
            email: adminNewEmail
        }
        const isUser = await Users.findOne(query)
        if (isUser) {
            const result = await Users.updateOne(query, {
                $set: {
                    userRole: "admin",
                    verified: true
                }
            })
            if (result.matchedCount) {
                res.send({
                    success: true,
                    message: `${adminNewEmail} is updated for new admin`
                })
            }
        } else {
            res.send({
                success: false,
                message: `${adminNewEmail} is could not exist to User Collection`
            })
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.patch("/addAdvertisement", Auth, async (req, res) => {
    try {
        const id = req?.query?.id;

        const productId = {
            _id: new ObjectId(id)
        }
        const isAdded = await Products.findOne(productId)

        if (isAdded) {
            const result = await Products.updateOne(productId, {
                $set: {
                    advertisement: true,
                }
            })
            if (result.matchedCount) {
                res.send({
                    success: true,
                    message: `${id} is updated for advertisement`
                })
            }
        } else {
            res.send({
                success: false,
                message: "This product can't exist products collection"
            })
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.delete("/deleteProduct", Auth, async (req, res) => {
    try {
        const id = req?.query?.id;
        const filter = {
            _id: new ObjectId(id)
        };
        const result = await Products.deleteOne(filter);
        console.log(result);
        if (result.deletedCount) {
            res.send({
                success: true,
                message: `${id} this product is deleted`
            });
        } else {
            res.send({
                success: false,
                message: `${id} this product can't delete successfully`
            })
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error?.message
        })
    }
})

app.listen(port, () => {
    console.log(`This server running port on ${port}`);
})