export type MetaPublisher = {
  publish(postId: string): Promise<{ igMediaId: string }>;
};

export type MetaPublishError = Error & { code?: string };

export function metaPublishError(message: string, code?: string): MetaPublishError {
  const error = new Error(message) as MetaPublishError;
  error.code = code;
  return error;
}
