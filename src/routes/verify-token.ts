/*
 * Copyright (c) 2015-2017 IPT-Intellectual Products & Technologies (IPT).
 * All rights reserved.
 *
 * This file is licensed under terms of GNU GENERAL PUBLIC LICENSE Version 3
 * (GPL v3). The full text of GPL v3 license is providded in file named LICENSE,
 * residing in the root folder of this project.
 *
 */

import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { secret } from "../config/secret";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  console.log(req.headers);
  const tokenHeader = req.headers["authorization"];
  if (!tokenHeader) {
    next({ status: 401, message: `Missing authorization token.` });
    return;
  }
  const segments = tokenHeader.split(" ");
  if (
    segments.length !== 2 ||
    segments[0].trim() !== "Bearer" ||
    segments[1].trim().length < 80
  ) {
    next({ status: 403, message: `No access token provided.` });
    return;
  }
  const token = segments[1].trim();

  jwt.verify(token, secret, function (error, decoded) {
    if (error)
      next({ status: 403, message: `Failed to authenticate token.`, error });
    else {
      // if everything good, save to request for use in other routes
      req["userId"] = decoded["id"];
      next();
    }
  });
}
