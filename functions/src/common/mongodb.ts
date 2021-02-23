import { config, logger } from 'firebase-functions';
import difference from 'lodash/difference';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import {
  Collection,
  Cursor,
  DeleteWriteOpResultObject,
  InsertOneWriteOpResult,
  MongoClient,
  UpdateWriteOpResult,
  WithId,
} from 'mongodb';
import { Title } from '../types';
import getFilteredTitleUpdate from './get-filtered-title-update';

const LIMIT_PER_ATTEMPT = 10000;

// const GET_NEXT_QUERY = `SELECT \`id\`, strftime('%s', 'now') - strftime('%s', \`titles\`.\`updated_at\`) as \`delta\`, strftime('%s', 'now') - strftime('%s', \`titles\`.\`released_at\`) as \`age\` from \`titles\` ORDER BY \`description\` IS NULL DESC, \`country\` IS NULL DESC, \`delta\` * \`votes_num\` / \`age\` DESC limit ${LIMIT_PER_ATTEMPT};`;

const MONGODB_URI = `mongodb+srv://${config().mongodb.user.name}:${
  config().mongodb.user.password
}@cluster0-2cmol.mongodb.net/test?retryWrites=true&w=majority`;
export default class Database {
  allIds: number[] = [];

  collection?: Collection<Title>;

  mongoDb?: MongoClient;

  async init(): Promise<void> {
    if (!this.collection) {
      this.mongoDb = new MongoClient(MONGODB_URI, { useNewUrlParser: true });
      await this.mongoDb.connect();
      process.on('beforeExit', this.mongoDb.close);
      this.collection = this.mongoDb.db('shukannia').collection('titles');
    }
  }

  async insert(
    newTitle: Title,
  ): Promise<InsertOneWriteOpResult<WithId<Title>>> {
    if (!this.collection) {
      await this.init();
    }
    logger.info(newTitle.name);
    logger.debug('insert', newTitle);
    this.allIds.push(newTitle.imdbId);
    if (!this.collection) {
      throw new Error('init DB first');
    }
    return this.collection.insertOne(newTitle);
  }

  async deleteByImdbId(imdbId: number): Promise<DeleteWriteOpResultObject> {
    await this.init();
    const query = { imdbId };
    logger.debug('deleteOne', query);
    if (!this.collection) {
      throw new Error('init DB first');
    }
    return this.collection.deleteOne(query);
  }

  async getAll(): Promise<Cursor<Title>> {
    await this.init();
    logger.debug('find');
    if (!this.collection) {
      throw new Error('init DB first');
    }
    return this.collection.find();
  }

  async getAllImdbIds(): Promise<number[]> {
    await this.init();
    if (!isEmpty(this.allIds)) {
      return this.allIds;
    }
    const query = {};
    const options = { projection: { _id: false, imdbId: true } };
    logger.debug('find', query, options);
    if (!this.collection) {
      throw new Error('init DB first');
    }
    // eslint-disable-next-line unicorn/no-array-callback-reference
    const result = await this.collection.find(query, options).toArray();
    // logger.debug(result);
    this.allIds = map(result, 'imdbId');
    logger.debug(this.allIds);
    return this.allIds;
  }

  async getByImdbId(imdbId: number): Promise<Title | null> {
    await this.init();
    const query = { imdbId };
    logger.debug('findOne', query);
    if (!this.collection) {
      throw new Error('init DB first');
    }
    return this.collection.findOne({ imdbId });
  }

  async getNextToUpdate(): Promise<Title[]> {
    await this.init();
    const aggregationPipeline = [
      {
        $project: {
          countries: true,
          description: true,
          episode: true,
          explicit: true,
          genres: true,
          image: true,
          imdbId: true,
          kind: true,
          name: true,
          rating: true,
          releasedAt: true,
          season: true,
          seriesId: true,
          severe: true,
          updatedAt: true,
          votesNum: true,
          demandForUpdate: {
            // $multiply: ['$votesNum', { $subtract: [new Date(), '$updatedAt'] }],
            $subtract: [new Date(), '$updatedAt'],
          },
          hasLanguages: {
            $cond: ['$languages', true, false],
          },
          hasCountries: {
            $cond: ['$countries', true, false],
          },
        },
      },
      {
        $sort: {
          hasCountries: 1,
          hasLanguages: 1,
          demandForUpdate: -1,
        },
      },
      {
        $limit: LIMIT_PER_ATTEMPT,
      },
      {
        $project: {
          imdbId: true,
        },
      },
    ];
    logger.debug('aggregate', aggregationPipeline);
    if (!this.collection) {
      throw new Error('init DB first');
    }
    return this.collection.aggregate(aggregationPipeline).toArray();
  }

  async rejectKnown(imdbIds: number[]): Promise<number[]> {
    return difference(imdbIds, await this.getAllImdbIds());
  }

  async saveUpdate(
    imdbId: number,
    titleUpdate: Title,
  ): Promise<UpdateWriteOpResult | InsertOneWriteOpResult<WithId<Title>>> {
    await this.init();
    const title = await this.getByImdbId(imdbId);
    if (!title) {
      return this.insert(titleUpdate);
    }
    const filteredTitleUpdate = getFilteredTitleUpdate(title, titleUpdate);
    logger.info(title.name);
    // logger.debug(query);
    const query = { imdbId };
    const operation = { $set: filteredTitleUpdate };
    logger.debug('updateOne', query, operation);
    if (!this.collection) {
      throw new Error('init DB first');
    }
    return this.collection.updateOne(query, operation);
  }
}
