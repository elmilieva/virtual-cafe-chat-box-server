import { Indentifiable, IdType, ResourceType } from "../model/shared-types";
import { Db, ObjectID } from "mongodb";
import { Repository } from "./repository";
import { AppError } from "../model/errors";
import { User } from "../model/user.model";
import { Product } from "../model/product.model";
import { Room } from "../model/room.model";

export class MongoRepository<T extends Indentifiable> implements Repository<T> {
  constructor(
    public entityType: ResourceType<T>,
    public db: Db,
    public collection: string
  ) {}

  async add(entity: T) {
    entity._id = undefined;
    const res = await this.db.collection(this.collection).insertOne(entity);
    if (res.result.ok && res.insertedCount === 1) {
      entity._id = res.insertedId;
      console.log(
        `Created new ${this.entityType.typeId}: ${JSON.stringify(entity)}`
      );
      return entity;
    }
    throw new AppError(
      500,
      `Error inserting ${this.entityType.typeId}: "${JSON.stringify(entity)}"`
    );
  }
  async edit(entity: T): Promise<T> {
    if (!entity._id) {
      throw new AppError(
        400,
        `${this.entityType.typeId} ID can not be undefined.`
      );
    }
    const found = await this.findById(entity._id);
    if (!found) {
      throw new AppError(
        404,
        `${this.entityType.typeId} ID="${entity._id} does not exist and can not be modified.`
      );
    }
    // update by _id
    var myquery = { _id: new ObjectID(entity._id) };
    var newvalues = { $set: entity };
    const updateRes = await this.db
      .collection(this.collection)
      .updateOne(myquery, newvalues);
    if (updateRes.result.ok && updateRes.modifiedCount === 1) {
      console.log(
        `${this.entityType.typeId} successfully updated: ${JSON.stringify(
          entity
        )}`
      );
      return entity;
    }
    throw new AppError(
      500,
      `Error inserting ${this.entityType.typeId}: "${JSON.stringify(entity)}"`
    );
  }
  async deleteById(id: IdType): Promise<T> {
    const found = await this.findById(id);
    if (!found) {
      throw new AppError(
        404,
        `${this.entityType.typeId} ID="${id} does not exist and can not be modified.`
      );
    }
    const res = await this.db
      .collection(this.collection)
      .deleteOne({ _id: new ObjectID(id) });
    if (res.result.ok && res.deletedCount === 1) {
      console.log(
        `Deleted ${this.entityType.typeId}: ${JSON.stringify(found)}`
      );
      return found;
    }
    throw new AppError(
      500,
      `Error inserting ${this.entityType.typeId}: "${JSON.stringify(found)}"`
    );
  }
  async findAll(): Promise<T[]> {
    return this.db.collection(this.collection).find<T>().toArray();
  }
  async findById(id: IdType): Promise<T> {
    try {
      return await this.db
        .collection(this.collection)
        .findOne({ _id: new ObjectID(id) });
    } catch (err) {
      throw new AppError(404, err.message);
    }
  }

  async getCount(): Promise<number> {
    return this.db.collection(this.collection).count();
  }
}

export class UserRepository extends MongoRepository<User> {
  async findByUsername(username: string): Promise<User> {
    try {
      return await this.db
        .collection(this.collection)
        .findOne({ username: username });
    } catch (err) {
      throw new AppError(
        404,
        `User with username: "${username}" does not exist.`
      );
    }
  }
}

export class ProductRepository extends MongoRepository<Product> {
  async findByName(name: string): Promise<Product> {
    try {
      return await this.db.collection(this.collection).findOne({ name: name });
    } catch (err) {
      throw new AppError(404, `Product with name: "${name}" does not exist.`);
    }
  }
}

export class RoomRepository extends MongoRepository<Room> {
  async findByName(name: string): Promise<Room> {
    try {
      return await this.db.collection(this.collection).findOne({ name: name });
    } catch (err) {
      throw new AppError(404, `Room with name: ${name} does not exist.`);
    }
  }
}
