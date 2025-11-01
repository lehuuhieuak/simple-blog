import {
  ICreatePostRequest,
  IPost,
  IPostsResponse,
  IUpdatePostRequest,
} from '@/types/post.typs';
import { BaseApiClient } from './base';

export class PostsApi extends BaseApiClient {
  async getPosts(page = 1, limit = 10): Promise<IPostsResponse> {
    return this.get('/posts', { page, limit });
  }

  async getPostBySlug(slug: string): Promise<IPost> {
    return this.get(`/posts/${slug}`);
  }

  async createPost(data: ICreatePostRequest): Promise<IPost> {
    return this.post('/posts', data);
  }

  async updatePost(slug: string, data: IUpdatePostRequest): Promise<IPost> {
    return this.put(`/posts/${slug}`, data);
  }

  async deletePost(slug: string): Promise<void> {
    return this.delete(`/posts/${slug}`);
  }

  async getMyPosts(page = 1, limit = 10): Promise<IPostsResponse> {
    return this.get('/posts/my-posts', { page, limit });
  }

  async getPostsByTag(
    tagSlug: string,
    page = 1,
    limit = 10,
  ): Promise<IPostsResponse> {
    return this.get(`/tags/${tagSlug}/posts`, { page, limit });
  }
}
