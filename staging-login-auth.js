const emails = [
  "mursaleen.buriro@cloudprimero.com",
  "baseer.siraj@gmail.com",
  "abdulnoorkhan1036@gmail.com",
  "waleed.ahmed+1@cloudprimero.com",
  "shahzeb.naqvi@cloudprimero.com",
  "ahmed.abu@cloudprimero.com",
  "sereen.saud@cloudprimero.com",
  "hammad.khan@cloudprimero.com",
  "shahzaib.imran@cloudprimero.com",
  "maaz.khan@cloudprimero.com",
  "aurangzaib.najam@cloudprimero.com",
  "aneeb.ahmed@cloudprimero.com",
  "sereen.saud+test@cloudprimero.com",
  "sereen.saud+testadmin@cloudprimero.com",
  "sereen.saud+testdummy@cloudprimero.com",
  "sereen.saud+testmanual@cloudprimero.com",
  "aalnumran@asda.gov.sa",
  "aalqahtani@asda.gov.sa",
  "abbas.haider.test@cloudprimerolabs.com",
  "abbas.haider@cloudprimerolabs.com",
  "abbas.haider@cloudprimero.com",
  "abdul.aleem@cloudprimerolabs.com",
  "abdullah.khan@cloudprimerolabs.com",
  "adeel.aftab@cloudprimero.com",
  "adel.j@kafaa.sa",
  "adel.z@kafaa.sa",
  "ahatwari@asda.gov.sa",
  "ahmed.abu@cloudprimerolabs.com",
  "alzanbagi.m@kafaa.sa",
  "amar.s@kafaa.sa",
  "amushabab@asda.gov.sa",
  "arham.abbas@cloudprimero.com",
  "arham.abbas@cloudprimerolabs.com",
  "arham@iniox.ch",
  "asad.ali@cloudprimerolabs.com",
  "aurangzaib.najam@cloudprimerolabs.com",
  "baseer.siraj@cloudprimerolabs.com",
  "baseer.siraj@cloudprimero.com",
  "cloudprimero.azure_gmail.com#ext#@cloudprimeroazuregmail.onmicrosoft.com",
  "cp-shuraim@outlook.com",
  "devtal284@gmail.com",
  "engineer_1@cloudprimerolabs.com",
  "engineer_2@cloudprimerolabs.com",
  "engineer_3@cloudprimerolabs.com",
  "executivemeeting@cloudprimerolabs.com",
  "faiz.akhter@cloudprimerolabs.com",
  "faizan.b@cloudprimerolabs.com",
  "faizan.bhutto@cloudprimeroazuregmail.onmicrosoft.com",
  "faizan.k@cloudprimerolabs.com",
  "faljohani@asda.gov.sa",
  "talha.imran@cloudprimero.com",
  "waleed.ahmed@cloudprimero.com",
  "4thfloormeetingroom@cloudprimerolabs.com",
  "hammad.khan@cloudprimerolabs.com",
  "hamza.junaid@cloudprimerolabs.com",
  "hamza.junaid@cloudprimero.com",
  "hashim.y@kafaa.sa",
  "hassan.sachwani@cloudprimerolabs.com",
  "hassan@iniox.ch",
  "imtithal.kteich@cloudprimerolabs.com",
  "karim.s@kafaa.sa",
  "kiera.verburg@cloudprimerolabs.com",
  "maaz.khan@cloudprimerolabs.com",
  "mahmoud.a@kafaa.sa",
  "maldosri@asda.gov.sa",
  "manager_1@cloudprimerolabs.com",
  "mubashir.altaf@cloudprimerolabs.com",
  "muhammad.mawiz@cloudprimerolabs.com",
  "nalhaythami@asda.gov.sa",
  "nalshehri@asda.gov.sa",
  "overwatch.test.admin@cloudprimerolabs.com",
  "overwatch.test@cloudprimerolabs.com",
  "rabee.a@kafaa.sa",
  "ralabbas@asda.gov.sa",
  "saad.ahmed@cloudprimero.com",
  "saad@primero.group",
  "sereen.saud@cloudprimerolabs.com",
  "shahzaib.imran@cloudprimerolabs.com",
  "super_admin_1@cloudprimerolabs.com",
  "syed.abbas@cloudprimerolabs.com",
  "syedhamzajunaid@hotmail.com",
  "talganem@asda.gov.sa",
  "talha.imran@cloudprimerolabs.com",
  "talhaimran284@gmail.com",
  "tariq.ahmed@cloudprimerolabs.com",
  "thinkshuraim221@outlook.com",
  "waleed.ahmed@cloudprimerolabs.com",
  "zainab.ahmed@cloudprimerolabs.com",
  "shumail.ansari@cloudprimero.com",
  "abdullahkhan7745@gmail.com",
  "yarfa.khan+test@cloudprimero.com"
];

async function loginApi(email) {
  const url = 'https://staging-overwatch-g6bfbngratb4c0eh.canadacentral-01.azurewebsites.net/api/tenant/auth/login';
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'content-type': 'application/json',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'Referer': 'https://staging.overwatch.cloudprimerolabs.com/'
  };
  const body = JSON.stringify({
    tenant_code: 'uep',
    email: email,
    password: 'Password123!'
  });

  try {
    const response = await fetch(url, { method: 'POST', headers, body });

    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();  // Fallback for non-JSON
    }

    if (!response.ok) {
      console.error(`Login failed for ${email}: ${response.status} ${response.statusText} - Body: ${JSON.stringify(data, null, 2)}`);
      return;
    }

    console.log(`Login success for ${email}:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Network error for ${email}: ${error.message}`);
  }
}

async function main() {
  console.log(`Starting logins for ${emails.length} emails...`);
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`\n--- Login ${i + 1}/${emails.length}: ${email} ---`);
    await loginApi(email);
    // 2s delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log('\nAll logins completed.');
}

main();