export class FetchMoviesCommand {
  constructor(
    public readonly requestId: string,
    public readonly searchTerm: string = 'space',
    public readonly year: string = '2020',
  ) {}
}
