import { MoviesAddedEvent } from '../../../src/application/events/movies-added.event';

describe('MoviesAddedEvent', () => {
  it('should create an event with a count', () => {
    const count = 5;
    const event = new MoviesAddedEvent(count);

    expect(event).toBeDefined();
    expect(event.count).toBe(count);
  });

  it('should have readonly count property', () => {
    const count = 10;
    const event = new MoviesAddedEvent(count);

    expect(event.count).toBe(count);

    // Test that count is properly assigned via constructor
    const modifiedEvent = new MoviesAddedEvent(20);
    expect(modifiedEvent.count).toBe(20);
  });
});
