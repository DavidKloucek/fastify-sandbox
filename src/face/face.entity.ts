import { defineEntity, p, Type } from '@mikro-orm/core';
import { BaseSchema } from '../shared/base.entity.js';
import { FaceRepository } from './face.repository.js';

export const MODEL_VECTOR_SIZES = {
    'VGG-Face': 4096,
    'Facenet': 128,
    'ArcFace': 512,
    'Facenet512': 512,
} as const;

export class VectorType extends Type<number[] | null, string | null> {
    convertToDatabaseValue(value: number[] | null): string | null {
        return value === null ? null : `[${value.join(',')}]`;
    }
    convertToJSValue(value: string | number[] | null): number[] | null {
        if (value === null) return null;
        return Array.isArray(value) ? value : value.slice(1, -1).split(',').map(Number);
    }
    getColumnType(): string {
        return 'vector';
    }
}

const FaceRegionSchema = defineEntity({
    name: 'FaceRegion',
    tableName: 'face_region',
    extends: BaseSchema,
    repository: () => FaceRepository,
    properties: {
        id: p.integer().primary(),
        filename: p.string(),

        emb_128: p.type(VectorType).nullable().accessor(true),
        emb_512: p.type(VectorType).nullable().accessor(true),
        emb_4096: p.type(VectorType).nullable().accessor(true),

        x: p.float(),
        y: p.float(),
        w: p.float(),
        h: p.float(),

        left_eye: p.json<Record<string, number> | number[]>().nullable(),
        right_eye: p.json<Record<string, number> | number[]>().nullable(),

        face_confidence: p.float(),
        face_quality: p.float(),

        created_at: p.datetime(),

        model: p.string().accessor(true),
    },
});

export class FaceRegion extends FaceRegionSchema.class {
    private _emb128: number[] | null = null;
    private _emb512: number[] | null = null;
    private _emb4096: number[] | null = null;
    private _model!: keyof typeof MODEL_VECTOR_SIZES;

    created_at = new Date();

    constructor(
        filename: string,
        x: number,
        y: number,
        w: number,
        h: number,
        left_eye: Record<string, number> | number[] | null,
        right_eye: Record<string, number> | number[] | null,
        face_confidence: number,
        face_quality: number,
        model: keyof typeof MODEL_VECTOR_SIZES,
        vector: Record<string, number> | number[] | Float32Array,
    ) {
        super();
        this.filename = filename;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.left_eye = left_eye;
        this.right_eye = right_eye;
        this.face_confidence = face_confidence;
        this.face_quality = face_quality;
        this._model = model;

        this.setVectorByType(vector, model);
    }

    get model() {
        return this._model;
    }
    private set model(model: keyof typeof MODEL_VECTOR_SIZES) {
        this._model = model;
    }

    get emb_128() {
        return this._emb128;
    }
    private set emb_128(v: number[] | null) {
        if (v !== null && v.length !== 128) {
            throw new Error(`emb_128 must have length 128, got ${v.length.toString()}`);
        }
        this._emb128 = v;
    }

    get emb_512() {
        return this._emb512;
    }
    private set emb_512(v: number[] | null) {
        if (v !== null && v.length !== 512) {
            throw new Error(`emb_512 must have length 512, got ${v.length.toString()}`);
        }
        this._emb512 = v;
    }

    get emb_4096() {
        return this._emb4096;
    }
    private set emb_4096(v: number[] | null) {
        if (v !== null && v.length !== 4096) {
            throw new Error(`emb_4096 must have length 4096, got ${v.length.toString()}`);
        }
        this._emb4096 = v;
    }

    setVectorByType(vector: Record<string, number> | number[] | Float32Array, model: keyof typeof MODEL_VECTOR_SIZES) {
        const arr = vector instanceof Float32Array
            ? Array.from(vector)
            : Array.isArray(vector)
                ? vector
                : Object.values(vector);

        this.emb_128 = null;
        this.emb_512 = null;
        this.emb_4096 = null;

        // tyhle přiřazení projdou přes výše definované settery => validace proběhne vždy
        if (model === 'VGG-Face') this.emb_4096 = arr;
        else if (model === 'Facenet') this.emb_128 = arr;
        else if (model === 'ArcFace' || model === 'Facenet512') this.emb_512 = arr;
        else throw new Error(`Model ${model} not implemented`);

        this.model = model;
    }
}

FaceRegionSchema.setClass(FaceRegion);
