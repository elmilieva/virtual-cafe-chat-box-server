import { Router } from "express";
import { AppError } from "../model/errors";
import { UserRepository } from "../dao/mongo-repository";
import * as indicative from "indicative";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { secret } from "../config/secret";
import Credentials from "../model/auth";

const router = Router();

// Auth API Feature
router.post("/login", async (req, res, next) => {
  const db = req.app.locals.db;
  const credentials = req.body as Credentials;
  try {
    await indicative.validator.validate(credentials, {
      username: "required",
      password: "required|string|min:6",
    });
  } catch (err) {
    next(new AppError(400, err.message, err));
    return;
  }
  try {
    const user = await (<UserRepository>req.app.locals.userRepo).findByUsername(
      credentials.username
    );
    if (!user) {
      next(new AppError(401, `Username or password is incorrect.`));
      return;
    }
    const passIsValid = await bcrypt.compare(
      credentials.password,
      user.password
    );
    if (!passIsValid) {
      next(new AppError(401, `Username or password is incorrect.`));
      return;
    }
    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: 3600, //expires in 24 h
    });
    delete user.password;
    ``;
    res.status(200).json({ token, user });
  } catch (err) {
    next(err);
  }
});

export default router;
