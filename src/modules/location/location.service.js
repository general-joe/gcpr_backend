import {
  lookupDigitalAddress,
  reverseGeocode,
  isValidDigitalAddress,
  getRegionFromCode,
} from "../../utils/ghanaGPS.js";
import HttpStatus from "../../utils/http-status.js";

class LocationService {
  /**
   * Look up a Ghana Post GPS digital address.
   * Returns coordinates + region/district info if API key is configured.
   */
  static async lookupDigitalAddress(digitalAddress) {
    if (!digitalAddress) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "digitalAddress query parameter is required"
      );
    }

    const result = await lookupDigitalAddress(digitalAddress);
    return result;
  }

  /**
   * Reverse geocode lat/lng → address string via OpenStreetMap.
   */
  static async reverseGeocode(lat, lng) {
    if (lat == null || lng == null) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "lat and lng query parameters are required"
      );
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "lat and lng must be valid numbers");
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "lat must be between -90 and 90, lng between -180 and 180"
      );
    }

    return reverseGeocode(parsedLat, parsedLng);
  }

  /**
   * Validate a digital address and return its region without an API call.
   */
  static validateAddress(digitalAddress) {
    const valid = isValidDigitalAddress(digitalAddress ?? "");
    const region = valid ? getRegionFromCode(digitalAddress) : null;
    return {
      digitalAddress: (digitalAddress ?? "").trim().toUpperCase(),
      valid,
      region,
      format: "AB-123-4567 (region code – 3 digits – 4 digits)",
    };
  }
}

export default LocationService;
