import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import LocationService from "./location.service.js";

class LocationController {
  // GET /location/lookup?digitalAddress=GA-123-4567
  static lookupDigitalAddress = catchAsync(async (req, res) => {
    const { digitalAddress } = req.query;
    const result = await LocationService.lookupDigitalAddress(digitalAddress);
    UtilFunctions.outputSuccess(res, result, "Digital address looked up successfully");
  });

  // GET /location/reverse?lat=5.6037&lng=-0.1870
  static reverseGeocode = catchAsync(async (req, res) => {
    const { lat, lng } = req.query;
    const result = await LocationService.reverseGeocode(lat, lng);
    UtilFunctions.outputSuccess(res, result, "Reverse geocode successful");
  });

  // GET /location/validate?digitalAddress=GA-123-4567
  static validateAddress = catchAsync(async (req, res) => {
    const { digitalAddress } = req.query;
    const result = LocationService.validateAddress(digitalAddress);
    UtilFunctions.outputSuccess(res, result, "Address validated");
  });
}

export default LocationController;
