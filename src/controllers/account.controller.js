import { User } from "../models/User.js";
import { Commerce } from "../models/Commerce.js";
import { ROLES } from "../utils/constants.js";
import { success, fail } from "../utils/apiResponse.js";

export async function getMyProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return fail(res, { statusCode: 404, message: "Usuario no encontrado." });
    }

    const profile = user.toSafeObject();

    if (user.role === ROLES.COMMERCE) {
      const commerce = await Commerce.findOne({ user: user._id }).populate("commerceType", "name icon");
      profile.commerce = commerce;
    }

    if (user.role === ROLES.DELIVERY) {
      profile.isAvailable = user.isAvailable;
    }

    return success(res, { data: profile });
  } catch (err) {
    return next(err);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return fail(res, { statusCode: 404, message: "Usuario no encontrado." });
    }

    if (user.role === ROLES.COMMERCE) {
      const { email, phone, openingTime, closingTime } = req.body;
      const commerce = await Commerce.findOne({ user: user._id });

      if (email) user.email = email.toLowerCase();
      if (phone) user.phone = phone;
      if (commerce) {
        if (openingTime) commerce.openingTime = openingTime;
        if (closingTime) commerce.closingTime = closingTime;
        if (req.file) commerce.logo = `/uploads/${req.file.filename}`;
        await commerce.save();
      }

      await user.save();
      return success(res, { message: "Perfil actualizado correctamente.", data: { user: user.toSafeObject(), commerce } });
    }

    const { firstName, lastName, phone } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (req.file) user.profileImage = `/uploads/${req.file.filename}`;

    await user.save();
    return success(res, { message: "Perfil actualizado correctamente.", data: user.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}
