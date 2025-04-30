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

    //uploading data to cloudinary
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

export async function findResidentByGroupHome(req: Request, res: Response, next: NextFunction) {
  const { groupHomeId } = req.params;
  try {
    if (!groupHomeId) {
      return next(new AppError('Provide valid home id', 400));
    }

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

export async function deleteResident(req: Request, res: Response, next: NextFunction) {
  const { clientId } = req.params;
  if (!clientId) {
    return next(new AppError('Malformed url request.', 400));
  }
  try {
    const foundClient = await findResidentById(req.app.get('db'), Number(clientId));
    if (!foundClient) {
      return next(new AppError('Could not find resident', 404));
    }

    //deleting images from cloudinary
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

    const deletedResident = await deleteClient(req.app.get('db'), Number(clientId));
    res.status(200).json({ message: 'Resident deleted successfully', resident: deletedResident });
  } catch (err: any) {
    return next(new AppError(err.message || 'Unknown error occurred while deleting resident', 500));
  }
}

export async function editResident(req: Request, res: Response, next: NextFunction) {
  const { clientId } = req.params;
  const residentData: ResidentFetch = req.body;

  console.log(residentData);
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

    for (const key in residentData) {
      if (
        Object.prototype.hasOwnProperty.call(residentData, key) &&
        residentData[key as keyof ResidentFetch] !== clientToEdit[key as keyof ResidentFetch]
      ) {
        updatedFields[key as keyof ResidentFetch] = residentData[key as keyof ResidentFetch];
      }
    }

    function toStringArray(value: unknown): string[] {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        return value.split(',').map((s) => s.trim());
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
