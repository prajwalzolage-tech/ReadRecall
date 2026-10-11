// __tests__/api/article-delete.test.ts

import { describe, it, expect } from 'vitest';
import { saveArticle, getArticleById, deleteArticle } from '@/lib/data-store';

describe('article deletion', () => {
  it('allows a user to delete their uploaded document', async () => {
    const testArticle = await saveArticle({
      title: 'Temporary Test Document',
      text: 'This is a test document uploaded by a user for active recall testing purposes.',
      source: 'uploaded',
      createdBy: 'test_user_456',
    });

    // Verify it exists
    const fetched = await getArticleById(testArticle.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Temporary Test Document');

    // Delete it
    const deleted = await deleteArticle(testArticle.id, 'test_user_456');
    expect(deleted).toBe(true);

    // Verify it no longer exists
    const afterDelete = await getArticleById(testArticle.id);
    expect(afterDelete).toBeNull();
  });

  it('prevents deletion of curated system articles', async () => {
    await expect(deleteArticle('curated-1', 'any_user')).rejects.toThrow(
      'Cannot delete curated system articles'
    );
  });

  it('prevents unauthorized users from deleting another user document', async () => {
    const testArticle = await saveArticle({
      title: 'Protected User Document',
      text: 'This document belongs strictly to user A.',
      source: 'uploaded',
      createdBy: 'user_a',
    });

    await expect(deleteArticle(testArticle.id, 'user_b')).rejects.toThrow(
      'Unauthorized to delete this article'
    );

    // Cleanup by the real owner
    await deleteArticle(testArticle.id, 'user_a');
  });
});
