import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());

const prisma = new PrismaClient();

const port = 4166;

const SECRET = "ABC";

function getToken(id: number) {
  return jwt.sign({ id: id }, SECRET, {
    expiresIn: "15 days",
  });
}
async function getCurrentUser(token: string) {
  // @ts-ignore
  const { id } = jwt.verify(token, SECRET);
  const user = await prisma.user.findUnique({ where: { id: id } });
  return user;
}
async function getCurrentInstructor(token: string) {
  // @ts-ignore
  const { id } = jwt.verify(token, SECRET);
  const instructor = await prisma.instructor.findUnique({ where: { id: id } });
  return instructor;
}

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.send(users);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.post("/sign-up/user", async (req, res) => {
  try {
    const match = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (match) {
      res.status(400).send({ error: "This account already exist!" });
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: req.body.name,
          lastName: req.body.lastName,
          profilePic: req.body.profilePic,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 10),
        },
      });
      res.send({ newUser: newUser, token: getToken(newUser.id) });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});
app.post("/sign-up/instructor", async (req, res) => {
  try {
    const match = await prisma.instructor.findUnique({
      where: { email: req.body.email },
    });
    if (match) {
      res.status(400).send({ error: "This account already exist!" });
    } else {
      const newInstructor = await prisma.instructor.create({
        data: {
          name: req.body.name,
          lastName: req.body.lastName,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password),
        },
      });
      res.send({
        newInstructor: newInstructor,
        token: getToken(newInstructor.id),
      });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});
app.post("/sign-in/user", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.send({ user: user, token: getToken(user.id) });
    } else {
      res.status(400).send({ message: "Invalid email/password" });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});
app.post("/sign-in/instructor", async (req, res) => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { email: req.body.email },
    });
    if (
      instructor &&
      bcrypt.compareSync(req.body.password, instructor.password)
    ) {
      res.send({ instructor: instructor, token: getToken(instructor.id) });
    } else {
      res.status(400).send({ message: "Invalid email/password" });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: [error.message] });
  }
});

app.get("/validate/user", async (req, res) => {
  try {
    if (req.headers.authorization) {
      const user = await getCurrentUser(req.headers.authorization);
      // @ts-ignore
      res.send({ user, token: getToken(user.id) });
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/validate/instructor", async (req, res) => {
  try {
    if (req.headers.authorization) {
      const instructor = await getCurrentInstructor(req.headers.authorization);
      // @ts-ignore
      res.send({ instructor, token: getToken(instructor.id) });
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.listen(port, () => {
  console.log(`App running: http://localhost:${port}`);
});
