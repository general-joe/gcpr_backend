import { google } from "googleapis";

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  return oauth2Client;
}

export async function createMeetRoom({ title, description, scheduledStart, scheduledEnd, attendeeEmails = [] }) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: title || "Telehealth Consultation",
    description: description || "",
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
