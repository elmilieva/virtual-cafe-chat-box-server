import { Indentifiable, IdType } from './shared-types';
import { OptionalId } from 'mongodb';
export interface IProduct extends Indentifiable {
    name: string;
    imageUrl: string;
}

export class Product implements IProduct{
    static typeId = 'Product';
    constructor(
        public _id: IdType,
        public name: string,
        public imageUrl: string,
        ) {}
}