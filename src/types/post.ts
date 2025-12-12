// src/types/post.ts
/**
 * ✅ Post types - Re-export from blog with proper naming
 */
export type {
  BlogPost as Post,
  PostSummary,
  ClientBlogPost as ClientPost,
  CreatePostInput,
  UpdatePostInput,
  BlogSection,
  BlogSectionItem,
} from './blog';

export {
  isTimestamp,
  isTimestampLike,
  toDate,
} from './blog';