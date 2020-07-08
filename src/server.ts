/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import { UserRepository } from './dao/mongo-repository';
import { User } from './model/user.model';
import usersRouter from './routes/users-router';
import authRouter from './routes/auth-router';
import roomsRouter from './routes/rooms-router';

const POSTS_FILE = path.join(__dirname, '../posts.json');
const DB_URL = 'mongodb://localhost:27017/';
const DB_NAME = 'virtual-cafe';
const PORT = process.env.PORT || 9000;

let connection: MongoClient;

async function start() {
  const app = express();
  const http = require('http').Server(app);
  const io = require('socket.io')(http, { transports: ['websocket', 'polling'] });  

  const db = await initDb(DB_URL, DB_NAME);
  const userRepo = new UserRepository(User, db, 'users');

  app.locals.userRepo = userRepo;
  app.locals.io = io;

  app.set('port', PORT);

  app.use('/', express.static(path.join(__dirname, '../public')));
  app.use(express.json());

  // Additional middleware which will set headers that we need on each request.
  app.use(function (req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader(`Access-Control-Allow-Methods`, `GET, POST, PUT, DELETE, OPTIONS`);
    res.setHeader('Access-Control-Max-Age', 3600); // 1 hour
    // Disable caching so we'll always get the latest posts.
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });

  // attach feature routers
  app.use('/api/users', usersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/rooms', roomsRouter);

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    console.error(err);
    const status = err['status'] || 500;
    res.status(status).json({
      status: res.status,
      message: err.message,
      error: req.app.get('env') === 'production' ? '' : err['error'] || err
    });
  });

  app.locals.postDbFile = POSTS_FILE;

  app.listen(app.get('port'), function () {
    console.log('Server started: http://localhost:' + app.get('port') + '/');
  });
  app.on('close', cleanup);
}

start();

async function initDb(mongoUrl: string, dbName: string) {
  // connect to mongodb
  connection = await MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  return connection.db(dbName);
}

async function cleanup() {
  if (connection && connection.isConnected()) {
    return connection.close();
  }
}