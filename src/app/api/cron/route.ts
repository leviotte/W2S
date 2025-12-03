import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// De lijst van alle taken die we willen uitvoeren
const CRON_JOBS = [
  'delete-unverified-users',
  'cleanup-old-messages',
  'sync-amazon-products',
];

export async function GET(request: Request) {
  // --- Gold Standard Security ---
  // Controleer of de request van Vercel Cron of een geautoriseerde bron komt
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Bepaal de basis URL van de applicatie
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    console.log(`Orchestrator starting ${CRON_JOBS.length} cron jobs...`);
    
    // Roep elke taak-API asynchroon aan.
    // We gebruiken Promise.allSettled zodat een falende job de andere niet blokkeert.
    const results = await Promise.allSettled(
      CRON_JOBS.map(job => {
        const url = `${baseUrl}/api/cron/${job}`;
        console.log(`Triggering job: ${url}`);
        return fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          },
        });
      })
    );

    const jobOutcomes = results.map((result, index) => {
      const jobName = CRON_JOBS[index];
      if (result.status === 'fulfilled') {
        // De fetch zelf is gelukt, check de response status
        return { job: jobName, status: 'triggered', responseStatus: result.value.status };
      } else {
        // De fetch is mislukt (netwerk error, etc.)
        return { job: jobName, status: 'failed', reason: result.reason.message };
      }
    });

    console.log('Orchestrator finished.', jobOutcomes);
    return NextResponse.json({ success: true, executed_jobs: jobOutcomes });

  } catch (error) {
    console.error('Error in cron orchestrator:', error);
    return NextResponse.json({ success: false, message: 'Orchestrator failed' }, { status: 500 });
  }
}