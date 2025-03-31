import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById } from '@/lib/db/queries';
import { 
  requestTimeoutExtension, 
  requestTermination, 
  getResearchState 
} from '@/lib/research-utils';

/**
 * API route for controlling ongoing research operations
 * Supports actions:
 * - terminate: End the research early but still return partial results
 * - extend_timeout: Add additional time to prevent timeout
 * - get_status: Get the current status of a research session
 */
export async function POST(request: Request) {
  try {
    const { researchId, action } = await request.json();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle different actions
    switch (action) {
      case 'terminate':
        const terminationResult = await requestTermination(researchId, session.user.id);
        
        if (!terminationResult) {
          return NextResponse.json({ 
            error: 'Failed to terminate research. The research may not exist or you may not have permission.'
          }, { status: 404 });
        }
        
        return NextResponse.json({ 
          success: true, 
          status: 'terminated',
          message: 'Research terminated. Results will be available shortly.'
        });

      case 'extend_timeout':
        const extensionResult = await requestTimeoutExtension(researchId);
        
        if (!extensionResult) {
          return NextResponse.json({ 
            error: 'Failed to extend timeout' 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          status: 'timeout_extended',
          message: 'Research timeout extended by 5 minutes.' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Research control error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Get the current status of a research session
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const researchId = searchParams.get('id');
    
    if (!researchId) {
      return NextResponse.json({ error: 'Research ID required' }, { status: 400 });
    }
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const researchState = await getResearchState(researchId, session.user.id);
    
    if (!researchState) {
      return NextResponse.json({ 
        error: 'Research not found or you do not have permission to access it'
      }, { status: 404 });
    }

    // Return the research data
    return NextResponse.json({ 
      success: true, 
      data: {
        id: researchState.id,
        status: researchState.status,
        topic: researchState.topic,
        progress: {
          currentDepth: researchState.currentDepth,
          completedSteps: researchState.completedSteps,
          totalSteps: researchState.totalExpectedSteps
        },
        startTime: researchState.startTime
      }
    });
  } catch (error: any) {
    console.error('Research retrieval error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
