import {
  ICreateTagRequest,
  ITag,
  ITagsResponse,
  IUpdateTagRequest,
} from '@/types/tag.type';
import { BaseApiClient } from './base';

export class TagsApi extends BaseApiClient {
  async getTags(page = 1, limit = 50): Promise<ITagsResponse> {
    return this.get('/tags', { page, limit });
  }

  async createTag(data: ICreateTagRequest): Promise<ITag> {
    return this.post('/tags', data);
  }

  async updateTag(id: number, data: IUpdateTagRequest): Promise<ITag> {
    return this.put(`/tags/${id}`, data);
  }

  async deleteTag(id: number): Promise<void> {
    return this.delete(`/tags/${id}`);
  }
}
