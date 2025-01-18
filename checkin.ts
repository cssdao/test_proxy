// 柑橘定时签到每个 24 小时
// https://discord.com/channels/1202156430430306304/1290340375361491046
import fetch from 'node-fetch';
export default async function citreaDailyRequest(token, sessionId, agent) {
  const url = "https://discord.com/api/v9/interactions";

  const formData = new FormData()
  const payloadJson = JSON.stringify({
    type: 2,
    application_id: '1262002450617991210',
    guild_id: '1202156430430306304',
    channel_id: '1290340375361491046',
    session_id: sessionId,
    data: {
      version: '1303615671422287943',
      id: '1303615671422287942',
      guild_id: '1202156430430306304',
      name: 'daily',
      type: 1,
    },
    nonce:
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15),
    analytics_location: 'slash_ui',
  });

  formData.set('payload_json', payloadJson);

  fetch(url, {
    headers: {
      accept: '*/*',
      authorization: token,
      'content-type':
        'multipart/form-data; boundary=----WebKitFormBoundaryBnUFO77Qs6VnW6vB',
    },
    body: formData,
    method: 'POST',
    agent,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Request successful:', data);
    })
    .catch((error) => {
      console.error('Error during request:', error);
    });
}