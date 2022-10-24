import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());
import dotenv from "dotenv";

const port = 4000;

dotenv.config();
const SECRET = process.env.SECRET!;

const prisma = new PrismaClient();
// { log: ["error", "info", "query", "warn"] }

function generateToken(id: number) {
  return jwt.sign({ id }, SECRET);
}
app.get("/users",async(req,res)=>{
const users = prisma.user.findMany()
res.send(users)
})
app.listen(port, () => {
    console.log(`App running: http://localhost:${port}`);
  });