import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
//comment
const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());

const prisma = new PrismaClient();

const port = 4167;

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

app.get("/", (req, res) => {
  res.send(`<h1>Online Courses</h1>
  <h2>Available resources:</h2>
  <ul>
    <li><a href="/users">Users</a></li>
    <li><a href="/instructors">Instructors</a></li>
    <li><a href="/courses/">Courses</a></li>
    <li><a href="/categories/">Categories</a></li>
    <li><a href="/reviews/">Reviews</a></li>
  </ul>`);
});

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.send(users);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/instructors", async (req, res) => {
  try {
    const instructors = await prisma.instructor.findMany();
    res.send(instructors);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
//test
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
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password),
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
//test
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
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.send(users);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/instructors", async (req, res) => {
  try {
    const instructors = await prisma.instructor.findMany();
    res.send(instructors);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/courses", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: true,
        reviews: true,
      },
    });
    res.send(courses);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/course/:id", async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        reviews: { include: { user: true } },
      },
    });
    if (course) {
      res.send(course);
    } else {
      res.send(404).send({ error: "Course not Found!" });
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/categories", async (req, res) => {
  try {
    const catogories = await prisma.category.findMany({
      include: { courses: true },
    });
    res.send(catogories);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/categories/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const category = await prisma.category.findUnique({
      where: { id: id },
      include: { courses: true },
    });

    if (category) {
      res.send(category);
    } else {
      res.status(400).send({ error: "Category not Found!" });
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});
app.get("/search/:course", async (req, res) => {
  // @ts-ignore
  const title = req.params.title;
  const results = await prisma.course.findMany({
    where: { title: { contains: title } },
  });
  res.send(results);
});

app.get("/reviews", async (req, res) => {
  try {
    const review = await prisma.review.findMany({
      include: { user: true },
    });
    res.send(review);
  } catch (error) {
    // @ts-ignore
    res.status(404).send({ error: error.message });
  }
});

app.post("/review", async (req, res) => {
  try {
    const review = {
      courseId: req.body.courseId,
      userId: req.body.userId,
      review: req.body.review,
    };
    const newReview = await prisma.review.create({
      data: {
        courseId: review.courseId,
        userId: review.userId,
        review: review.review,
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: req.body.courseId },
      include: {
        instructor: true,
        reviews: { include: { user: true } },
      },
    });
    res.send(course);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.post("/cartItem", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      res.status(401).send({ errors: ["No token provided."] });
      return;
    }
    const user = await getCurrentUser(token);
    if (!user) {
      res.status(401).send({ errors: ["Invalid token provided."] });
      return;
    }
    const data = {
      userId: user.id,
      courseId: req.body.courseId,
    };

    let errors: string[] = [];
    const course = await prisma.course.findUnique({
      where: { id: Number(data.courseId) },
    });

    if (!course) {
      res.status(404).send({ errors: ["Course not found"] });
      return;
    }
    if (typeof data.userId !== "number") {
      errors.push("UserId not provided or not a number");
    }
    if (typeof data.courseId !== "number") {
      errors.push("CourseId not provided or not a number");
      return;
    }
    if (errors.length === 0) {
      const cartItem = await prisma.cartItem.create({
        data: {
          userId: data.userId,
          courseId: data.courseId,
        },
        include: { course: true },
      });
      res.send(cartItem);
    } else {
      res.status(400).send({ errors });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});

app.get("/cartItems", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(404).send({ errors: ["Token not found"] });
      return;
    }
    const user = await getCurrentUser(token);
    if (!user) {
      res.status(404).send({ errors: ["Invalid token"] });
      return;
    }
    res.send(user.cart);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});

app.delete("/cartItem/:id", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(404).send({ errors: ["Token not found"] });
      return;
    }
    const user = await getCurrentUser(token);
    if (!user) {
      res.status(404).send({ errors: ["Invalid token provided"] });
      return;
    }
    const id = Number(req.params.id);
    if (!id) {
      res
        .status(400)
        .send({ errors: ["CartItem with this id does not exist"] });
      return;
    }
    const cartItem = await prisma.cartItem.delete({
      where: { id },
      include: { course: true },
    });
    if (!cartItem) {
      res.status(404).send({ errors: ["Cart item not found"] });
      return;
    }
    res.send(user.cart);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});

app.post("/buy", async (req, res) => {
  // 1. Get the user from the token
  try {
    const token = req.headers.authorization;
    if (token) {
      const user = await getCurrentUser(token);
      if (!user) {
        res.status(400).send({ errors: ["Invalid token"] });
      } else {
        //2. Calculate the total from the cart
        let total = 0;

        for (let item of user.cart) {
          total += item.course.price;
        }

        //3. If the user has enough balance buy every course
        if (total < user.balance) {
          //4. Create a boughtCourse and delete the cartItem for each course in the cart

          for (let item of user.cart) {
            await prisma.boughtCourse.create({
              data: {
                userId: item.userId,
                courseId: item.courseId,
              },
            });

            await prisma.cartItem.delete({ where: { id: item.id } });
          }
          await prisma.user.update({
            where: { id: user.id },
            data: {
              balance: user.balance - total,
            },
          });
          res.send({ message: "Order successful!" });
        } else {
          res.status(400).send({ errors: ["You're broke"] });
        }
      }
    } else {
      res.status(400).send({ errors: ["Token not found"] });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ errors: [error.message] });
  }
});

app.listen(port, () => {
  console.log(`App running: http://localhost:${port}`);
});
