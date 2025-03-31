import { getDocumentById, saveDocument } from '@/lib/db/queries';
import type { Document } from '@/lib/db/schema';

// Timeout extension map to track which research sessions have requested extensions
const timeoutExtensions = new Map<string, boolean>();

/**
 * Check if a timeout extension has been requested for a research session
 */
export async function checkTimeoutExtension(researchId: string): Promise<boolean> {
  return timeoutExtensions.get(researchId) || false;
}

/**
 * Request a timeout extension for a research session
 */
export async function requestTimeoutExtension(researchId: string): Promise<boolean> {
  try {
    timeoutExtensions.set(researchId, true);
    return true;
  } catch (error) {
    console.error('Error requesting timeout extension:', error);
    return false;
  }
}

/**
 * Clear a timeout extension request after it has been used
 */
export async function clearTimeoutExtension(researchId: string): Promise<void> {
  try {
    timeoutExtensions.delete(researchId);
  } catch (error) {
    console.error('Error clearing timeout extension:', error);
  }
}

/**
 * Check if a research session has been marked for termination
 */
export async function checkTerminationStatus(researchId: string): Promise<boolean> {
  try {
    const doc = await getDocumentById({ id: researchId });
    if (!doc) return false;
    
    const state = JSON.parse(doc.content);
    return state.status === 'manually_terminated';
  } catch (error) {
    console.error('Error checking termination status:', error);
    return false;
  }
}

/**
 * Request early termination of a research session
 */
export async function requestTermination(researchId: string, userId: string): Promise<boolean> {
  try {
    const doc = await getDocumentById({ id: researchId });
    if (!doc) return false;
    
    const researchState = JSON.parse(doc.content);
    
    // Verify user owns this research
    if (researchState.userId !== userId) {
      return false;
    }
    
    // Mark as manually terminated
    researchState.status = 'manually_terminated';
    
    // Save the updated state
    await saveDocument({
      id: researchId,
      userId,
      kind: doc.kind,
      content: JSON.stringify(researchState),
      title: doc.title,
    });
    
    return true;
  } catch (error) {
    console.error('Error requesting termination:', error);
    return false;
  }
}

/**
 * Get the current state of a research session
 */
export async function getResearchState(researchId: string, userId: string): Promise<any | null> {
  try {
    const doc = await getDocumentById({ id: researchId });
    if (!doc) return null;
    
    const researchState = JSON.parse(doc.content);
    
    // Verify user owns this research
    if (researchState.userId !== userId) {
      return null;
    }
    
    return researchState;
  } catch (error) {
    console.error('Error getting research state:', error);
    return null;
  }
}
