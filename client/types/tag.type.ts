export interface ITag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

export interface ICreateTagRequest {
  name: string;
  description: string;
  color: string;
}

export interface IUpdateTagRequest {
  name: string;
  description: string;
  color: string;
}

export interface ITagsResponse {
  tags: ITag[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
