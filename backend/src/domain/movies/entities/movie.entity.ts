import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Movie extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  year: string;

  @Prop()
  director: string;

  @Prop()
  plot: string;

  @Prop()
  poster: string;

  @Prop({ unique: true, index: true })
  imdbID: string;

  @Prop()
  type: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  hasSpaceTheme(): boolean {
    return this.title.toLowerCase().includes('space');
  }
}

export const MovieSchema = SchemaFactory.createForClass(Movie);

// Create text index for search operations (covers most search scenarios)
MovieSchema.index(
  { title: 'text', director: 'text', plot: 'text' },
  { weights: { title: 10, director: 5, plot: 3 } },
);

// Add compound index for sorted listings (most common listing pattern)
MovieSchema.index({ createdAt: -1 });

// Year is often used for filtering
MovieSchema.index({ year: 1 });
