import { EntityRepository } from '@mikro-orm/postgresql';
import { FaceRegion } from './face.entity.js';
import { raw } from '@mikro-orm/core';

export class FaceRepository extends EntityRepository<FaceRegion> {

    async findSimilarFaces(
        targetVector: number[],
        model: 'ArcFace',
        metric: 'l2' | 'cosine',
        offset: number = 0,
        limit: number = 10,
        quality: number | null = null,
    ) {
        const vectorLiteral = `[${targetVector.join(',')}]`;
        const column = 'emb_512'

        const distanceExpr = metric === 'l2'
            ? raw(`l2_distance("${column}", ?)`, [vectorLiteral])
            : raw(`cosine_distance("${column}", ?)`, [vectorLiteral]);

        const qb = this.getEntityManager().qb(FaceRegion)
            .select('*')
            .addSelect(distanceExpr.as('distance'))
            .where({ model });

        if (quality !== null) {
            qb.andWhere({ face_quality: quality });
        }

        qb.orderBy({ [raw('distance')]: 'asc' })
            .offset(offset)
            .limit(limit);

        const rows = await qb.execute();

        return rows.map(row => ({
            face: this.getEntityManager().map(FaceRegion, row),
            distance: row.distance,
        }));
    }
}
