exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const { fileName, fileData } = JSON.parse(event.body);
    const tokenRes = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=R1dXz176WX4AAAAAAAAAcfo5k-QSqIbxdIDSYmKCar0ZaSS0bnjrS97xjm4s8yX&client_id=tln30sesnnb1n6q&client_secret=i0yuhr2vxxfr1ly'
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Token refresh failed: ' + JSON.stringify(tokenData) }) };
    const fileBuffer = Buffer.from(fileData, 'base64');
    const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + tokenData.access_token,
        'Dropbox-API-Arg': JSON.stringify({ path: '/call recordings/' + fileName, mode: 'overwrite', autorename: false }),
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    });
    const uploadData = await uploadRes.json();
    if (uploadData.error_summary) return { statusCode: 500, headers, body: JSON.stringify({ error: uploadData.error_summary }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, name: uploadData.name }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
