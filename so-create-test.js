// so-create-test.js
// Bun.js script: Creates 10 Safety Observations (SO) with dynamic HTML descriptions.
// Assumes auth cookie/token from login (update with your session values).
// Run with: bun run so-create-test.js

const descriptions = [
  '<p class="text-node" style="text-align: left;">Dynamic safety note 1: Observed minor hazard in zone during routine check.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 2: Team reported slip risk; immediate cleanup suggested.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 3: Equipment misalignment noted—recommend alignment by EOD.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 4: PPE non-compliance observed on 2 workers; training refresh needed.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 5: Ventilation issue in confined space—ventilate before entry.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 6: Electrical cord fraying; isolate and replace ASAP.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 7: Scaffolding stability check passed but monitor wind conditions.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 8: Chemical spill contained; review storage protocols.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 9: Ergonomic strain from lifting—implement team lifts.</p>',
  '<p class="text-node" style="text-align: left;">Dynamic safety note 10: Fire extinguisher access blocked; relocate barriers.</p>'
];

const closeReasons = [
  '<p class="text-node" style="text-align: left;">Closed: Issue resolved via quick fix and team briefing.</p>',
  '<p class="text-node" style="text-align: left;">Closed: Root cause identified and preventive measure added.</p>',
  '<p class="text-node" style="text-align: left;">Closed: No further action required after verification.</p>',
  '<p class="text-node" style="text-align: left;">Closed: Training conducted; compliance confirmed.</p>',
  '<p class="text-node" style="text-align: left;">Closed: Equipment repaired and tested successfully.</p>',
  '<p class="text-node" style="text-align: left;">Closed: Area secured; ongoing monitoring in place.</p>',
  '<p class="text-node" style="text-align: left;">Closed: Protocol updated; all team notified.</p>',
  '<p class="text-node" style="text-align: left;">Closed: Spill cleaned; spill kit restocked.</p>',
  '<p class="text-node" style="text-align: left;">Closed: Lifting aids provided; demo given.</p>',
  '<p class="text-node" style="text-align: left;">Closed: Path cleared; signage improved.</p>'
];

