export type BlogSection = {
  subTitle?: string;
  content: string;
  items?: BlogSectionItem[];
};

export type BlogSectionItem = {
  id: string;
  title: string;
  image?: string;
  description: string;
  url?: string;
  price?: string;
};

export type BlogPost = {
  id: string;
  headTitle: string;
  headDescription: string;
  headImage: string;
  subDescription?: string;
  sections?: BlogSection[];
  content?: string;
  createdAt: Date;
  updatedAt?: Date;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  published?: boolean;
  tags?: string[];
  views?: number;
};

export type CreateBlogPostInput = {
  headTitle: string;
  headDescription: string;
  headImage: string;
  subDescription?: string;
  sections?: BlogSection[];
};