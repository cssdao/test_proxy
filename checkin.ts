// 柑橘定时签到每个 24 小时
// https://discord.com/channels/1202156430430306304/1290340375361491046
import fetch from 'node-fetch';
import FormData from 'form-data';

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

  formData.append('payload_json', payloadJson);

  try {
    const response = await fetch(url, {
      headers: {
        accept: '*/*',
        authorization: token,
      },
      body: formData,
      method: 'POST',
      agent,
    });

    // Discord interaction endpoints often return 204 No Content on success
    if (response.status === 204) {
      console.log('Daily check-in successful!');
      return true;
    }

    // If we get a different status, try to parse the response
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      console.error('Request failed:', data);
    } catch {
      console.error('Request failed with status:', response.status, text);
    }
    return false;
  } catch (error) {
    console.error('Error during request:', error);
    return false;
  }
}