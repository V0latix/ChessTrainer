import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithAuthUser } from '../types/authenticated-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuthUser>();
    return request.authUser;
  },
);
