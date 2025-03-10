import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InjectConnection, getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGODB_URI');
        return {
          uri: mongoUri || 'mongodb://localhost:27017/space-movies',
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
    }),
  ],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try {
      // Ensure indexes are built
      await this.connection.syncIndexes();

      // Log the indexes that have been created
      const collections = Object.keys(this.connection.collections);
      for (const collectionName of collections) {
        const indexes = await this.connection.collections[collectionName]
          .listIndexes()
          .toArray();
        this.logger.log(
          `Collection ${collectionName} has ${indexes.length} indexes`,
        );

        // Log each index in a condensed format
        indexes.forEach((index) => {
          const keys = Object.keys(index.key)
            .map((k) => `${k}:${index.key[k]}`)
            .join(',');
          this.logger.log(`- Index: ${index.name} (${keys})`);
        });
      }

      this.logger.log('Database indexes synchronized successfully');
    } catch (error) {
      this.logger.error(
        `Error synchronizing indexes: ${error.message}`,
        error.stack,
      );
    }
  }
}
