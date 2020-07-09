import { Router } from 'express';
import { AppError } from '../model/errors';
import { ProductRepository } from '../dao/mongo-repository';
import * as indicative from 'indicative';
import * as bcrypt from 'bcryptjs';
import { User } from '../model/user.model';
import { userInfo } from 'os';
import { Product } from '../model/product.model';

const router = Router();

router.get('/', (req, res, next) =>
    (<ProductRepository>req.app.locals.productRepo).findAll()
        .then(products => res.json(products))
        .catch(next));

router.get('/:id', async (req, res, next) => {
    // validate id
    try {
        const id = req.params.id;
        await indicative.validator.validate({ id }, {
            id: 'required|regex:^[0-9a-fA-F]{24}$'
        });
    } catch (err) {
        next(new AppError(400, err.message, err));
        return;
    }
    // find user
    try {
        const found = await (<ProductRepository>req.app.locals.productRepo).findById(req.params.id);
        res.json(found); //200 OK
    } catch (err) {
        next(err);
    }

});

router.post('/', async (req, res, next) => {
    // validate new product
    const newProduct = req.body;
    try {
        await indicative.validator.validate(newProduct, {
            _id: 'regex:^[0-9a-fA-F]{24}$',
            // title: 'required|string|min:3|max:30',
            // text: 'required|string|min:3|max:1024',
            // // authorId: 'required|regex:^[0-9a-fA-F]{24}$',s
            // imageUrl: 'url',
            // categories: 'array',
            // 'categories.*': 'string',
            // keywords: 'array',
            // 'keywords.*': 'string',
        });
    } catch (err) {
        next(new AppError(400, err.message, err));
        return;
    }
    // create product in db
    try {

        const found = await (<ProductRepository>req.app.locals.productRepo).findByName(newProduct.name);
        if(found) {
            throw new AppError(400, `Name already taken: '${newProduct.name}'.`);
        }


        // Create new Product
        const created = await (<ProductRepository>req.app.locals.productRepo).add(newProduct);

        res.status(201).location(`/api/products/${newProduct.id}`).json(newProduct);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', async function (req, res, next) {
    // validate edited user
    const product = req.body as Product;
    try {
        await indicative.validator.validate(product, {
            _id: 'required|regex:^[0-9a-fA-F]{24}$',
            // title: 'required|string|min:3|max:30',
            // text: 'required|string|min:3|max:1024',
            // // authorId: 'required|regex:^[0-9a-fA-F]{24}$',s
            // imageUrl: 'url',
            // categories: 'array',
            // 'categories.*': 'string',
            // keywords: 'array',
            // 'keywords.*': 'string',
        });
    } catch (err) {
        next(new AppError(400, err.message, err));
        return;
    }

    try {
        const userId = req.params.id;

        if (userId !== product._id) {
            next(new AppError(400, `IDs in the URL and message body are different.`));
            return;
        }
        const found = await (<ProductRepository>req.app.locals.productRepo).findById(req.params.id);
        if (product.name && product.name.length > 0 && found.name !== product.name) {
            throw new AppError(400, `Can not change username.`);
        }
        // _id is unmodifiable
        product._id = found._id;
        const updated = await (<ProductRepository>req.app.locals.productRepo).edit(product);
        res.json(updated); //200 OK with user in the body
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', async function (req, res, next) {
     // validate id
     try {
        const id = req.params.id;
        await indicative.validator.validate({ id }, {
            id: 'required|regex:^[0-9a-fA-F]{24}$'
        });
    } catch (err) {
        next(new AppError(400, err.message, err));
        return;
    }
    try {
        const productId = req.params.id;
        const deleted = await (<ProductRepository>req.app.locals.productRepo).deleteById(productId);
        res.json(deleted); //200 OK with deleted user in the body
    } catch (err) {
        next(err);
    }
});

export default router;