async function createSO(index) {
  const url = 'https://dev.overwatch.cloudprimerolabs.com/api/proxy/api/so';
  const formData = new FormData();

  // Fixed values from request (update IDs/cookie as needed)
  formData.append('observerId', 'afc7a1dd-f0f8-4960-bb08-3bc5bcd1edb8');
  formData.append('observationDate', '15-10-2025');  // Use current date: Oct 15, 2025
  formData.append('hseSuggestionDetails', descriptions[index]);  // Dynamic HTML desc
  formData.append('zoneId', 'a0b00ee1-5d63-4449-8b76-63adb3b666ab');
  formData.append('siteId', 'ec938065-40e0-4ba6-8af4-34b78251ac9e');
  formData.append('status', 'closed');
  formData.append('isOpenSo', 'closed');
  formData.append('detailedLocation', 'dynamic location ' + (index + 1));
  formData.append('closeActionReason', closeReasons[index]);  // Dynamic HTML reason
  formData.append('actions', JSON.stringify([]));
  formData.append('links', JSON.stringify([]));
  formData.append('hasWorkStopped', 'false');
  formData.append('anonymous', 'false');
  formData.append('criticalSO', 'false');
  formData.append('isRelatedContractor', 'false');
  formData.append('criticalSafetyIssues', 'false');
  formData.append('fourP', 'people');
  formData.append('observationSourceId', '445e566f-1fee-4e1a-bd83-9daea28eb6c3');
  formData.append('hazards', JSON.stringify([
    {"hazardId": "f47c0bcb-2ec5-498c-94a3-664626eb216c", "details": "", "hazardTypeId": "ce47789f-3a35-4c55-9556-b338a1be15ae"},
    {"hazardId": "f7f864d1-51a2-4cae-885d-cc769eab6b2a", "details": "", "hazardTypeId": "ce47789f-3a35-4c55-9556-b338a1be15ae"},
    {"hazardId": "f0395f18-2da9-4181-b042-5115881cc067", "details": "", "hazardTypeId": "ce47789f-3a35-4c55-9556-b338a1be15ae"},
    {"hazardId": "c3a17ec2-347e-457b-90fd-4e3b23cfb3f9", "details": "", "hazardTypeId": "ce47789f-3a35-4c55-9556-b338a1be15ae"}
  ]));

  const headers = new Headers({
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'sec-ch-ua': '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'cookie': 'session=%7B%22id%22%3A%22a07fe805-4de1-4077-bd51-01d18027ca60%22%2C%22email%22%3A%22shumail.ansari%40cloudprimero.com%22%2C%22username%22%3A%22shumail.ansari_cloudprimero.com%23EXT%23%40cloudprimeroazuregmail.onmicrosoft.com%22%2C%22first_name%22%3A%22%22%2C%22last_name%22%3A%22%22%2C%22is_internal%22%3Afalse%2C%22can_access_control_panel%22%3Afalse%2C%22tenant%22%3A%7B%22id%22%3A%22012fcef0-85a2-46dc-8ee3-051e2e8a218c%22%2C%22name%22%3A%22UEP%22%2C%22code%22%3A%22uep%22%7D%2C%22roles%22%3A%5B%5D%7D; access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDdmZTgwNS00ZGUxLTQwNzctYmQ1MS0wMWQxODAyN2NhNjAiLCJlbWFpbCI6InNodW1haWwuYW5zYXJpQGNsb3VkcHJpbWVyby5jb20iLCJpc19pbnRlcm5hbCI6ZmFsc2UsImNhbl9hY2Nlc3NfY29udHJvbF9wYW5lbCI6ZmFsc2UsInRlbmFudF9pZCI6IjAxMmZjZWYwLTg1YTItNDZkYy04ZWUzLTA1MWUyZThhMjE4YyIsInRlbmFudF9jb2RlIjoidWVwIiwiaWF0IjoxNzYwNDg0MzkxLCJleHAiOjE3NjA1NzA3OTF9.nZ3Ku2gZpI26Gwv-7P42xC5IwMcg-LRKibItHn9F7fE; refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDdmZTgwNS00ZGUxLTQwNzctYmQ1MS0wMWQxODAyN2NhNjAiLCJlbWFpbCI6InNodW1haWwuYW5zYXJpQGNsb3VkcHJpbWVyby5jb20iLCJ0eXBlIjoicmVmcmVzaCIsInRlbmFudF9pZCI6IjAxMmZjZWYwLTg1YTItNDZkYy04ZWUzLTA1MWUyZThhMjE4YyIsInRlbmFudF9jb2RlIjoidWVwIiwiaWF0IjoxNzYwNDg0MzkxLCJleHAiOjE3NjEwODkxOTF9.SatBkIoCWKvpqbZET-oAz2CxBNYPmy0HlJPYf-liAl8',
    'Referer': 'https://dev.overwatch.cloudprimerolabs.com/en/safety-observation/create-new'
  });

  // FormData sets its own Content-Type (multipart) - don't override

  try {
    const response = await fetch(url, { method: 'POST', headers, body: formData });

    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();  // Fallback
    }

    if (!response.ok) {
      console.error(`SO creation failed (attempt ${index + 1}): ${response.status} - Body: ${JSON.stringify(data, null, 2)}`);
      return;
    }

    console.log(`SO created successfully (attempt ${index + 1}):`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Network error (attempt ${index + 1}): ${error.message}`);
  }
}

async function main() {
  console.log('Starting 10 SO creations with dynamic HTML descriptions...');
  for (let i = 0; i < 10; i++) {
    console.log(`\n--- SO Creation ${i + 1}/10 ---`);
    await createSO(i);
    await new Promise(resolve => setTimeout(resolve, 2000));  // 2s delay to avoid rate limits
  }
  console.log('\nAll 10 SOs completed.');
}

main();