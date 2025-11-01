import {
  ICreateUserRequest,
  IGetUsersParams,
  IUpdateUserRequest,
  IUser,
  IUsersResponse,
} from '@/types/user.type';
import { BaseApiClient } from './base';

export class UsersApi extends BaseApiClient {
  async getAllUsers(params: IGetUsersParams): Promise<IUsersResponse> {
    return this.get('/users', params);
  }

  async createUser(data: ICreateUserRequest): Promise<IUser> {
    return this.post('/users', data);
  }

  async updateUser(id: number, data: IUpdateUserRequest): Promise<IUser> {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return this.delete(`/users/${id}`);
  }
}
