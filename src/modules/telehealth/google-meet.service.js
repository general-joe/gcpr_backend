import { google } from "googleapis";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth credentials not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)");
  }

  if (!refreshToken) {
    throw new Error("Google refresh token not configured (GOOGLE_REFRESH_TOKEN)");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  return oauth2Client;
}

export async function createMeetRoom({ title, description, scheduledStart, scheduledEnd, attendeeEmails = [], refreshToken = null, organizerName = null }) {
  let auth;
  try {
    if (refreshToken) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI;
      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Google OAuth credentials not configured");
      }
      auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      auth.setCredentials({ refresh_token: refreshToken });
    } else {
      auth = getOAuth2Client();
    }
  } catch (e) {
    throw new Error(`Google Meet authentication failed: ${e.message}. Please regenerate the Google refresh token using: npm run generate:google-token`);
  }
  
  const calendar = google.calendar({ version: "v3", auth });

  // Build description with organizer info if provided
  let eventDescription = description || "";
  if (organizerName) {
    eventDescription = `Hosted by: ${organizerName}\n\n${eventDescription}`.trim();
  }

  const event = {
    summary: title || "Telehealth Consultation",
    description: eventDescription,
    start: { dateTime: new Date(scheduledStart).toISOString(), timeZone: "UTC" },
    end: { dateTime: new Date(scheduledEnd).toISOString(), timeZone: "UTC" },
    conferenceData: {
      createRequest: {
        requestId: `gcpr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" }
      }
    }
  };

  // Only add attendees array if there are email addresses
  if (attendeeEmails.length > 0) {
    event.attendees = attendeeEmails.map(email => ({ email }));
  }

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      resource: event
    });

    const eventData = response.data;
    const conferenceData = eventData.conferenceData;
    const joinUrl = conferenceData?.entryPoints?.find(e => e.entryPointType === "video")?.uri
      || conferenceData?.entryPoints?.[0]?.uri
      || eventData.hangoutLink
      || null;

    return {
      externalMeetingId: eventData.id,
      joinUrl,
      providerPayload: eventData
    };
  } catch (e) {
    if (e.message?.includes('invalid_grant') || e.code === 401) {
      throw new Error(`Google Meet authorization failed: The refresh token has expired or been revoked. Please regenerate it using: npm run generate:google-token`);
    }
    throw e;
  }
}

export async function updateMeetRoom(externalMeetingId, updates) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const patch = {};
  if (updates.title) patch.summary = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.scheduledStart) patch.start = { dateTime: new Date(updates.scheduledStart).toISOString(), timeZone: "UTC" };
  if (updates.scheduledEnd) patch.end = { dateTime: new Date(updates.scheduledEnd).toISOString(), timeZone: "UTC" };

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId: externalMeetingId,
    conferenceDataVersion: 1,
    resource: patch
  });

  return response.data;
}

export async function cancelMeetRoom(externalMeetingId) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId: externalMeetingId
  });
}

export function computeCountdown(scheduledStart) {
  const now = Date.now();
  const start = new Date(scheduledStart).getTime();
  const diff = start - now;

  if (diff <= 0 && diff > -2 * 60 * 60 * 1000) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true, isPast: false };
  }

  if (diff <= -2 * 60 * 60 * 1000) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, isPast: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isLive: false, isPast: false };
}
