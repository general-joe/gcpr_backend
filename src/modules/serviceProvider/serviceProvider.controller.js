import UtilFunctions from "../../utils/UtilFunctions.js";
import { ServiceProviderService } from "./serviceProvider.service.js";
import catchAsync from "../../middlewares/catchAsync.js";


export default class ServiceProviderController {
  static completeProfile = catchAsync(async (req, res) => {
    
    
       if (!_.has(req.files, "licenseImage")) {
      return UtilFunctions.outputError(res, "No license image specified");
    }

    const serviceProviderData = { ...req.body, ...{ userId:res.locals.user.id } };
  console.log("from the controller:",serviceProviderData)
    console.log(serviceProviderData)


    console.log(req.body, serviceProviderData);
    const completeProfile = await ServiceProviderService.completeProfile(
      req,
      serviceProviderData,
    );
    UtilFunctions.outputSuccess(res, "Service provider profile completed", completeProfile);
  });
}
