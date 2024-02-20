import express from "express";
import { MongoClient } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

async function start() {
  const url = process.env.MONGODB_URL;
  const client = new MongoClient(url);

  //   general
  await client.connect();
  const db = client.db("chilaiadima");

  const app = express();
  app.use(express.json());

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const img = app.use("/images", express.static(path.join(__dirname, "../assets")));
  app.get("/api/products", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;

    const products = await db.collection("products").find({}).skip(skip).limit(limit).toArray();
    res.send(products);
  });

  const populatedCartIds = async (ids) => {
    const validIds = ids.filter((id) => id != null);
    const products = await Promise.all(
      validIds.map(async (id) => {
        const product = await db.collection("products").findOne({ id: String(id) });
        if (!product) {
          console.log(`Product with ID ${id} not found`);
        }
        return product;
      })
    );

    return products.filter((product) => product != null);
  };

  app.get("/api/users/:userId/cart", async (req, res) => {
    const user = await db.collection("users").findOne({ id: req.params.userId });
    const populatedCart = await populatedCartIds(user.cartItems);
    res.json(populatedCart);
  });
  app.put("/api/products/:productId", async (req, res) => {
    const productId = req.params.productId;
    const updatedProductData = req.body;

    const result = await db.collection("products").updateOne({ id: productId }, { $set: updatedProductData });

    if (result.matchedCount === 0) {
      res.status(404).json({ error: "Product not found" });
    } else {
      // Return the updated product data
      const updatedProduct = await db.collection("products").findOne({ id: productId });
      res.json(updatedProduct);
    }
  });

  app.post("/api/products", async (req, res) => {
    const newProduct = req.body;
    await db.collection("products").insertOne(newProduct);
    res.status(201).json(newProduct);
  });

  app.post("/api/users/:userId/cart", async (req, res) => {
    const userId = req.params.userId;
    const productId = req.body.id;
    await db.collection("users").updateOne({ id: userId }, { $addToSet: { cartItems: productId } });

    const user = await db.collection("users").findOne({ id: req.params.userId });
    const populatedCart = await populatedCartIds(user.cartItems);
    res.json(populatedCart);
  });

  app.delete("/api/users/:userId/cart/:productId", async (req, res) => {
    const userId = req.params.userId;
    const productId = req.params.productId;

    await db.collection("users").updateOne({ id: userId }, { $pull: { cartItems: productId } });

    const user = await db.collection("users").findOne({ id: req.params.userId });
    const populatedCart = await populatedCartIds(user.cartItems);
    res.json(populatedCart);
  });

  app.get("/api/products/:productId", async (req, res) => {
    const productId = req.params.productId;
    const product = await db.collection("products").findOne({ id: productId });
    res.json(product);
  });

  app.listen(8000, () => {
    console.log("Server is running on port 8000");
  });
}

start();
