import express from "express";
import { products as productsRaw, cartItems as cartItemsRaw } from "./temp-data.js";

const app = express();
let cartItems = cartItemsRaw;
let products = productsRaw;
app.use(express.json());

app.get("/hello", (req, res) => {
  res.send("Hello");
});

app.get("/products", (req, res) => {
  res.json(products);
});

const populatedCartIds = (ids) => {
  return ids.map((id) => products.find((product) => product.id === id));
};
app.get("/cart", (req, res) => {
  const populatedCart = populatedCartIds(cartItems);
  res.json(populatedCart);
});
app.post("/cart", (req, res) => {
  const productId = req.body.id;
  cartItems.push(productId);
  const populatedCart = populatedCartIds(cartItems);
  res.json(populatedCart);
});
app.delete("/cart/:productId", (req, res) => {
  const productId = req.params.productId;
  cartItems = cartItems.filter((id) => id !== productId);
  const populatedCart = populatedCartIds(cartItems);
  res.json(populatedCart);
});

app.get("/products/:productId", (req, res) => {
  const productId = req.params.productId;
  const product = products.find((product) => product.id === productId);
  res.json(product);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
