import { Router } from "express";
import { AppError } from "../model/errors";

const router = Router();
router.get("/", async (req, res, next) => {
  const io = req.app.locals.io;
  io.on("connection", function (socket) {
    console.log("Client connected: " + socket.id);
    socket.on("chat message", function (msg) {
      console.log("Message received: " + msg);
      io.emit("chat message", msg);
    });
  });
  res.json("YAY");
  try {
    await console.log(2);
  } catch (err) {
    next(new AppError(400, err.message, err));
    return;
  }
});

export default router;
