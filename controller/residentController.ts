import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import {
  ResidentDbInsert,
  ResidentFetch,
  ResidentInsert,
} from '../models/interfaces/resident.interface.js';
import {
  findResidentByHome,
  addResident,
  findResident,
  findResidentById,
  deleteClient,
  updateResidentById,
} from '../models/residentModel.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { getSingleGroupHome } from '../models/grouphomeModel.js';
import cloudinary from '../utils/cloudinary.js';

/**
 * Add a new resident to the system.
 * Validates required fields, checks for duplicates,
 * uploads image to Cloudinary if provided,
 * formats data, and inserts into the database.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export async function addResidentData(req: Request, res: Response, next: NextFunction) {
  let data = req.body;

  try {
    const resident: ResidentInsert = data;

    if (!resident.firstName || !resident.lastName || !resident.dateOfBirth) {
      return next(new AppError('Missing fields.', 400));
    }

    const residentExists = await findResident(
      req.app.get('db'),
      resident.firstName,
      resident.lastName,
      resident.dateOfBirth
    );
    if (residentExists) {
      return next(new AppError('Resident already exists', 400));
    }

    // Upload image to Cloudinary if a file is provided
    if (req.file?.buffer) {
      const residentGroupHome = await getSingleGroupHome(
        req.app.get('db'),
        resident.groupHomeId.toString()
      );
      try {
        const result = await uploadToCloudinary(
          req.file!.buffer,
          `${residentGroupHome.name}/groupHome_images`
        );
        resident.public_id = result.public_id;
        resident.image_url = result.secure_url;
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(err, 'cannot upload the file to cloudinary');
        }
      }
    }

    // Format resident data for database insertion
    const { primaryDiagnosis, allergies, ...rest } = resident;
    const dbResident = {
      ...rest,
      primaryDiagnosis: JSON.stringify(primaryDiagnosis ?? []),
      allergies: JSON.stringify(allergies ?? []),
    };

    const addedResident = await addResident(req.app.get('db'), dbResident);
    res.status(201).json({ message: 'Resident added successfully', resident: addedResident });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return next(new AppError(err.message || 'Could not add resident', 500));
    }
    return next(new AppError('Unknown error occurred while adding resident', 500));
  }
}

/**
 * Retrieve all residents assigned to a specific group home.
 * Validates the groupHomeId parameter and queries the database.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export async function findResidentByGroupHome(req: Request, res: Response, next: NextFunction) {
  const { groupHomeId } = req.params;
  try {
    // Validate groupHomeId parameter
    if (!groupHomeId) {
      return next(new AppError('Provide valid home id', 400));
    }

    // Query database for residents by groupHomeId
    const residents: ResidentFetch[] = await findResidentByHome(
      req.app.get('db'),
      Number(groupHomeId)
    );

    if (residents.length === 0) {
      res.status(200).json({ message: 'no resident found', residentsData: [] });
    }

    res.status(200).json({ message: 'success', residentsData: residents });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return next(new AppError(err.message || 'Could not find resident', 500));
    }
    return next(new AppError('Unknown error occurred while finding residents', 500));
  }
}

/**
 * Delete a resident record along with associated image from Cloudinary.
 * Validates clientId, deletes image from Cloudinary if exists,
 * and removes resident record from the database.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export async function deleteResident(req: Request, res: Response, next: NextFunction) {
  const { clientId } = req.params;
  // Validate clientId parameter
  if (!clientId) {
    return next(new AppError('Malformed url request.', 400));
  }
  try {
    const foundClient = await findResidentById(req.app.get('db'), Number(clientId));
    if (!foundClient) {
      return next(new AppError('Could not find resident', 404));
    }

    // Attempt to delete image from Cloudinary if public_id exists
    if (foundClient.public_id) {
      try {
        const cloudinaryResult = await cloudinary.uploader.destroy(`${foundClient.public_id}`);
      } catch (err: unknown) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error deleting from Cloudinary:', err);
        }
        //TODO:log errors to a login service
      }
    }

    // Delete resident record from database
    const deletedResident = await deleteClient(req.app.get('db'), Number(clientId));
    res.status(200).json({ message: 'Resident deleted successfully', resident: deletedResident });
  } catch (err: any) {
    return next(new AppError(err.message || 'Unknown error occurred while deleting resident', 500));
  }
}

/**
 * Fetch a single resident's detailed information by their ID.
 * Validates clientId and fetches the resident record.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export async function getSingleClient(req: Request, res: Response, next: NextFunction) {
  const { clientId } = req.params;
  // Validate clientId parameter and fetch record
  if (!clientId) {
    return next(new AppError('Malformed url request.', 400));
  }
  try {
    const foundClient = await findResidentById(req.app.get('db'), Number(clientId));
    if (!foundClient) {
      return next(new AppError('Could not find resident', 404));
    }
    res.status(200).json({ message: 'Client found', client: foundClient });
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error getting clients:', err);
      //TODO:log errors to a login service
    }
    return next(new AppError(err.message || 'Unknown error occurred while getSingleClient', 500));
  }
}

/**
 * Edit an existing resident's data in the database.
 * Validates clientId, finds the resident record,
 * handles image replacement via Cloudinary if a new file is provided,
 * identifies and applies only modified fields,
 * normalizes array fields, and commits updates.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export async function editResident(req: Request, res: Response, next: NextFunction) {
  const { clientId } = req.params;
  const residentData: ResidentFetch = req.body;

  console.log('recieved:', residentData);
  // Validate clientId and find resident record
  if (!clientId) {
    return next(new AppError('Malformed url request.', 400));
  }

  try {
    const clientToEdit = await findResidentById(req.app.get('db'), Number(clientId));
    if (!clientToEdit) {
      return next(new AppError('Could not find resident', 404));
    }

    type ResidentUpdatePayload = Partial<Record<keyof ResidentFetch, any>>;
    const updatedFields: ResidentUpdatePayload = {};

    // Handle image replacement via Cloudinary if a new file is provided
    if (req.file?.buffer) {
      const residentGroupHome = await getSingleGroupHome(
        req.app.get('db'),
        clientToEdit.groupHomeId.toString()
      );
      try {
        const result = await uploadToCloudinary(
          req.file!.buffer,
          `${residentGroupHome.name}/groupHome_images`
        );
        updatedFields.public_id = result.public_id;
        updatedFields.image_url = result.secure_url;
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(err, 'cannot upload the file to cloudinary');
        }
      }
    }

    // Identify and apply only modified fields to be updated
    for (const key in residentData) {
      if (
        Object.prototype.hasOwnProperty.call(residentData, key) &&
        residentData[key as keyof ResidentFetch] !== clientToEdit[key as keyof ResidentFetch]
      ) {
        updatedFields[key as keyof ResidentFetch] = residentData[key as keyof ResidentFetch];
      }
    }

    // Normalize fields that are expected to be arrays before storing
    function toStringArray(value: unknown): string[] {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : value.split(',').map((s) => s.trim());
        } catch {
          return value.split(',').map((s) => s.trim());
        }
      }
      return [];
    }

    if ('primaryDiagnosis' in updatedFields) {
      updatedFields.primaryDiagnosis = JSON.stringify(
        toStringArray(updatedFields.primaryDiagnosis)
      );
    }
    if ('allergies' in updatedFields) {
      updatedFields.allergies = JSON.stringify(toStringArray(updatedFields.allergies));
    }

    if (Object.keys(updatedFields).length === 0) {
      res.status(200).json({ message: 'No changes detected.' });
      return;
    }
    // Commit updates to the database
    const editedClient = await updateResidentById(
      req.app.get('db'),
      Number(clientId),
      updatedFields
    );
    res.status(200).json({ message: 'Successfully updated', resident: editedClient });
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.message || 'Error deleting resident', 500);
    }
    return next(new AppError(err.message || 'Unknown error occurred while deleting resident', 500));
  }
}
