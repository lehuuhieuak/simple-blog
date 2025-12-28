export interface IUser {
  id: number;
  email: string;
  username: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ICreateUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface IUpdateUserRequest {
  email?: string;
  username?: string;
  password?: string;
}

export interface IUsersResponse {
  users: IUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface IGetUsersParams {
  page: number;
  limit: number;
  search: string;
  email: string;
}