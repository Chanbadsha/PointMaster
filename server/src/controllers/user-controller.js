import { updateProfileSchema } from '../validators/user-validator.js';
import { upsertUser, updateUser } from '../services/user-service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function getProfile(req, res) {
  try {
    const user = await upsertUser(req.user.id, req.user);

    const profile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      linkedPlayerId: user.linkedPlayerId,
      createdAt: user.createdAt,
    };

    return successResponse(res, { profile });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch profile', [error.message], 500);
  }
}

export async function updateProfile(req, res) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message);
      return errorResponse(res, 'Validation failed', errors, 422);
    }

    await upsertUser(req.user.id, req.user);

    const updated = await updateUser(req.user.id, parsed.data);

    const profile = {
      id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      image: updated.image,
      linkedPlayerId: updated.linkedPlayerId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    return successResponse(res, { profile }, 'Profile updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update profile', [error.message], 500);
  }
}
