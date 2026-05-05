import axios from "axios";

// Ghana Post GPS region codes → region names
const REGION_CODES = {
  GA: "Greater Accra",
  AK: "Ashanti",
  BA: "Bono", // formerly Brong-Ahafo (split into Bono, Bono East, Ahafo)
  AH: "Ahafo",
  BE: "Bono East",
  CP: "Central",
  EP: "Eastern",
  NE: "North East",
  NO: "Northern",
  NW: "North West", // Savannah
  SA: "Savannah",
  OT: "Oti",
  UE: "Upper East",
  UW: "Upper West",
  VO: "Volta",
  WE: "Western",
  WN: "Western North",
};

/**
 * Validates a Ghana Post GPS digital address.
 * Expected format: AB-123-4567 (2-letter region code, 3 digits, 4 digits)
 */
export function isValidDigitalAddress(address) {
  return /^[A-Za-z]{2}-\d{3}-\d{4}$/i.test((address ?? "").trim());
}

/**
 * Returns the region name for a Ghana digital address prefix.
 * e.g. "GA-123-4567" → "Greater Accra"
 */
export function getRegionFromCode(address) {
  const code = (address ?? "").trim().toUpperCase().substring(0, 2);
  return REGION_CODES[code] ?? "Unknown Region";
}

/**
 * Looks up a Ghana Post GPS digital address.
 *
 * If GHANA_GPS_API_KEY is set, calls the official API.
 * Otherwise returns a partial result (region info only) without coordinates.
 *
 * @param {string} digitalAddress
 * @returns {Promise<{digitalAddress, region, coordinates?, district?, postCode?, street?, raw?}>}
 */
export async function lookupDigitalAddress(digitalAddress) {
  const normalized = (digitalAddress ?? "").trim().toUpperCase();

  if (!isValidDigitalAddress(normalized)) {
    throw new Error(
      `Invalid Ghana Post GPS digital address: "${digitalAddress}". ` +
        "Expected format: AB-123-4567 (e.g. GA-184-6424)"
    );
  }

  const region = getRegionFromCode(normalized);

  const apiKey = process.env.GHANA_GPS_API_KEY;
  if (apiKey) {
    return _lookupViaOfficialAPI(normalized, region, apiKey);
  }

  // No API key – return region info only
  return {
    digitalAddress: normalized,
    region,
    coordinates: null,
    note: "Set GHANA_GPS_API_KEY environment variable for full coordinate lookup from the Ghana Post GPS system.",
  };
}

async function _lookupViaOfficialAPI(digitalAddress, region, apiKey) {
  try {
    const response = await axios.get(
      `https://ghanapostgps.speakingdata.com/api/v1/gps/address/${encodeURIComponent(digitalAddress)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        timeout: 10_000,
      }
    );

    const data = response.data?.data ?? response.data ?? {};

    return {
      digitalAddress,
      region,
      district: data.District ?? null,
      area: data.Area ?? null,
      street: data.Street ?? null,
      postCode: data.PostCode ?? null,
      coordinates: {
        lat: data.lat != null ? parseFloat(data.lat) : null,
        lng: data.long != null ? parseFloat(data.long) : null,
      },
    };
  } catch (err) {
    WRITE.error("[GhanaGPS] Official API call failed", {
      address: digitalAddress,
      status: err.response?.status,
      err: err.message,
    });
    throw new Error(
      `Ghana Post GPS lookup failed: ${err.response?.data?.message ?? err.message}`
    );
  }
}

/**
 * Reverse geocodes latitude/longitude to a human-readable address via
 * OpenStreetMap Nominatim (free, no key required).
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{displayName, address, coordinates}>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat,
          lon: lng,
          format: "json",
          addressdetails: 1,
        },
        headers: {
          "User-Agent": "GCPR-Backend/1.0 (cerebral-palsy-rehabilitation)",
          "Accept-Language": "en",
        },
        timeout: 10_000,
      }
    );

    return {
      displayName: response.data.display_name ?? null,
      address: response.data.address ?? null,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
    };
  } catch (err) {
    WRITE.error("[GhanaGPS] Reverse geocode failed", {
      lat,
      lng,
      err: err.message,
    });
    throw new Error(`Reverse geocode failed: ${err.message}`);
  }
}
