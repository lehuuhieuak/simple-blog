import { ITag } from './tag.type';

export interface IPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  author_username: string;
  created_at: string;
  updated_at?: string;
  published: boolean;
  tags?: ITag[];
}

export interface ICreatePostRequest {
  title: string;
  content: string;
  published: boolean;
  tag_ids?: number[];
}

export interface IUpdatePostRequest {
  title: string;
  content: string;
  published: boolean;
  tag_ids?: number[];
}

export interface IPostsResponse {
  posts: IPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
