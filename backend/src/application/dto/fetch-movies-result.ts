export class FetchMoviesResult {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly count: number,
  ) {}
}
