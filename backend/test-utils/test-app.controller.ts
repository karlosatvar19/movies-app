import { Controller, Get } from '@nestjs/common';

@Controller()
export class TestAppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
