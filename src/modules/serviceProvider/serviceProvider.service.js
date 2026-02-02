import prisma from "../../config/database.js";

import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";

export class ServiceProviderService {
  static async completeProfile(rq, serviceProviderData) {

    if (!_.isEmpty(rq.files)) {
      if (_.has(rq.files, "licenseImage")) {
        const fileName = `${serviceProviderData.userId}.jpg`;
        console.log(fileName);
        serviceProviderData.licenseImage = await UploadService.saveFile(
          rq.files.licenseImage[0].buffer,
          fileName,
          constants.LICENSES_BUCKET,
        );

      }
    }
    const completeProfile = await prisma.serviceProvider.create({
      data: {
        ...serviceProviderData,
        experience: Number(rq.body.experience),
        licenseExpiry: new Date(rq.body.licenseExpiry),
        licenseIssuedDate: new Date(rq.body.licenseIssuedDate),
      },
    });
    return completeProfile;
  }
}
