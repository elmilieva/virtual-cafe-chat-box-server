import { Router } from "express";
import { AppError } from "../model/errors";
import { RoomRepository } from "../dao/mongo-repository";
import * as indicative from "indicative";

const router = Router();
router.get("/", async (req, res, next) => {
  (<RoomRepository>req.app.locals.roomRepo)
    .findAll()
    .then((rooms) => res.json(rooms))
    .catch(next);
});

router.post("/", async (req, res, next) => {
  // validate new room
  const newRoom = req.body;
  try {
    await indicative.validator.validate(newRoom, {
      _id: "regex:^[0-9a-fA-F]{24}$",
      roomName: "required|string|min:2|max:40",
    });
  } catch (err) {
    next(new AppError(400, err.message, err));
    return;
  }
  // create room in db
  try {
    const found = await (<RoomRepository>req.app.locals.roomRepo).findByName(
      newRoom.roomName
    );
    if (found) {
      throw new AppError(400, `Name already taken: '${newRoom.roomName}'.`);
    }

    // Create new room
    const created = await (<RoomRepository>req.app.locals.roomRepo).add(
      newRoom
    );

    res.status(201).location(`/api/rooms/${newRoom.id}`).json(newRoom);
  } catch (err) {
    next(err);
  }
});

export default router;
